-- Add role column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'advertiser';

-- Update the constraint to include new role values
-- First remove existing constraint if any
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with all possible roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('advertiser', 'owner', 'admin'));

-- Create index for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'advertiser' role if they don't have one
UPDATE public.profiles 
SET role = 'advertiser' 
WHERE role IS NULL;