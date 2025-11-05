-- Fix Critical Security Issues: Role Storage, Public Profile Exposure, and setup_superadmin Authorization

-- Step 1: Create app_role enum for the roles table
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'owner', 'advertiser');

-- Step 2: Create user_roles table (separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT user_id, role::text::app_role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Remove the dangerous "Anyone can view profiles" policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Step 6: Create proper RLS policies for profiles (authenticated users only see their own data)
DROP POLICY IF EXISTS "Users can view their own profile or superadmins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile only"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Update other profile policies to use has_role
DROP POLICY IF EXISTS "Users can update their own profile or superadmins can update al" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can create user profiles" ON public.profiles;

CREATE POLICY "Superadmins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Step 7: RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can assign non-superadmin roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin') AND
  role != 'superadmin'
);

CREATE POLICY "Only superadmins can assign superadmin role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin') AND
  role = 'superadmin'
);

CREATE POLICY "Superadmins can revoke non-superadmin roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin') AND
  role != 'superadmin'
);

CREATE POLICY "Superadmins can revoke superadmin role"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin') AND
  role = 'superadmin'
);

-- Step 8: Fix setup_superadmin function to require authorization
DROP FUNCTION IF EXISTS public.setup_superadmin(text, text);

CREATE OR REPLACE FUNCTION public.setup_superadmin(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_exists BOOLEAN := FALSE;
    user_uuid UUID;
    superadmin_exists BOOLEAN;
BEGIN
    -- Check if any superadmin already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles WHERE role = 'superadmin'
    ) INTO superadmin_exists;
    
    -- If superadmins exist, only allow existing superadmins to create more
    IF superadmin_exists THEN
        IF NOT public.has_role(auth.uid(), 'superadmin') THEN
            RAISE EXCEPTION 'Unauthorized: Only superadmins can create new superadmins';
        END IF;
    END IF;
    
    -- Check if user exists in auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = admin_email
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN 'Usuario no encontrado en auth.users. Debe crear primero el usuario con email: ' || admin_email;
    END IF;
    
    -- Get the user UUID
    SELECT id INTO user_uuid FROM auth.users WHERE email = admin_email;
    
    -- Insert into superadmins table
    INSERT INTO public.superadmins (user_id, email, name, status)
    VALUES (user_uuid, admin_email, 'Superadmin', 'active')
    ON CONFLICT (user_id) DO UPDATE SET
        email = admin_email,
        status = 'active';
    
    -- Insert superadmin role
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (user_uuid, 'superadmin', auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Ensure they have a profile
    INSERT INTO public.profiles (user_id, email, name, role, status)
    VALUES (user_uuid, admin_email, 'Superadmin', 'superadmin', 'active')
    ON CONFLICT (user_id) DO UPDATE SET
        email = admin_email,
        role = 'superadmin',
        status = 'active';
    
    RETURN 'Superadmin configurado exitosamente para: ' || admin_email;
END;
$$;

-- Step 9: Update user_has_permission to use has_role instead of querying profiles
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, perm permission)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Validate input
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has superadmin role (superadmins have all permissions)
    IF public.has_role(user_uuid, 'superadmin') THEN
        RETURN TRUE;
    END IF;
    
    -- Check role-based permissions for other roles
    SELECT EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        JOIN public.user_roles ur ON ur.role::text = rp.role::text
        WHERE ur.user_id = user_uuid AND rp.permission = perm
    ) INTO has_perm;
    
    -- Check individual permissions
    IF NOT has_perm THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_permissions 
            WHERE user_id = user_uuid AND permission = perm
        ) INTO has_perm;
    END IF;
    
    RETURN has_perm;
END;
$$;