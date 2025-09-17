-- Create or update superadmin user safely
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- First, check if the user already exists in auth.users
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'carlos.admin@adavailable.com';
    
    -- If user doesn't exist, create it
    IF user_uuid IS NULL THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'carlos.admin@adavailable.com',
            crypt('Carlos9709', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO user_uuid;
    END IF;
    
    -- Insert or update profile
    INSERT INTO public.profiles (
        user_id,
        name,
        email,
        role,
        status,
        created_by
    ) VALUES (
        user_uuid,
        'Carlos Admin',
        'carlos.admin@adavailable.com',
        'superadmin'::user_role,
        'active'::user_status,
        user_uuid
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'superadmin'::user_role,
        status = 'active'::user_status,
        name = 'Carlos Admin',
        email = 'carlos.admin@adavailable.com';
    
END $$;

-- Ensure role permissions exist for superadmin
INSERT INTO public.role_permissions (role, permission) VALUES
    ('superadmin', 'manage_users'),
    ('superadmin', 'manage_system'),
    ('superadmin', 'manage_roles'),
    ('superadmin', 'view_audit_logs'),
    ('superadmin', 'manage_billing'),
    ('superadmin', 'full_access')
ON CONFLICT (role, permission) DO NOTHING;