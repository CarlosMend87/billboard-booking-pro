-- Enhanced superadmin system (avoiding existing types)

-- Enhanced superadmins table
ALTER TABLE public.superadmins 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone;

-- Create permission enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.permission AS ENUM (
        'manage_users', 'manage_roles', 'manage_system', 'view_logs', 
        'reset_passwords', 'suspend_users', 'export_data', 'import_data'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced profiles table for better user management  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Role permissions mapping table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL, -- using text instead of enum to avoid conflicts
    permission public.permission NOT NULL,
    UNIQUE(role, permission)
);

-- Individual user permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    permission public.permission NOT NULL,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, permission)
);

-- Password reset requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    requested_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission) VALUES
('superadmin', 'manage_users'),
('superadmin', 'manage_roles'), 
('superadmin', 'manage_system'),
('superadmin', 'view_logs'),
('superadmin', 'reset_passwords'),
('superadmin', 'suspend_users'),
('superadmin', 'export_data'),
('superadmin', 'import_data'),
('admin', 'manage_users'),
('admin', 'view_logs'),
('admin', 'reset_passwords'),
('admin', 'suspend_users'),
('owner', 'manage_users'),
('advertiser', 'view_logs')
ON CONFLICT (role, permission) DO NOTHING;

-- Helper functions for permission checking
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid uuid, perm permission)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Get user role from profiles 
    SELECT COALESCE(p.role::text, 'advertiser') INTO user_role 
    FROM public.profiles p WHERE p.user_id = user_uuid;
    
    -- Check if user is superadmin
    IF EXISTS(SELECT 1 FROM public.superadmins WHERE user_id = user_uuid AND status = 'active') THEN
        user_role := 'superadmin';
    END IF;
    
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
$$;

-- Function to get all users with filtering
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_term text DEFAULT NULL,
    role_filter text DEFAULT NULL,
    status_filter text DEFAULT NULL,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    name text,
    email text,
    role text,
    status text,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone,
    phone text,
    avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        COALESCE(p.role::text, 'advertiser') as role,
        COALESCE(p.status::text, 'active') as status,
        p.last_login_at,
        p.created_at,
        p.phone,
        p.avatar_url
    FROM public.profiles p
    WHERE 
        (search_term IS NULL OR 
         p.name ILIKE '%' || search_term || '%' OR 
         p.email ILIKE '%' || search_term || '%')
        AND (role_filter IS NULL OR p.role::text = role_filter)
        AND (status_filter IS NULL OR p.status::text = status_filter)
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
    action_type text,
    resource_type text DEFAULT NULL,
    resource_id uuid DEFAULT NULL,
    details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), action_type, resource_type, resource_id, details);
END;
$$;

-- RLS Policies for new tables

-- Role permissions policies  
CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

-- User permissions policies
CREATE POLICY "Superadmins can manage all permissions" ON public.user_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Password reset policies
CREATE POLICY "Superadmins can manage password resets" ON public.password_reset_requests
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));