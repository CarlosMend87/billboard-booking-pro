import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { supabase } from '@/integrations/supabase/client';

export type AgentRole = 'administrador' | 'aprobador' | 'gestor_disponibilidad' | 'supervisor';
export type AgentRoleOrNull = AgentRole | null;

export type AgentPermission = 
  | 'manage_agents'
  | 'manage_inventory'
  | 'manage_prices'
  | 'view_financials'
  | 'approve_campaigns'
  | 'view_campaigns'
  | 'manage_availability'
  | 'view_availability'
  | 'view_inventory'
  | 'view_reports'
  | 'view_dashboard';

// Permission matrix for each role
const PERMISSION_MATRIX: Record<AgentRole, AgentPermission[]> = {
  administrador: [
    'manage_agents',
    'manage_inventory',
    'manage_prices',
    'view_financials',
    'approve_campaigns',
    'view_campaigns',
    'manage_availability',
    'view_availability',
    'view_inventory',
    'view_reports',
    'view_dashboard',
  ],
  aprobador: [
    'approve_campaigns',
    'view_campaigns',
    'view_dashboard',
  ],
  gestor_disponibilidad: [
    'manage_availability',
    'view_availability',
    'view_inventory',
    'view_dashboard',
  ],
  supervisor: [
    'view_financials',
    'view_campaigns',
    'view_availability',
    'view_inventory',
    'view_reports',
    'view_dashboard',
  ],
};

// Role display names
export const AGENT_ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  aprobador: 'Aprobador de Campañas',
  gestor_disponibilidad: 'Gestor de Disponibilidad',
  supervisor: 'Supervisor (Vista Completa)',
};

// Role descriptions
export const AGENT_ROLE_DESCRIPTIONS: Record<string, string> = {
  administrador: 'Acceso total: puede gestionar agentes, inventario, campañas y configuraciones',
  aprobador: 'Puede ver y aprobar/rechazar campañas entrantes',
  gestor_disponibilidad: 'Puede configurar disponibilidad, bloquear fechas y ajustar horarios',
  supervisor: 'Acceso de solo lectura a toda la información del dashboard',
};

interface AgentInfo {
  id: string;
  owner_id: string;
  rol_agente: AgentRoleOrNull;
  nombre_completo: string;
  email: string;
}

export function useAgentPermissions() {
  const { user } = useAuth();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const [agentRole, setAgentRole] = useState<AgentRoleOrNull>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load agent role and info
  useEffect(() => {
    let isMounted = true;

    const loadAgentInfo = async () => {
      if (!user || roleLoading) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      // If user is owner, they have full access (not an agent)
      if (userRole === 'owner') {
        if (isMounted) {
          setAgentRole(null);
          setAgentInfo(null);
          setOwnerId(user.id);
          setLoading(false);
        }
        return;
      }

      // If user is an agent, load their role
      if (userRole === 'agente') {
        try {
          const { data, error } = await supabase
            .from('agentes_venta')
            .select('id, owner_id, rol_agente, nombre_completo, email')
            .eq('id', user.id)
            .eq('activo', true)
            .maybeSingle();

          if (error) {
            console.error('Error loading agent info:', error);
          }

          if (isMounted && data) {
            setAgentRole(data.rol_agente as AgentRole);
            setAgentInfo(data as AgentInfo);
            setOwnerId(data.owner_id);
          }
        } catch (e) {
          console.error('Error loading agent permissions:', e);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    loadAgentInfo();

    return () => {
      isMounted = false;
    };
  }, [user, userRole, roleLoading]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: AgentPermission): boolean => {
    // Owners have all permissions
    if (userRole === 'owner') {
      return true;
    }

    // Agents get permissions based on their role
    if (userRole === 'agente' && agentRole) {
      return PERMISSION_MATRIX[agentRole]?.includes(permission) || false;
    }

    return false;
  }, [userRole, agentRole]);

  // Check if user can access a specific section
  const canAccess = useCallback((section: string): boolean => {
    const sectionPermissions: Record<string, AgentPermission[]> = {
      'inventory': ['view_inventory', 'manage_inventory'],
      'campaigns': ['view_campaigns', 'approve_campaigns'],
      'availability': ['view_availability', 'manage_availability'],
      'agents': ['manage_agents'],
      'reports': ['view_reports'],
      'financials': ['view_financials'],
      'prices': ['manage_prices'],
    };

    const requiredPermissions = sectionPermissions[section];
    if (!requiredPermissions) return true;

    return requiredPermissions.some(p => hasPermission(p));
  }, [hasPermission]);

  // Check if user can modify (not just view)
  const canModify = useCallback((section: string): boolean => {
    // Owners can always modify
    if (userRole === 'owner') {
      return true;
    }

    const modifyPermissions: Record<string, AgentPermission> = {
      'inventory': 'manage_inventory',
      'campaigns': 'approve_campaigns',
      'availability': 'manage_availability',
      'agents': 'manage_agents',
      'prices': 'manage_prices',
    };

    const requiredPermission = modifyPermissions[section];
    if (!requiredPermission) return false;

    return hasPermission(requiredPermission);
  }, [userRole, hasPermission]);

  // Get all permissions for current user
  const getAllPermissions = useCallback((): AgentPermission[] => {
    if (userRole === 'owner') {
      return PERMISSION_MATRIX.administrador; // Full access
    }

    if (userRole === 'agente' && agentRole) {
      return PERMISSION_MATRIX[agentRole] || [];
    }

    return [];
  }, [userRole, agentRole]);

  return {
    // Role info
    agentRole,
    agentInfo,
    ownerId,
    isOwner: userRole === 'owner',
    isAgent: userRole === 'agente',
    loading: loading || roleLoading,

    // Permission checks
    hasPermission,
    canAccess,
    canModify,
    getAllPermissions,

    // Role metadata
    roleLabel: agentRole ? AGENT_ROLE_LABELS[agentRole] : (userRole === 'owner' ? 'Propietario' : null),
    roleDescription: agentRole ? AGENT_ROLE_DESCRIPTIONS[agentRole] : null,
  };
}
