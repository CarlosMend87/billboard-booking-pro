-- Fix infinite recursion in superadmins RLS using SECURITY DEFINER function

-- 1) Create a SECURITY DEFINER helper that safely checks superadmin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_active_superadmin(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.superadmins
    WHERE user_id = _user AND status = 'active'
  );
$$;

-- 2) Replace problematic policy that referenced the same table directly
DROP POLICY IF EXISTS "Superadmins can manage all superadmin records" ON public.superadmins;

-- Keep SELECT for self-check (no recursion here)
DROP POLICY IF EXISTS "Users can check their own superadmin status" ON public.superadmins;
CREATE POLICY "Users can check their own superadmin status" ON public.superadmins
  FOR SELECT
  USING (user_id = auth.uid());

-- Split write permissions by command and use the helper function
CREATE POLICY "Superadmins can insert superadmin records" ON public.superadmins
  FOR INSERT
  WITH CHECK (public.is_active_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update superadmin records" ON public.superadmins
  FOR UPDATE
  USING (public.is_active_superadmin(auth.uid()))
  WITH CHECK (public.is_active_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete superadmin records" ON public.superadmins
  FOR DELETE
  USING (public.is_active_superadmin(auth.uid()));
