-- Tabla de códigos de descuento
CREATE TABLE IF NOT EXISTS public.codigos_descuento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  tipo_descuento TEXT NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
  valor_descuento NUMERIC NOT NULL CHECK (valor_descuento > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio DATE,
  fecha_fin DATE,
  uso_maximo INTEGER,
  uso_actual INTEGER DEFAULT 0,
  clientes_permitidos TEXT[],
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar columnas a reservas
ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS codigo_descuento_id UUID REFERENCES public.codigos_descuento(id),
ADD COLUMN IF NOT EXISTS descuento_aplicado NUMERIC DEFAULT 0;

-- RLS para codigos_descuento
ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their discount codes"
ON public.codigos_descuento
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Agents can view discount codes"
ON public.codigos_descuento
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agentes_venta av
    WHERE av.owner_id = codigos_descuento.owner_id
    AND av.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_codigos_descuento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_codigos_descuento_updated_at
BEFORE UPDATE ON public.codigos_descuento
FOR EACH ROW
EXECUTE FUNCTION public.update_codigos_descuento_updated_at();

-- Función para incrementar uso de código
CREATE OR REPLACE FUNCTION public.incrementar_uso_codigo_descuento(codigo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.codigos_descuento
  SET uso_actual = uso_actual + 1
  WHERE id = codigo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;