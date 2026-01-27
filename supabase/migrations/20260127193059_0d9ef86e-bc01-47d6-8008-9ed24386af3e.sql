-- Link existing users to their empresas
UPDATE public.profiles 
SET empresa_id = (SELECT id FROM public.empresas WHERE nombre = 'Rentable')
WHERE email = 'jose.lopez@rentable.mx';

UPDATE public.profiles 
SET empresa_id = (SELECT id FROM public.empresas WHERE nombre = 'Tauro')
WHERE email = 'hm28443@gmail.com';

-- Add empresa_id column to profiles for all nueva empresa_id references
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Update billboards to use empresa_id based on owner's empresa
UPDATE public.billboards b
SET empresa_id = p.empresa_id
FROM public.profiles p
WHERE b.owner_id = p.user_id AND p.empresa_id IS NOT NULL;