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
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a temporary column for the new role type
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_new public.user_role;

-- Migrate existing role data
UPDATE public.profiles 
SET role_new = CASE 
    WHEN role = 'owner' THEN 'owner'::public.user_role
    WHEN role = 'advertiser' THEN 'advertiser'::public.user_role
    WHEN role = 'admin' THEN 'admin'::public.user_role
    WHEN role = 'superadmin' THEN 'superadmin'::public.user_role
    ELSE 'advertiser'::public.user_role
END;

-- Drop the old role column and rename the new one
ALTER TABLE public.profiles DROP COLUMN role;
ALTER TABLE public.profiles RENAME COLUMN role_new TO role;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'advertiser'::public.user_role;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

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