import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  Calendar, 
  Eye,
  Crown
} from "lucide-react";
import { AgentRole, AGENT_ROLE_LABELS, AGENT_ROLE_DESCRIPTIONS } from "@/hooks/useAgentPermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoleBadgeProps {
  role: AgentRole | 'owner' | null;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  administrador: <Shield className="h-4 w-4" />,
  aprobador: <CheckCircle className="h-4 w-4" />,
  gestor_disponibilidad: <Calendar className="h-4 w-4" />,
  supervisor: <Eye className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  owner: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
  administrador: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0",
  aprobador: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
  gestor_disponibilidad: "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0",
  supervisor: "bg-gradient-to-r from-slate-500 to-gray-500 text-white border-0",
};

const roleLabels: Record<string, string> = {
  owner: "Propietario",
  ...AGENT_ROLE_LABELS,
};

const roleDescriptions: Record<string, string> = {
  owner: "Acceso total como propietario de la empresa",
  ...AGENT_ROLE_DESCRIPTIONS,
};

export function RoleBadge({ role, showDescription = false, size = 'md' }: RoleBadgeProps) {
  if (!role) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const badge = (
    <Badge 
      className={`${roleColors[role]} ${sizeClasses[size]} flex items-center gap-1.5 font-medium shadow-sm`}
    >
      {roleIcons[role]}
      <span>{roleLabels[role]}</span>
    </Badge>
  );

  if (showDescription) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{roleDescriptions[role]}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
