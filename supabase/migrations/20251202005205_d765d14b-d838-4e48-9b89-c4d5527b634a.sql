-- Agregar campo de precio de impresión por m² en billboards
ALTER TABLE public.billboards 
ADD COLUMN IF NOT EXISTS precio_impresion_m2 NUMERIC DEFAULT 65.00;

COMMENT ON COLUMN public.billboards.precio_impresion_m2 IS 'Precio por metro cuadrado para impresión de lona (MXN)';