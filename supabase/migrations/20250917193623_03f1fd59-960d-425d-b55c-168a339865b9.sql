-- Create separate superadmin table to avoid conflicts
CREATE TABLE IF NOT EXISTS public.superadmins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active'
);

-- Enable RLS but allow superadmins to manage themselves
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- Simple policy for superadmins table
CREATE POLICY "Superadmins can manage superadmins table" ON public.superadmins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.superadmins WHERE user_id = auth.uid())
  );

-- Simplify profiles table policies - remove the complex ones that may be blocking access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can create any profile" ON public.profiles;

-- Create simpler, more permissive policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert the superadmin user
INSERT INTO public.superadmins (user_id, email, name)
SELECT 
  auth.users.id,
  'carlos.admin@adavailable.com',
  'Carlos Superadmin'
FROM auth.users 
WHERE auth.users.email = 'carlos.admin@adavailable.com'
ON CONFLICT (user_id) DO NOTHING;

-- Reset existing users to have proper roles
UPDATE public.profiles 
SET role = 'advertiser'
WHERE role IS NULL OR role NOT IN ('owner', 'advertiser');

-- Set owner emails back to owner role
UPDATE public.profiles 
SET role = 'owner'
WHERE email = 'hm28443@gmail.com';