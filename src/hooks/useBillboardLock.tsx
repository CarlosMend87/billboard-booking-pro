import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BillboardLock {
  id: string;
  billboard_id: string;
  user_id: string;
  locked_at: string;
  expires_at: string;
  status: 'active' | 'completed' | 'expired';
}

export function useBillboardLock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Check if billboard is locked
  const isLocked = async (billboardId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_billboard_locked', {
        billboard_uuid: billboardId
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error checking lock:', error);
      return false;
    }
  };

  // Create a lock for a billboard
  const createLock = async (billboardId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para continuar",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_billboard_lock', {
        billboard_uuid: billboardId,
        user_uuid: user.id
      });

      if (error) {
        if (error.message.includes('locked by another user')) {
          toast({
            title: "Espacio no disponible",
            description: "Otro usuario está procesando esta compra. Intenta en unos minutos.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return null;
      }

      toast({
        title: "Espacio reservado",
        description: "Tienes 10 minutos para completar tu compra",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Complete a lock (mark as completed)
  const completeLock = async (lockId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('billboard_locks')
        .update({ status: 'completed' })
        .eq('id', lockId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get active lock for user and billboard
  const getActiveLock = async (billboardId: string): Promise<BillboardLock | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('billboard_locks')
        .select('*')
        .eq('billboard_id', billboardId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BillboardLock | null;
    } catch (error: any) {
      console.error('Error getting active lock:', error);
      return null;
    }
  };

  return {
    isLocked,
    createLock,
    completeLock,
    getActiveLock,
    loading,
  };
}
