import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, DollarSign, TrendingUp, Plus } from "lucide-react";
import { useState } from "react";

interface AgenteNavProps {
  onNuevaVenta?: () => void;
}

export function AgenteNav({ onNuevaVenta }: AgenteNavProps) {
  const location = useLocation();

  const navItems = [
    {
      path: '/agente-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/agente-dashboard?tab=reservas',
      label: 'Mis Reservas',
      icon: TrendingUp
    },
    {
      path: '/agente-dashboard?tab=comisiones',
      label: 'Comisiones',
      icon: DollarSign
    }
  ];

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
                        (item.path.includes('?') && location.pathname === '/agente-dashboard' && location.search.includes(item.path.split('?')[1]));

        return (
          <Button
            key={item.path}
            asChild
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
          >
            <Link to={item.path}>
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Link>
          </Button>
        );
      })}
      
      {onNuevaVenta && (
        <Button
          onClick={onNuevaVenta}
          size="sm"
          className="ml-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta
        </Button>
      )}
    </nav>
  );
}
