-- Superadmin system with existing permissions only

-- Enhanced superadmins table
ALTER TABLE public.superadmins 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone;

-- Add columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Create tables without enum dependency
CREATE TABLE IF NOT EXISTS public.superadmin_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    permission text NOT NULL,
    UNIQUE(role, permission)
);

CREATE TABLE IF NOT EXISTS public.superadmin_user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id uuid NOT NULL,
    permission text NOT NULL,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, permission)
);

CREATE TABLE IF NOT EXISTS public.superadmin_password_resets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    requested_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.superadmin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_password_resets ENABLE ROW LEVEL SECURITY;

-- Insert basic permissions using text
INSERT INTO public.superadmin_permissions (role, permission) VALUES
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
('owner', 'manage_billboards'),
('advertiser', 'create_campaigns')
ON CONFLICT (role, permission) DO NOTHING;

-- Functions for superadmin system
CREATE OR REPLACE FUNCTION public.is_superadmin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.superadmins 
        WHERE user_id = user_uuid AND status = 'active'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_superadmin_permission(user_uuid uuid, perm text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Check if user is superadmin first
    IF public.is_superadmin(user_uuid) THEN
        RETURN TRUE;
    END IF;
    
    -- Get user role from profiles
    SELECT COALESCE(p.role::text, 'advertiser') INTO user_role 
    FROM public.profiles p WHERE p.user_id = user_uuid;
    
    -- Check role-based permission
    SELECT EXISTS (
        SELECT 1 FROM public.superadmin_permissions 
        WHERE role = user_role AND permission = perm
    ) INTO has_perm;
    
    -- Check individual permissions
    IF NOT has_perm THEN
        SELECT EXISTS (
            SELECT 1 FROM public.superadmin_user_permissions 
            WHERE user_id = user_uuid AND permission = perm
        ) INTO has_perm;
    END IF;
    
    RETURN has_perm;
END;
$$;

-- RLS Policies for superadmin tables
CREATE POLICY "Only superadmins can manage permissions" ON public.superadmin_permissions
    FOR ALL USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Only superadmins can manage user permissions" ON public.superadmin_user_permissions  
    FOR ALL USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Only superadmins can manage password resets" ON public.superadmin_password_resets
    FOR ALL USING (public.is_superadmin(auth.uid()));