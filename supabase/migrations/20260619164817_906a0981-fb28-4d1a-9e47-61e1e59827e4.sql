
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view empresas"
  ON public.empresas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert empresas"
  ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update empresas"
  ON public.empresas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete empresas"
  ON public.empresas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

ALTER TABLE public.billboards
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON public.profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_billboards_empresa_id ON public.billboards(empresa_id);
