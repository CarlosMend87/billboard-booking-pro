import { ReactNode } from 'react';
import { useAgentPermissions, AgentPermission } from '@/hooks/useAgentPermissions';
import { Shield, Lock } from 'lucide-react';

interface PermissionGateProps {
  permission: AgentPermission;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions.
 * Use this to protect sections of the UI from unauthorized access.
 */
export function PermissionGate({ 
  permission, 
  children, 
  fallback,
  showMessage = false 
}: PermissionGateProps) {
  const { hasPermission, loading, roleLabel } = useAgentPermissions();

  if (loading) {
    return null;
  }

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Lock className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No tienes permisos para ver esta sección</p>
          {roleLabel && (
            <p className="text-xs mt-1">Tu rol: {roleLabel}</p>
          )}
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface SectionGateProps {
  section: 'inventory' | 'campaigns' | 'availability' | 'agents' | 'reports' | 'financials' | 'prices';
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Component that conditionally renders children based on section access.
 */
export function SectionGate({ 
  section, 
  children, 
  fallback,
  showMessage = false 
}: SectionGateProps) {
  const { canAccess, loading, roleLabel } = useAgentPermissions();

  if (loading) {
    return null;
  }

  if (!canAccess(section)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          <Shield className="h-10 w-10 mb-3 opacity-50" />
          <p className="font-medium">Acceso Restringido</p>
          <p className="text-sm mt-1">No tienes permisos para acceder a esta sección</p>
          {roleLabel && (
            <p className="text-xs mt-2 text-muted-foreground">Tu rol actual: {roleLabel}</p>
          )}
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface ModifyGateProps {
  section: 'inventory' | 'campaigns' | 'availability' | 'agents' | 'prices';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children if user can modify (not just view) a section.
 */
export function ModifyGate({ section, children, fallback }: ModifyGateProps) {
  const { canModify, loading } = useAgentPermissions();

  if (loading) {
    return null;
  }

  if (!canModify(section)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
