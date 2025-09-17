-- Create admin functions for user management
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_term TEXT DEFAULT NULL,
    role_filter user_role DEFAULT NULL,
    status_filter user_status DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    email TEXT,
    role user_role,
    status user_status,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    -- Check if user is superadmin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin') THEN
        RAISE EXCEPTION 'Insufficient permissions - superadmin required';
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

-- Update profiles RLS policies to be more specific
DROP POLICY IF EXISTS "Deny all access to anonymous users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or superadmins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile or superadmins can update al" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can create user profiles" ON public.profiles;

-- New comprehensive policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

CREATE POLICY "Users can update only their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can create any profile" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'superadmin')
    );