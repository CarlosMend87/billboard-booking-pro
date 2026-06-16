ALTER TABLE public.billboards
  ADD COLUMN IF NOT EXISTS has_computer_vision boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admobilize_config jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_detection_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_detection_date date DEFAULT NULL;