-- Modificar tabla campañas para soportar borradores y múltiples estados

-- Hacer reserva_id nullable para permitir borradores sin reserva
ALTER TABLE public.campañas 
ALTER COLUMN reserva_id DROP NOT NULL;

-- Hacer fechas nullable para borradores
ALTER TABLE public.campañas 
ALTER COLUMN fecha_inicio DROP NOT NULL,
ALTER COLUMN fecha_fin DROP NOT NULL,
ALTER COLUMN dias_totales DROP NOT NULL;

-- Agregar campos para información de búsqueda/borrador
ALTER TABLE public.campañas 
ADD COLUMN IF NOT EXISTS propuesta TEXT,
ADD COLUMN IF NOT EXISTS metodo_busqueda TEXT;

-- Actualizar el campo status para incluir más estados
-- El valor por defecto será 'draft' para nuevas campañas
ALTER TABLE public.campañas 
ALTER COLUMN status SET DEFAULT 'draft';

-- Crear índice para mejorar búsquedas por advertiser y status
CREATE INDEX IF NOT EXISTS idx_campanas_advertiser_status 
ON public.campañas(advertiser_id, status);

-- Comentarios para documentar los estados posibles
COMMENT ON COLUMN public.campañas.status IS 'Estados posibles: draft, active, paused, inactive, completed';
COMMENT ON COLUMN public.campañas.metodo_busqueda IS 'Método de búsqueda: mensual, dia, spot, full, catorcenal';