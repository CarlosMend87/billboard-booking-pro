-- Create comprehensive superadmin system

-- Enhanced superadmins table if needed 
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='superadmins' AND column_name='permissions'
    ) THEN
        ALTER TABLE public.superadmins 
        ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN two_factor_enabled boolean DEFAULT false,
        ADD COLUMN last_activity timestamp with time zone;
    END IF;
END $$;

-- Create enum types for user management
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'owner', 'advertiser', 'editor', 'viewer');
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'inactive', 'pending');
CREATE TYPE public.permission AS ENUM (
    'manage_users', 'manage_roles', 'manage_system', 'view_logs', 
    'reset_passwords', 'suspend_users', 'export_data', 'import_data'
);

-- Enhanced profiles table for better user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'advertiser',
ADD COLUMN IF NOT EXISTS status public.user_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Role permissions mapping table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role public.user_role NOT NULL,
    permission public.permission NOT NULL,
    UNIQUE(role, permission)
);

-- Individual user permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission public.permission NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, permission)
);

-- Enhanced audit logs table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE TABLE public.audit_logs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id),
            action text NOT NULL,
            resource_type text,
            resource_id uuid,
            details jsonb,
            ip_address inet,
            user_agent text,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- Password reset requests table
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    requested_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
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
('admin', 'suspend_users')
ON CONFLICT (role, permission) DO NOTHING;

-- Helper functions for permission checking
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid uuid, perm permission)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Function to get all users with filtering
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_term text DEFAULT NULL,
    role_filter user_role DEFAULT NULL,
    status_filter user_status DEFAULT NULL,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    name text,
    email text,
    role user_role,
    status user_status,
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

-- Function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE user_id = user_uuid;
END;
$$;

-- Function to setup superadmin
CREATE OR REPLACE FUNCTION public.setup_superadmin(
    admin_email text,
    admin_password text DEFAULT 'Carlos9709'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_exists BOOLEAN := FALSE;
    user_uuid UUID;
BEGIN
    -- Check if user already exists in auth.users
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
    VALUES (user_uuid, admin_email, 'Carlos Superadmin', 'active')
    ON CONFLICT (user_id) DO UPDATE SET
        email = admin_email,
        name = 'Carlos Superadmin',
        status = 'active';
    
    -- Also ensure they have a profile (optional, for compatibility)
    INSERT INTO public.profiles (user_id, email, name, role, status)
    VALUES (user_uuid, admin_email, 'Carlos Superadmin', 'superadmin', 'active')
    ON CONFLICT (user_id) DO UPDATE SET
        email = admin_email,
        name = 'Carlos Superadmin',
        role = 'superadmin',
        status = 'active';
    
    RETURN 'Superadmin configurado exitosamente para: ' || admin_email;
END;
$$;

-- RLS Policies

-- Superadmins table policies
CREATE POLICY "Superadmins can manage superadmins table" ON public.superadmins
    FOR ALL USING (EXISTS(
        SELECT 1 FROM public.superadmins 
        WHERE user_id = auth.uid()
    ));

-- Role permissions policies  
CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

CREATE POLICY "Allow superadmin access to role_permissions" ON public.role_permissions
    FOR ALL USING (EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'superadmin'
    ));

-- User permissions policies
CREATE POLICY "Superadmins can manage all permissions" ON public.user_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Audit logs policies
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Superadmins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'manage_system'));

CREATE POLICY "Allow superadmin to view audit logs" ON public.audit_logs
    FOR SELECT USING (EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'superadmin'
    ));

-- Password reset policies
CREATE POLICY "Superadmins can manage password resets" ON public.password_reset_requests
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));

-- Enhanced profiles policies
CREATE POLICY "Users can view their own profile or superadmins can view all" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.user_has_permission(auth.uid(), 'manage_users')
    );

CREATE POLICY "Users can update their own profile or superadmins can update all" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        public.user_has_permission(auth.uid(), 'manage_users')
    ) 
    WITH CHECK (
        auth.uid() = user_id OR 
        public.user_has_permission(auth.uid(), 'manage_users')
    );

CREATE POLICY "Superadmins can create user profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'manage_users'));

-- Triggers for audit logging
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add updated_at triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;