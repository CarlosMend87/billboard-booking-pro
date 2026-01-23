import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FloatingCartItem } from "@/components/cart/FloatingCart";

export interface Propuesta {
  id: string;
  nombre: string;
  descripcion: string | null;
  items: FloatingCartItem[];
  active_dates: { startDate: string; endDate: string } | null;
  total_estimado: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

interface SavePropuestaParams {
  nombre: string;
  descripcion?: string;
  items: FloatingCartItem[];
  activeDates: { startDate: Date; endDate: Date } | null;
}

export function usePropuestas() {
  const { user } = useAuth();
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all proposals for the current user
  const fetchPropuestas = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("propuestas" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Parse items from JSON
      const parsed: Propuesta[] = (data || []).map((p: any) => ({
        ...p,
        items: (p.items || []).map((item: any) => ({
          ...item,
          fechaInicio: new Date(item.fechaInicio),
          fechaFin: new Date(item.fechaFin),
        })),
        active_dates: p.active_dates,
      }));

      setPropuestas(parsed);
    } catch (error) {
      console.error("Error fetching propuestas:", error);
      toast.error("Error al cargar las propuestas");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save current cart as a new proposal
  const savePropuesta = useCallback(async ({
    nombre,
    descripcion,
    items,
    activeDates,
  }: SavePropuestaParams): Promise<boolean> => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para guardar propuestas");
      return false;
    }

    if (!nombre.trim()) {
      toast.error("El nombre de la propuesta es requerido");
      return false;
    }

    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return false;
    }

    setIsSaving(true);
    try {
      const itemsForDb = items.map(item => ({
        ...item,
        fechaInicio: item.fechaInicio.toISOString(),
        fechaFin: item.fechaFin.toISOString(),
      }));

      const datesForDb = activeDates ? {
        startDate: activeDates.startDate.toISOString(),
        endDate: activeDates.endDate.toISOString(),
      } : null;

      const totalEstimado = items
        .filter(i => i.isValid)
        .reduce((sum, item) => sum + item.precio, 0);

      const { error } = await supabase
        .from("propuestas" as any)
        .insert({
          user_id: user.id,
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          items: itemsForDb,
          active_dates: datesForDb,
          total_estimado: totalEstimado,
          item_count: items.length,
        } as any);

      if (error) throw error;

      toast.success("Propuesta guardada exitosamente", {
        description: `"${nombre}" con ${items.length} pantalla${items.length !== 1 ? 's' : ''}`,
      });

      // Refresh list
      await fetchPropuestas();
      return true;
    } catch (error) {
      console.error("Error saving propuesta:", error);
      toast.error("Error al guardar la propuesta");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, fetchPropuestas]);

  // Delete a proposal
  const deletePropuesta = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("propuestas" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setPropuestas(prev => prev.filter(p => p.id !== id));
      toast.success("Propuesta eliminada");
      return true;
    } catch (error) {
      console.error("Error deleting propuesta:", error);
      toast.error("Error al eliminar la propuesta");
      return false;
    }
  }, [user?.id]);

  // Update a proposal
  const updatePropuesta = useCallback(async (
    id: string,
    updates: Partial<Pick<SavePropuestaParams, 'nombre' | 'descripcion'>>
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("propuestas" as any)
        .update({
          nombre: updates.nombre?.trim(),
          descripcion: updates.descripcion?.trim() || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchPropuestas();
      toast.success("Propuesta actualizada");
      return true;
    } catch (error) {
      console.error("Error updating propuesta:", error);
      toast.error("Error al actualizar la propuesta");
      return false;
    }
  }, [user?.id, fetchPropuestas]);

  // Load proposals on mount
  useEffect(() => {
    if (user?.id) {
      fetchPropuestas();
    }
  }, [user?.id, fetchPropuestas]);

  return {
    propuestas,
    isLoading,
    isSaving,
    fetchPropuestas,
    savePropuesta,
    deletePropuesta,
    updatePropuesta,
  };
}
