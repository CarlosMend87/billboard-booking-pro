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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;