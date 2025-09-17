-- Simple superadmin system setup

-- Enhanced superadmins table
ALTER TABLE public.superadmins 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone;

-- Add columns to profiles for user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Simple role permissions table using text
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    permission text NOT NULL,
    UNIQUE(role, permission)
);

-- Simple user permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    permission text NOT NULL,
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

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Insert basic role permissions
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
('owner', 'manage_billboards'),
('advertiser', 'create_campaigns')
ON CONFLICT (role, permission) DO NOTHING;

-- Simple permission check function
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

-- Get current user profile function
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
    id uuid,
    user_id uuid,
    name text,
    role text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.name,
    COALESCE(p.role::text, 'advertiser') as role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$;

-- RLS Policies
CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
    FOR ALL USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage user permissions" ON public.user_permissions  
    FOR ALL USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage password resets" ON public.password_reset_requests
    FOR ALL USING (public.is_superadmin(auth.uid()));