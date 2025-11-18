-- Tabla para bloqueos temporales de billboards (10 minutos)
CREATE TABLE IF NOT EXISTS public.billboard_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por billboard
CREATE INDEX idx_billboard_locks_billboard_id ON public.billboard_locks(billboard_id);
CREATE INDEX idx_billboard_locks_expires_at ON public.billboard_locks(expires_at);
CREATE INDEX idx_billboard_locks_status ON public.billboard_locks(status);

-- Enable RLS
ALTER TABLE public.billboard_locks ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver locks de billboards
CREATE POLICY "Users can view billboard locks"
ON public.billboard_locks
FOR SELECT
TO authenticated
USING (true);

-- Policy: Los usuarios pueden crear sus propios locks
CREATE POLICY "Users can create their own locks"
ON public.billboard_locks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propios locks
CREATE POLICY "Users can update their own locks"
ON public.billboard_locks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Función para limpiar locks expirados automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.billboard_locks
  SET status = 'expired'
  WHERE status = 'active'
  AND expires_at < NOW();
END;
$$;

-- Función para verificar si un billboard está bloqueado
CREATE OR REPLACE FUNCTION public.is_billboard_locked(billboard_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Primero limpiar locks expirados
  PERFORM public.cleanup_expired_locks();
  
  -- Verificar si existe un lock activo
  RETURN EXISTS (
    SELECT 1
    FROM public.billboard_locks
    WHERE billboard_id = billboard_uuid
    AND status = 'active'
    AND expires_at > NOW()
  );
END;
$$;

-- Función para crear un lock (bloqueo temporal)
CREATE OR REPLACE FUNCTION public.create_billboard_lock(
  billboard_uuid UUID,
  user_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_id UUID;
BEGIN
  -- Limpiar locks expirados primero
  PERFORM public.cleanup_expired_locks();
  
  -- Verificar si ya existe un lock activo
  IF public.is_billboard_locked(billboard_uuid) THEN
    RAISE EXCEPTION 'Billboard is currently locked by another user';
  END IF;
  
  -- Crear el nuevo lock (10 minutos)
  INSERT INTO public.billboard_locks (
    billboard_id,
    user_id,
    expires_at
  ) VALUES (
    billboard_uuid,
    user_uuid,
    NOW() + INTERVAL '10 minutes'
  )
  RETURNING id INTO lock_id;
  
  RETURN lock_id;
END;
$$;