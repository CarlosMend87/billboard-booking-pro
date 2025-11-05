import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Billboard = Tables<"billboards">;
export type CreateBillboard = TablesInsert<"billboards">;
export type UpdateBillboard = TablesUpdate<"billboards">;

export function useBillboards() {
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBillboards = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('billboards')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillboards(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las pantallas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBillboard = async (billboardData: Omit<CreateBillboard, 'owner_id'>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('billboards')
        .insert({
          ...billboardData,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setBillboards(prev => [data, ...prev]);
      toast({
        title: "Éxito",
        description: "Pantalla creada correctamente",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBillboard = async (id: string, updates: UpdateBillboard) => {
    setLoading(true);
    try {
      console.log('Actualizando billboard:', id, updates);
      
      const { data, error } = await supabase
        .from('billboards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar:', error);
        throw error;
      }

      console.log('Billboard actualizado:', data);
      
      // Actualizar el estado local inmediatamente
      setBillboards(prev => {
        const updated = prev.map(b => b.id === id ? data : b);
        console.log('Estado actualizado:', updated);
        return updated;
      });
      
      toast({
        title: "Éxito",
        description: "Pantalla actualizada correctamente",
      });
      
      // Refrescar los datos desde el servidor para asegurar sincronización
      await fetchBillboards();
      
      return data;
    } catch (error: any) {
      console.error('Error en updateBillboard:', error);
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

  const deleteBillboard = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('billboards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBillboards(prev => prev.filter(b => b.id !== id));
      toast({
        title: "Éxito",
        description: "Pantalla eliminada correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadBillboardImage = async (file: File, billboardId: string) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${billboardId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('billboard-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('billboard-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchBillboards();
  }, [user]);

  return {
    billboards,
    loading,
    fetchBillboards,
    createBillboard,
    updateBillboard,
    deleteBillboard,
    uploadBillboardImage
  };
}