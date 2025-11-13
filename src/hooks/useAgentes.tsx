import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Agente {
  id: string;
  owner_id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  codigo_agente: string;
  comision_porcentaje: number | null;
  comision_monto_fijo: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgente {
  nombre_completo: string;
  email: string;
  telefono?: string;
  codigo_agente: string;
  comision_porcentaje?: number;
  comision_monto_fijo?: number;
}

export interface UpdateAgente {
  nombre_completo?: string;
  email?: string;
  telefono?: string;
  codigo_agente?: string;
  comision_porcentaje?: number;
  comision_monto_fijo?: number;
  activo?: boolean;
}

export function useAgentes() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgentes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agentes_venta')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgentes(data || []);
    } catch (error: any) {
      console.error('Error fetching agentes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los agentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgente = async (agenteData: CreateAgente) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agentes_venta')
        .insert({
          ...agenteData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Agente creado",
        description: `${agenteData.nombre_completo} ha sido agregado exitosamente`,
      });

      fetchAgentes();
      return data;
    } catch (error: any) {
      console.error('Error creating agente:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el agente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAgente = async (id: string, updates: UpdateAgente) => {
    try {
      const { error } = await supabase
        .from('agentes_venta')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Agente actualizado",
        description: "Los cambios se han guardado exitosamente",
      });

      fetchAgentes();
    } catch (error: any) {
      console.error('Error updating agente:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el agente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAgente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agentes_venta')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Agente eliminado",
        description: "El agente ha sido eliminado exitosamente",
      });

      fetchAgentes();
    } catch (error: any) {
      console.error('Error deleting agente:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el agente",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAgentes();
  }, [user]);

  return {
    agentes,
    loading,
    createAgente,
    updateAgente,
    deleteAgente,
    refreshAgentes: fetchAgentes,
  };
}
