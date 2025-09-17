-- Create function for logging actions
CREATE OR REPLACE FUNCTION public.log_user_action(
    action_type TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (auth.uid(), action_type, resource_type, resource_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;