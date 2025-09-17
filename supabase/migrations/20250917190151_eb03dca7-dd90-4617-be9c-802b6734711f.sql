-- Create enums only if they don't exist
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission AS ENUM ('manage_users', 'manage_roles', 'manage_system', 'view_audit_logs', 'reset_passwords');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to profiles if they don't exist
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN status user_status DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN suspended_until TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN suspended_reason TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN created_by UUID REFERENCES public.profiles(user_id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create role permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission permission NOT NULL,
  UNIQUE(role, permission)
);

-- Create individual user permissions table for granular control
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  permission permission NOT NULL,
  granted_by UUID REFERENCES public.profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
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
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  requested_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Insert default role permissions (only if not exists)
INSERT INTO public.role_permissions (role, permission) VALUES
('superadmin', 'manage_users'),
('superadmin', 'manage_roles'),
('superadmin', 'manage_system'),
('superadmin', 'view_audit_logs'),
('superadmin', 'reset_passwords'),
('admin', 'manage_users'),
('admin', 'view_audit_logs'),
('admin', 'reset_passwords')
ON CONFLICT (role, permission) DO NOTHING;

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