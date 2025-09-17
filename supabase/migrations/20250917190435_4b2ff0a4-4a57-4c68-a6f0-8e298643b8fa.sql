-- Create tables without enum conflicts
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission permission NOT NULL,
  UNIQUE(role, permission)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  permission permission NOT NULL,
  granted_by UUID REFERENCES public.profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Insert only basic permissions that exist
INSERT INTO public.role_permissions (role, permission) VALUES
('superadmin', 'manage_users'),
('superadmin', 'manage_roles'),
('superadmin', 'manage_system'),
('superadmin', 'reset_passwords')
ON CONFLICT (role, permission) DO NOTHING;

-- Create basic permission function
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, perm permission)
RETURNS BOOLEAN AS $$
DECLARE
    user_role public.user_role;
    has_perm BOOLEAN := FALSE;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE user_id = user_uuid;
    
    SELECT EXISTS (
        SELECT 1 FROM public.role_permissions 
        WHERE role = user_role AND permission = perm
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;