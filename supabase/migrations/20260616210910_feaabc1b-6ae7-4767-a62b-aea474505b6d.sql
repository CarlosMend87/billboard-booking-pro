
CREATE TABLE IF NOT EXISTS public.propuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  active_dates jsonb,
  total_estimado numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propuestas TO authenticated;
GRANT ALL ON public.propuestas TO service_role;

ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own propuestas"
  ON public.propuestas FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_propuestas_updated_at
  BEFORE UPDATE ON public.propuestas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_propuestas_user_id ON public.propuestas(user_id);
