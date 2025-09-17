-- Create initial superadmin user
-- Note: This creates a user directly in the auth schema for initial setup
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
);

-- Create the profile for the superadmin user
INSERT INTO public.profiles (
  user_id,
  name,
  email,
  role,
  status,
  created_by
) 
SELECT 
  id,
  'Carlos Admin',
  'carlos.admin@adavailable.com',
  'superadmin'::user_role,
  'active'::user_status,
  id
FROM auth.users 
WHERE email = 'carlos.admin@adavailable.com';

-- Grant all necessary permissions to superadmin role
INSERT INTO public.role_permissions (role, permission) VALUES
  ('superadmin', 'manage_users'),
  ('superadmin', 'manage_system'),
  ('superadmin', 'manage_roles'),
  ('superadmin', 'view_audit_logs'),
  ('superadmin', 'manage_billing'),
  ('superadmin', 'full_access')
ON CONFLICT (role, permission) DO NOTHING;