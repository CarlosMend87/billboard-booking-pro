-- Create user_favorites table for persistent favorites
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, billboard_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only view their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_billboard_id ON public.user_favorites(billboard_id);

-- Create function to get billboards with availability check
CREATE OR REPLACE FUNCTION public.get_available_billboards(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS SETOF billboards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no dates provided, return all available billboards
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RETURN QUERY
    SELECT * FROM billboards WHERE status = 'disponible';
    RETURN;
  END IF;
  
  -- Return billboards that don't have conflicting reservations
  RETURN QUERY
  SELECT b.*
  FROM billboards b
  WHERE b.status = 'disponible'
  AND NOT EXISTS (
    SELECT 1 FROM reservas r
    WHERE (r.config->>'billboard_id')::uuid = b.id
    AND r.status NOT IN ('cancelled', 'rejected')
    AND r.fecha_inicio <= p_end_date
    AND r.fecha_fin >= p_start_date
  );
END;
$$;

-- Create function to check billboard availability for specific dates
CREATE OR REPLACE FUNCTION public.check_billboard_availability(
  p_billboard_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM reservas r
  WHERE (r.config->>'billboard_id')::uuid = p_billboard_id
  AND r.status NOT IN ('cancelled', 'rejected')
  AND r.fecha_inicio <= p_end_date
  AND r.fecha_fin >= p_start_date;
  
  RETURN v_conflict_count = 0;
END;
$$;