-- Update the trigger to work correctly
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Create a simpler approach using a function that gets called on login
CREATE OR REPLACE FUNCTION public.update_last_login(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE user_id = user_uuid;
END;
$$;