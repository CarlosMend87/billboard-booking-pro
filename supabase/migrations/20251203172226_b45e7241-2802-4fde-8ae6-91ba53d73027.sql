-- Crear tabla de anunciantes (clientes del propietario)
CREATE TABLE public.anunciantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  telefono TEXT,
  user_id UUID, -- Si el anunciante tiene cuenta en el sistema
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de marcas (vinculadas a anunciantes)
CREATE TABLE public.marcas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anunciante_id UUID NOT NULL REFERENCES public.anunciantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar columna para vincular descuento a un anunciante específico
ALTER TABLE public.codigos_descuento 
ADD COLUMN anunciante_id UUID REFERENCES public.anunciantes(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.anunciantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

-- Policies para anunciantes
CREATE POLICY "Owners can manage their advertisers"
ON public.anunciantes FOR ALL
USING (auth.uid() = owner_id);

-- Policies para marcas (a través del anunciante)
CREATE POLICY "Owners can manage brands of their advertisers"
ON public.marcas FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.anunciantes a 
  WHERE a.id = marcas.anunciante_id AND a.owner_id = auth.uid()
));

-- Trigger para updated_at en anunciantes
CREATE TRIGGER update_anunciantes_updated_at
BEFORE UPDATE ON public.anunciantes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX idx_anunciantes_owner ON public.anunciantes(owner_id);
CREATE INDEX idx_marcas_anunciante ON public.marcas(anunciante_id);
CREATE INDEX idx_codigos_descuento_anunciante ON public.codigos_descuento(anunciante_id);