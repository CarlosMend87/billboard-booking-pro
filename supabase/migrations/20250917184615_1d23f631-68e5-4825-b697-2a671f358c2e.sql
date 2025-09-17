-- Create a function to update last login time
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the last_login_at timestamp when user signs in
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update last login on auth.users
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.update_user_last_login();