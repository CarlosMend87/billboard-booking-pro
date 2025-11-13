import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Bell, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function OwnerNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('reservas')
        .select('id', { count: 'exact' })
        .eq('owner_id', user.id)
        .eq('status', 'pending');

      if (!error && data) {
        setPendingCount(data.length);
      }
    };

    fetchPendingCount();

    // Subscribe to changes
    const channel = supabase
      .channel('owner-reservas-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas',
          filter: `owner_id=eq.${user?.id}`
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    {
      path: '/owner-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/owner-reservations',
      label: 'Reservas',
      icon: Bell,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      path: '/agentes-venta',
      label: 'Agentes',
      icon: Users
    }
  ];

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Button
            key={item.path}
            asChild
            variant={isActive ? 'default' : 'ghost'}
            className="relative"
          >
            <Link to={item.path}>
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
