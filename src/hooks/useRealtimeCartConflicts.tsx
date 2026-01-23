import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FloatingCartItem } from "@/components/cart/FloatingCart";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface RealtimeCartConflictsOptions {
  items: FloatingCartItem[];
  onConflictDetected: (conflictedItemIds: string[]) => void;
  enabled?: boolean;
}

/**
 * Hook that subscribes to realtime reservation changes and notifies
 * when a screen in the cart becomes unavailable due to someone else's booking.
 */
export function useRealtimeCartConflicts({
  items,
  onConflictDetected,
  enabled = true,
}: RealtimeCartConflictsOptions) {
  const itemsRef = useRef(items);
  const onConflictRef = useRef(onConflictDetected);

  // Keep refs up to date
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onConflictRef.current = onConflictDetected;
  }, [onConflictDetected]);

  // Check if a new reservation conflicts with any cart items
  const checkForConflicts = useCallback((reservation: {
    config: any;
    fecha_inicio: string;
    fecha_fin: string;
    status: string;
  }) => {
    const currentItems = itemsRef.current;
    
    if (!currentItems.length) return;
    
    // Only care about reservations that are not cancelled/rejected
    if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
      return;
    }

    const reservaBillboardId = reservation.config?.billboard_id;
    if (!reservaBillboardId) return;

    const reservaStart = new Date(reservation.fecha_inicio);
    const reservaEnd = new Date(reservation.fecha_fin);

    // Find conflicting items in cart
    const conflictedItems = currentItems.filter(item => {
      if (item.billboardId !== reservaBillboardId) return false;

      const cartStart = item.fechaInicio;
      const cartEnd = item.fechaFin;

      // Check date overlap
      const hasOverlap = 
        (cartStart >= reservaStart && cartStart <= reservaEnd) ||
        (cartEnd >= reservaStart && cartEnd <= reservaEnd) ||
        (cartStart <= reservaStart && cartEnd >= reservaEnd);

      return hasOverlap;
    });

    if (conflictedItems.length > 0) {
      // Show notification
      toast.error(
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">¡Pantalla reservada!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {conflictedItems.length === 1 
                ? `"${conflictedItems[0].nombre}" fue reservada por alguien más.`
                : `${conflictedItems.length} pantallas de tu carrito fueron reservadas.`
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Te recomendamos revisar tu carrito.
            </p>
          </div>
        </div>,
        {
          duration: 8000,
        }
      );

      // Trigger callback with conflicted item IDs
      onConflictRef.current(conflictedItems.map(item => item.id));
    }
  }, []);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    // Subscribe to new reservations
    const channel = supabase
      .channel('cart-reservation-conflicts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservas',
        },
        (payload) => {
          console.log('New reservation detected:', payload.new);
          checkForConflicts(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservas',
        },
        (payload) => {
          // Only check updates that change status to accepted/pending
          const newData = payload.new as any;
          if (newData.status === 'accepted' || newData.status === 'pending') {
            console.log('Reservation status updated:', newData);
            checkForConflicts(newData);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to reservation conflict notifications');
        }
      });

    return () => {
      console.log('Unsubscribing from reservation conflict notifications');
      supabase.removeChannel(channel);
    };
  }, [enabled, items.length, checkForConflicts]);
}
