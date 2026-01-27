-- 1. Create empresas table
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. Add empresa_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

-- 3. Add empresa_id to billboards
ALTER TABLE public.billboards
ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

-- 4. Create index for performance
CREATE INDEX idx_profiles_empresa_id ON public.profiles(empresa_id);
CREATE INDEX idx_billboards_empresa_id ON public.billboards(empresa_id);

-- 5. Create function to get current user's empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(user_uuid UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = user_uuid
$$;

-- 6. Create function to check if user belongs to empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_empresa(empresa_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND empresa_id = empresa_uuid
  )
$$;

-- 7. RLS Policies for empresas
CREATE POLICY "Users can view their own empresa"
ON public.empresas FOR SELECT
USING (
  id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Superadmins can manage empresas"
ON public.empresas FOR ALL
USING (public.is_superadmin(auth.uid()));

-- 8. Update billboards RLS to use empresa_id
DROP POLICY IF EXISTS "Owners can view their own billboards" ON public.billboards;
DROP POLICY IF EXISTS "Owners can insert their own billboards" ON public.billboards;
DROP POLICY IF EXISTS "Owners can update their own billboards" ON public.billboards;
DROP POLICY IF EXISTS "Owners can delete their own billboards" ON public.billboards;

CREATE POLICY "Users can view billboards of their empresa"
ON public.billboards FOR SELECT
USING (
  empresa_id = public.get_user_empresa_id()
  OR owner_id = auth.uid()
  OR status = 'disponible'
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "Users can insert billboards for their empresa"
ON public.billboards FOR INSERT
WITH CHECK (
  empresa_id = public.get_user_empresa_id()
  OR owner_id = auth.uid()
);

CREATE POLICY "Users can update billboards of their empresa"
ON public.billboards FOR UPDATE
USING (
  empresa_id = public.get_user_empresa_id()
  OR owner_id = auth.uid()
);

CREATE POLICY "Users can delete billboards of their empresa"
ON public.billboards FOR DELETE
USING (
  empresa_id = public.get_user_empresa_id()
  OR owner_id = auth.uid()
);

-- 9. Insert initial empresas and link existing users
INSERT INTO public.empresas (nombre) VALUES ('Rentable'), ('Tauro');

-- 10. Update trigger for updated_at
CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();