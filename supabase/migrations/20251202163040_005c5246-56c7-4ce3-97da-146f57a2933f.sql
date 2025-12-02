-- Update all existing billboards to be digital with 1920x1080 dimensions
UPDATE billboards 
SET 
  tipo = 'digital',
  digital = jsonb_build_object(
    'pulgadas_monitor', '',
    'tiempo_max_seg', 15,
    'tiempo_min_seg', 5,
    'permite_video', true,
    'cantidad_slots', 12,
    'dimension_pixel', '1920x1080',
    'resolucion', 'HD',
    'slots_por_hora', 12,
    'duracion_spot', 10
  ),
  contratacion = jsonb_set(
    jsonb_set(
      jsonb_set(COALESCE(contratacion, '{}'::jsonb), '{spot}', 'true'),
      '{spots}', 'true'
    ),
    '{programatico}', 'true'
  ),
  medidas = jsonb_build_object(
    'ancho', 1920,
    'alto', 1080,
    'unidad', 'pixeles',
    'dimension_pixel', '1920x1080'
  );

-- Add column for owner's default printing price per m²
ALTER TABLE billboards 
ADD COLUMN IF NOT EXISTS precio_impresion_m2 numeric DEFAULT 65.00;