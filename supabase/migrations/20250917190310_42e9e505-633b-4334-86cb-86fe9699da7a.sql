-- Create remaining tables
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
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission) VALUES
('superadmin', 'manage_users'),
('superadmin', 'manage_roles'),
('superadmin', 'manage_system'),
('superadmin', 'view_logs'),
('superadmin', 'reset_passwords'),
('admin', 'manage_users'),
('admin', 'view_logs'),
('admin', 'reset_passwords')
ON CONFLICT (role, permission) DO NOTHING;

-- Create permission checking function
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
    
    IF NOT has_perm THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_permissions 
            WHERE user_id = user_uuid AND permission = perm
        ) INTO has_perm;
    END IF;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Create audit logging function
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

-- RLS Policies
CREATE POLICY "Superadmins can manage role permissions" ON public.role_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

CREATE POLICY "Superadmins can manage user permissions" ON public.user_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_users'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Superadmins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'manage_system'));