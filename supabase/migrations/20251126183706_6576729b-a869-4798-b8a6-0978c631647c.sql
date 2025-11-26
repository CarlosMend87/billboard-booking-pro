-- Agregar columna metadata a la tabla billboards para almacenar información adicional
ALTER TABLE billboards 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;