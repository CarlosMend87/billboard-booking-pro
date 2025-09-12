-- Create user roles enum if not exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'owner', 'advertiser');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'inactive');

-- Create permissions enum
CREATE TYPE public.permission AS ENUM (
    'manage_users', 'manage_roles', 'manage_billboards', 'manage_campaigns', 
    'view_analytics', 'manage_system', 'export_data', 'manage_finances'
);

-- Update profiles table to include more fields for user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status public.user_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(user_id),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Drop the default constraint first, then change the type
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING 
    CASE 
        WHEN role = 'owner' THEN 'owner'::public.user_role
        WHEN role = 'advertiser' THEN 'advertiser'::public.user_role
        WHEN role = 'admin' THEN 'admin'::public.user_role
        WHEN role = 'superadmin' THEN 'superadmin'::public.user_role
        ELSE 'advertiser'::public.user_role
    END;
-- Set the new default
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'advertiser'::public.user_role;

-- Create user_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    permission public.permission NOT NULL,
    granted_by UUID REFERENCES public.profiles(user_id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, permission)
);

-- Create role_permissions table for role-based permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role public.user_role NOT NULL,
    permission public.permission NOT NULL,
    UNIQUE(role, permission)
);

-- Create audit_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create password_reset_requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    requested_by UUID REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission) VALUES
    ('superadmin', 'manage_users'),
    ('superadmin', 'manage_roles'),
    ('superadmin', 'manage_billboards'),
    ('superadmin', 'manage_campaigns'),
    ('superadmin', 'view_analytics'),
    ('superadmin', 'manage_system'),
    ('superadmin', 'export_data'),
    ('superadmin', 'manage_finances'),
    ('admin', 'manage_billboards'),
    ('admin', 'manage_campaigns'),
    ('admin', 'view_analytics'),
    ('admin', 'export_data'),
    ('owner', 'manage_billboards'),
    ('owner', 'view_analytics'),
    ('advertiser', 'manage_campaigns')
ON CONFLICT (role, permission) DO NOTHING;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, perm public.permission)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
    action_type TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), action_type, resource_type, resource_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for user_permissions
CREATE POLICY "Superadmins can manage all permissions" ON public.user_permissions
    FOR ALL TO authenticated
    USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- RLS Policies for role_permissions  
CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
    FOR ALL TO authenticated
    USING (public.user_has_permission(auth.uid(), 'manage_roles'));

-- RLS Policies for audit_logs
CREATE POLICY "Superadmins can view all audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.user_has_permission(auth.uid(), 'manage_system'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- RLS Policies for password_reset_requests
CREATE POLICY "Superadmins can manage password resets" ON public.password_reset_requests
    FOR ALL TO authenticated
    USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Update profiles RLS policies for superadmin access
DROP POLICY IF EXISTS "Users can view their own profile or superadmins can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or superadmins can view all" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id OR 
        public.user_has_permission(auth.uid(), 'manage_users')
    );

DROP POLICY IF EXISTS "Users can update their own profile or superadmins can update all" ON public.profiles;
CREATE POLICY "Users can update their own profile or superadmins can update all" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id OR 
        public.user_has_permission(auth.uid(), 'manage_users')
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        public.user_has_permission(auth.uid(), 'manage_users')
    );

-- Superadmins can insert new profiles
CREATE POLICY "Superadmins can create user profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.user_has_permission(auth.uid(), 'manage_users'));

-- Function to get all users for superadmin
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_term TEXT DEFAULT NULL,
    role_filter public.user_role DEFAULT NULL,
    status_filter public.user_status DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    name TEXT,
    email TEXT,
    role public.user_role,
    status public.user_status,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;