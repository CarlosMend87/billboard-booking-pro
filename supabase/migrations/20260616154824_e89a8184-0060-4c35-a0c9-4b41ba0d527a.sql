
ALTER TABLE public.billboards 
  ADD COLUMN IF NOT EXISTS has_computer_vision boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_detection_count integer,
  ADD COLUMN IF NOT EXISTS last_detection_date timestamptz;

ALTER TABLE public."campañas"
  ADD COLUMN IF NOT EXISTS propuesta jsonb,
  ADD COLUMN IF NOT EXISTS metodo_busqueda text;
