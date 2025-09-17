-- Fix circular RLS policy for superadmins table

-- Drop the existing circular policy
DROP POLICY IF EXISTS "Superadmins can manage superadmins table" ON public.superadmins;

-- Create new policies that allow users to read their own superadmin record
-- but only superadmins can modify the table
CREATE POLICY "Users can check their own superadmin status" ON public.superadmins
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all superadmin records" ON public.superadmins
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM public.superadmins sa 
            WHERE sa.user_id = auth.uid() AND sa.status = 'active'
        )
    );