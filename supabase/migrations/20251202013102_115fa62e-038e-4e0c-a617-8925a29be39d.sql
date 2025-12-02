-- Eliminar el constraint anterior si existe
ALTER TABLE public.campañas DROP CONSTRAINT IF EXISTS campañas_status_check;

-- Crear nuevo constraint que permita draft, active e inactive
ALTER TABLE public.campañas 
ADD CONSTRAINT campañas_status_check 
CHECK (status IN ('draft', 'active', 'inactive'));