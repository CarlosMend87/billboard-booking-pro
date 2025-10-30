import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CartItem } from "@/types/cart";
import { useToast } from "@/hooks/use-toast";

export function useReservations() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createReservation = async (cartItem: CartItem, ownerUserId: string) => {
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservas')
        .insert({
          advertiser_id: user.id,
          owner_id: ownerUserId,
          asset_name: cartItem.asset.nombre,
          asset_type: cartItem.asset.tipo,
          modalidad: cartItem.modalidad,
          fecha_inicio: cartItem.config.fechaInicio || new Date().toISOString().split('T')[0],
          fecha_fin: cartItem.config.fechaFin || new Date().toISOString().split('T')[0],
          precio_total: cartItem.subtotal,
          config: JSON.parse(JSON.stringify(cartItem.config)),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Reserva Creada",
        description: "Tu solicitud de reserva ha sido enviada al propietario",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createReservationsFromCart = async (cartItems: CartItem[]) => {
    setLoading(true);
    try {
      const reservations = [];
      
      for (const item of cartItems) {
        // Use the owner_id from the asset data
        const ownerId = item.asset.owner_id || "ef57691e-4946-43c4-ba5c-b904e93a27cf"; // Fallback to existing owner
        
        const reservation = await createReservation(item, ownerId);
        // Add owner_id to the reservation object for email sending
        reservations.push({
          ...reservation,
          owner_id: ownerId
        });
      }

      return reservations;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createReservation,
    createReservationsFromCart,
    loading
  };
}