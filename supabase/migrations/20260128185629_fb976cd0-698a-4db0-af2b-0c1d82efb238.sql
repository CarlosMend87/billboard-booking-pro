-- Create enum for agent roles
CREATE TYPE public.agent_role AS ENUM (
  'administrador',
  'aprobador',
  'gestor_disponibilidad',
  'supervisor'
);

-- Add role column to agentes_venta table
ALTER TABLE public.agentes_venta 
ADD COLUMN rol_agente agent_role NOT NULL DEFAULT 'supervisor';

-- Create a security definer function to check agent role
CREATE OR REPLACE FUNCTION public.get_agent_role(_user_id uuid)
RETURNS agent_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol_agente
  FROM public.agentes_venta
  WHERE id = _user_id AND activo = true
  LIMIT 1
$$;

-- Function to check if user is an agent with specific role
CREATE OR REPLACE FUNCTION public.agent_has_role(_user_id uuid, _role agent_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agentes_venta
    WHERE id = _user_id
      AND rol_agente = _role
      AND activo = true
  )
$$;

-- Function to check if agent can perform action based on permission
CREATE OR REPLACE FUNCTION public.agent_can(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_role agent_role;
BEGIN
  -- Get the agent's role
  SELECT rol_agente INTO agent_role
  FROM public.agentes_venta
  WHERE id = _user_id AND activo = true;
  
  IF agent_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Permission matrix
  CASE _permission
    -- Full admin permissions
    WHEN 'manage_agents' THEN
      RETURN agent_role = 'administrador';
    WHEN 'manage_inventory' THEN
      RETURN agent_role = 'administrador';
    WHEN 'manage_prices' THEN
      RETURN agent_role = 'administrador';
    WHEN 'view_financials' THEN
      RETURN agent_role IN ('administrador', 'supervisor');
    
    -- Campaign permissions
    WHEN 'approve_campaigns' THEN
      RETURN agent_role IN ('administrador', 'aprobador');
    WHEN 'view_campaigns' THEN
      RETURN agent_role IN ('administrador', 'aprobador', 'supervisor');
    
    -- Availability permissions
    WHEN 'manage_availability' THEN
      RETURN agent_role IN ('administrador', 'gestor_disponibilidad');
    WHEN 'view_availability' THEN
      RETURN agent_role IN ('administrador', 'gestor_disponibilidad', 'supervisor');
    
    -- View permissions (for supervisor and admin)
    WHEN 'view_inventory' THEN
      RETURN agent_role IN ('administrador', 'supervisor', 'gestor_disponibilidad');
    WHEN 'view_reports' THEN
      RETURN agent_role IN ('administrador', 'supervisor');
    WHEN 'view_dashboard' THEN
      RETURN true; -- All agents can view dashboard
    
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create agent permissions table for audit trail
CREATE TABLE public.agent_permissions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agentes_venta(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  permitted boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on permissions log
ALTER TABLE public.agent_permissions_log ENABLE ROW LEVEL SECURITY;

-- Only admins and owners can view permission logs
CREATE POLICY "Owners can view agent permission logs"
ON public.agent_permissions_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agentes_venta a
    WHERE a.id = agent_permissions_log.agent_id
    AND a.owner_id = auth.uid()
  )
);

-- System can insert logs
CREATE POLICY "System can insert permission logs"
ON public.agent_permissions_log
FOR INSERT
WITH CHECK (true);

-- Update agentes_venta RLS to allow agents to view themselves
CREATE POLICY "Agents can view themselves"
ON public.agentes_venta
FOR SELECT
USING (id = auth.uid());

-- Update reservas RLS to allow agents with appropriate roles
CREATE POLICY "Agents can view owner reservations"
ON public.reservas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agentes_venta a
    WHERE a.id = auth.uid()
    AND a.owner_id = reservas.owner_id
    AND a.activo = true
  )
);

-- Allow agents to update reservations if they have approval role
CREATE POLICY "Agents with approval role can update reservations"
ON public.reservas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM agentes_venta a
    WHERE a.id = auth.uid()
    AND a.owner_id = reservas.owner_id
    AND a.activo = true
    AND a.rol_agente IN ('administrador', 'aprobador')
  )
);

-- Allow agents to view billboards of their owner
CREATE POLICY "Agents can view owner billboards"
ON public.billboards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agentes_venta a
    WHERE a.id = auth.uid()
    AND a.owner_id = billboards.owner_id
    AND a.activo = true
  )
);

-- Allow admin agents to manage billboards
CREATE POLICY "Admin agents can manage billboards"
ON public.billboards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM agentes_venta a
    WHERE a.id = auth.uid()
    AND a.owner_id = billboards.owner_id
    AND a.activo = true
    AND a.rol_agente = 'administrador'
  )
);