-- Ensure profiles table has the most restrictive RLS policies
-- First, let's check if there are any overly permissive policies and replace them

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create more restrictive policies with explicit authentication checks
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update only their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure no public access is possible by explicitly denying anonymous access
CREATE POLICY "Deny all access to anonymous users"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Create a security definer function to safely get current user profile data
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  name text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.name,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;