-- ============================================
-- FASE 1: Tabla de Agentes de Venta
-- ============================================
CREATE TABLE public.agentes_venta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  codigo_agente TEXT NOT NULL,
  comision_porcentaje NUMERIC,
  comision_monto_fijo NUMERIC,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(owner_id, codigo_agente)
);

-- Enable RLS
ALTER TABLE public.agentes_venta ENABLE ROW LEVEL SECURITY;

-- Policies for agentes_venta
CREATE POLICY "Owners can manage their own agents"
ON public.agentes_venta
FOR ALL
USING (auth.uid() = owner_id);

-- ============================================
-- FASE 2: Extender Reservas con Datos de Venta
-- ============================================
ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS agente_id UUID REFERENCES public.agentes_venta(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tarifa_publicada NUMERIC,
ADD COLUMN IF NOT EXISTS tarifa_final NUMERIC,
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
ADD COLUMN IF NOT EXISTS cliente_email TEXT,
ADD COLUMN IF NOT EXISTS cliente_razon_social TEXT,
ADD COLUMN IF NOT EXISTS es_agencia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_contrato TEXT CHECK (tipo_contrato IN ('fijo', 'renovable')) DEFAULT 'fijo';

-- ============================================
-- FASE 3: Gestión de Materiales
-- ============================================
CREATE TABLE public.materiales_campana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  campana_id UUID REFERENCES public.campañas(id) ON DELETE CASCADE,
  material_recibido BOOLEAN DEFAULT false,
  fecha_recepcion TIMESTAMP WITH TIME ZONE,
  quien_imprime TEXT CHECK (quien_imprime IN ('dueño', 'cliente')),
  archivo_material TEXT, -- URL del archivo subido
  foto_confirmacion TEXT, -- URL de la foto de confirmación
  fecha_limite_entrega DATE,
  dias_retraso INTEGER DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.materiales_campana ENABLE ROW LEVEL SECURITY;

-- Policies for materiales_campana
CREATE POLICY "Owners can manage materials for their campaigns"
ON public.materiales_campana
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = materiales_campana.reserva_id
    AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Advertisers can view their materials"
ON public.materiales_campana
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = materiales_campana.reserva_id
    AND r.advertiser_id = auth.uid()
  )
);

-- ============================================
-- FASE 4: Recordatorios y Renovaciones
-- ============================================
CREATE TABLE public.renovaciones_campana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campana_id UUID NOT NULL REFERENCES public.campañas(id) ON DELETE CASCADE,
  fecha_recordatorio DATE NOT NULL,
  recordatorio_enviado BOOLEAN DEFAULT false,
  respuesta_owner TEXT CHECK (respuesta_owner IN ('renovar', 'finalizar', 'pendiente')) DEFAULT 'pendiente',
  nueva_campana_id UUID REFERENCES public.campañas(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.renovaciones_campana ENABLE ROW LEVEL SECURITY;

-- Policies for renovaciones_campana
CREATE POLICY "Owners can manage renewals for their campaigns"
ON public.renovaciones_campana
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campañas c
    JOIN public.reservas r ON c.reserva_id = r.id
    WHERE c.id = renovaciones_campana.campana_id
    AND r.owner_id = auth.uid()
  )
);

-- ============================================
-- FASE 5: Bonificaciones
-- ============================================
CREATE TABLE public.bonificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campana_id UUID NOT NULL REFERENCES public.campañas(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_bonificacion TEXT NOT NULL,
  dias_bonificados INTEGER NOT NULL,
  valor_dias_bonificados NUMERIC NOT NULL,
  motivo TEXT,
  fecha_inicio_bonificacion DATE NOT NULL,
  fecha_fin_bonificacion DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonificaciones ENABLE ROW LEVEL SECURITY;

-- Policies for bonificaciones
CREATE POLICY "Owners can manage their bonifications"
ON public.bonificaciones
FOR ALL
USING (auth.uid() = owner_id);

-- ============================================
-- Triggers para updated_at
-- ============================================
CREATE TRIGGER update_agentes_venta_updated_at
BEFORE UPDATE ON public.agentes_venta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materiales_campana_updated_at
BEFORE UPDATE ON public.materiales_campana
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_renovaciones_campana_updated_at
BEFORE UPDATE ON public.renovaciones_campana
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Función para calcular días de retraso
-- ============================================
CREATE OR REPLACE FUNCTION public.calcular_dias_retraso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.material_recibido = true AND NEW.fecha_recepcion IS NOT NULL AND NEW.fecha_limite_entrega IS NOT NULL THEN
    NEW.dias_retraso := GREATEST(0, EXTRACT(day FROM (NEW.fecha_recepcion::date - NEW.fecha_limite_entrega)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER trigger_calcular_dias_retraso
BEFORE INSERT OR UPDATE ON public.materiales_campana
FOR EACH ROW
EXECUTE FUNCTION public.calcular_dias_retraso();

-- ============================================
-- Función para crear recordatorios automáticos
-- ============================================
CREATE OR REPLACE FUNCTION public.crear_recordatorio_renovacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear recordatorio si el tipo de contrato es 'renovable'
  IF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = NEW.reserva_id
    AND r.tipo_contrato = 'renovable'
  ) THEN
    INSERT INTO public.renovaciones_campana (campana_id, fecha_recordatorio)
    VALUES (NEW.id, NEW.fecha_fin - INTERVAL '5 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER trigger_crear_recordatorio
AFTER INSERT ON public.campañas
FOR EACH ROW
EXECUTE FUNCTION public.crear_recordatorio_renovacion();