-- Add empresa (company) field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa TEXT;

-- Set default value "Prueba" for existing users
UPDATE public.profiles 
SET empresa = 'Prueba' 
WHERE empresa IS NULL;