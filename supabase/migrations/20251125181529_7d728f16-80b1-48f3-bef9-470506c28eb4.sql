-- Crear usuarios solo si no existen
DO $$
DECLARE
  advertiser_user_id UUID;
  owner_user_id UUID;
  advertiser_email TEXT := 'jose.lopez@h3dm.com.mx';
  owner_email TEXT := 'jochelo@adavailable.com';
BEGIN
  -- Verificar y crear usuario anunciante
  SELECT id INTO advertiser_user_id FROM auth.users WHERE email = advertiser_email;
  
  IF advertiser_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      advertiser_email,
      crypt('h3.2025.pruebas', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"José López"}',
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO advertiser_user_id;

    -- Crear perfil para anunciante
    INSERT INTO public.profiles (
      user_id,
      name,
      email,
      role,
      empresa,
      status
    ) VALUES (
      advertiser_user_id,
      'José López',
      advertiser_email,
      'advertiser',
      'H3DM',
      'active'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Asignar rol de advertiser
    INSERT INTO public.user_roles (
      user_id,
      role
    ) VALUES (
      advertiser_user_id,
      'advertiser'
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Verificar y crear usuario propietario
  SELECT id INTO owner_user_id FROM auth.users WHERE email = owner_email;
  
  IF owner_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      owner_email,
      crypt('@dav4ilab3.2025', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"José Chelo"}',
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO owner_user_id;

    -- Crear perfil para propietario
    INSERT INTO public.profiles (
      user_id,
      name,
      email,
      role,
      empresa,
      status
    ) VALUES (
      owner_user_id,
      'José Chelo',
      owner_email,
      'owner',
      'AdAvailable',
      'active'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Asignar rol de owner
    INSERT INTO public.user_roles (
      user_id,
      role
    ) VALUES (
      owner_user_id,
      'owner'
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

END $$;