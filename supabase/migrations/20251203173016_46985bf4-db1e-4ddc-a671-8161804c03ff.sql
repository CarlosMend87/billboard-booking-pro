-- Crear función security definer para verificar si un agente pertenece a un owner
CREATE OR REPLACE FUNCTION public.is_agent_of_owner(owner_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Obtener el email del usuario actual desde profiles
  SELECT email INTO user_email 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si existe como agente del owner
  RETURN EXISTS (
    SELECT 1 FROM public.agentes_venta av
    WHERE av.owner_id = owner_uuid AND av.email = user_email
  );
END;
$$;

-- Eliminar la política problemática que accede a auth.users
DROP POLICY IF EXISTS "Agents can view discount codes" ON public.codigos_descuento;

-- Crear nueva política para agentes usando la función security definer
CREATE POLICY "Agents can view discount codes"
ON public.codigos_descuento FOR SELECT
USING (public.is_agent_of_owner(owner_id));