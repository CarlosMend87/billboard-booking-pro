import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  reserva_id?: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Delete the notification
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', notification.id);

      if (error) throw error;

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));

      // Navigate based on notification type
      if (notification.tipo === 'reserva_pendiente') {
        navigate('/owner/reservations');
      } else if (notification.tipo === 'compra_aceptada') {
        navigate('/progreso-campana');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const acceptReservation = async (reservaId: string) => {
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ status: 'accepted' })
        .eq('id', reservaId);

      if (error) throw error;

      toast({
        title: "Reserva Aceptada",
        description: "La reserva ha sido aceptada exitosamente",
      });

      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectReservation = async (reservaId: string) => {
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ status: 'rejected' })
        .eq('id', reservaId);

      if (error) throw error;

      toast({
        title: "Reserva Rechazada",
        description: "La reserva ha sido rechazada",
      });

      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notificaciones-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <DropdownMenuItem>Cargando...</DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem>No tienes notificaciones</DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className={`flex flex-col items-start p-4 cursor-pointer hover:bg-accent ${!notification.leida ? 'bg-muted/50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.mensaje}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Haz clic para ver detalles
                  </p>
                </div>
                
                {!notification.leida && (
                  <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}