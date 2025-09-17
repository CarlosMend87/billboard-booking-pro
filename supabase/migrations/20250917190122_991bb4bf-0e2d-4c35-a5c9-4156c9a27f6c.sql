-- Create enums for user roles and permissions
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'owner', 'advertiser');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE permission AS ENUM ('manage_users', 'manage_roles', 'manage_system', 'view_audit_logs', 'reset_passwords');

-- Update profiles table with enhanced user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'advertiser',
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(user_id);

-- Create role permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission permission NOT NULL,
  UNIQUE(role, permission)
);

-- Create individual user permissions table for granular control
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  permission permission NOT NULL,
  granted_by UUID REFERENCES public.profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password reset requests table
CREATE TABLE public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  requested_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission) VALUES
('superadmin', 'manage_users'),
('superadmin', 'manage_roles'),
('superadmin', 'manage_system'),
('superadmin', 'view_audit_logs'),
('superadmin', 'reset_passwords'),
('admin', 'manage_users'),
('admin', 'view_audit_logs'),
('admin', 'reset_passwords');

-- Create the superadmin user
INSERT INTO public.profiles (user_id, email, name, role, status) 
SELECT 
  auth.users.id,
  'carlos.admin@adavailable.com',
  'Carlos Superadmin',
  'superadmin'::user_role,
  'active'::user_status
FROM auth.users 
WHERE auth.users.email = 'carlos.admin@adavailable.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'superadmin'::user_role,
  status = 'active'::user_status;

-- Enable RLS on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, perm permission)
RETURNS BOOLEAN AS $$
DECLARE
    user_role public.user_role;
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM public.profiles WHERE user_id = user_uuid;
    
    -- Check role-based permission
    SELECT EXISTS (
        SELECT 1 FROM public.role_permissions 
        WHERE role = user_role AND permission = perm
    ) INTO has_perm;
    
    -- If not found in role permissions, check individual permissions
    IF NOT has_perm THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_permissions 
            WHERE user_id = user_uuid AND permission = perm
        ) INTO has_perm;
    END IF;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Create function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
    action_type TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), action_type, resource_type, resource_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get all users (for superadmin)
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_term TEXT DEFAULT NULL,
    role_filter user_role DEFAULT NULL,
    status_filter user_status DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    email TEXT,
    role user_role,
    status user_status,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    -- Check if user has permission
    IF NOT public.user_has_permission(auth.uid(), 'manage_users') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.name,
        p.email,
        p.role,
        p.status,
        p.last_login_at,
        p.created_at,
        p.phone,
        p.avatar_url
    FROM public.profiles p
    WHERE 
        (search_term IS NULL OR 
         p.name ILIKE '%' || search_term || '%' OR 
         p.email ILIKE '%' || search_term || '%')
        AND (role_filter IS NULL OR p.role = role_filter)
        AND (status_filter IS NULL OR p.status = status_filter)
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update last login function and trigger
CREATE OR REPLACE FUNCTION public.update_last_login(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for auth events
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the last_login_at timestamp when user signs in
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies
-- Profiles table policies (updated)
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Deny all access to anonymous users
CREATE POLICY "Deny all access to anonymous users" ON public.profiles
    FOR ALL USING (FALSE);

-- Users can view their own profile or superadmins can view all
CREATE POLICY "Users can view their own profile or superadmins can view all" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id OR public.user_has_permission(auth.uid(), 'manage_users'));

-- Users can update their own profile or superadmins can update all
CREATE POLICY "Users can update their own profile or superadmins can update al" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.user_has_permission(auth.uid(), 'manage_users'))
    WITH CHECK (auth.uid() = user_id OR public.user_has_permission(auth.uid(), 'manage_users'));

-- Users can insert only their own profile
CREATE POLICY "Users can insert only their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Superadmins can create user profiles
CREATE POLICY "Superadmins can create user profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'manage_users'));

-- Role permissions policies
CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

-- User permissions policies
CREATE POLICY "Superadmins can manage all permissions" ON public.user_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Audit logs policies
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Superadmins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'manage_system'));

-- Password reset policies
CREATE POLICY "Superadmins can manage password resets" ON public.password_reset_requests
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));