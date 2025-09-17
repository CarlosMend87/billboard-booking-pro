-- Create function to setup superadmin
CREATE OR REPLACE FUNCTION public.setup_superadmin(
    admin_email TEXT,
    admin_password TEXT DEFAULT 'Carlos9709'
)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make this function executable by authenticated users temporarily
GRANT EXECUTE ON FUNCTION public.setup_superadmin TO authenticated;

-- Create a simple test to verify the user can access
SELECT public.setup_superadmin('carlos.admin@adavailable.com');