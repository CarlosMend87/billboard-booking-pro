import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Reservation {
  id: string;
  billboard_id: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  status: string;
}

interface AvailabilityResult {
  isAvailable: boolean;
  conflictingReservations: Reservation[];
  nextAvailableDate: Date | null;
}

export function useBillboardAvailability(billboardId: string | null) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reservations for a specific billboard
  const fetchReservations = useCallback(async () => {
    if (!billboardId) return;

    setLoading(true);
    setError(null);

    try {
      // Get reservations that match this billboard
      const { data, error: fetchError } = await supabase
        .from("reservas")
        .select("id, fecha_inicio, fecha_fin, status, config")
        .or(`config->billboard_id.eq.${billboardId}`)
        .not("status", "in", "(cancelled,rejected)")
        .order("fecha_inicio", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped = (data || []).map((r) => ({
        id: r.id,
        billboard_id: (r.config as any)?.billboard_id || billboardId,
        fecha_inicio: new Date(r.fecha_inicio),
        fecha_fin: new Date(r.fecha_fin),
        status: r.status,
      }));

      setReservations(mapped);
    } catch (err: any) {
      console.error("Error fetching reservations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [billboardId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Check if a specific date range is available
  const checkAvailability = useCallback(
    (startDate: Date, endDate: Date): AvailabilityResult => {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const conflicts = reservations.filter((r) => {
        const resStart = new Date(r.fecha_inicio);
        resStart.setHours(0, 0, 0, 0);
        const resEnd = new Date(r.fecha_fin);
        resEnd.setHours(23, 59, 59, 999);

        // Check for overlap
        return start <= resEnd && end >= resStart;
      });

      // Calculate next available date if there are conflicts
      let nextAvailable: Date | null = null;
      if (conflicts.length > 0) {
        const sortedConflicts = [...conflicts].sort(
          (a, b) => a.fecha_fin.getTime() - b.fecha_fin.getTime()
        );
        const lastConflict = sortedConflicts[sortedConflicts.length - 1];
        nextAvailable = new Date(lastConflict.fecha_fin);
        nextAvailable.setDate(nextAvailable.getDate() + 1);
      }

      return {
        isAvailable: conflicts.length === 0,
        conflictingReservations: conflicts,
        nextAvailableDate: nextAvailable,
      };
    },
    [reservations]
  );

  // Check if a specific date is blocked
  const isDateBlocked = useCallback(
    (date: Date): boolean => {
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);

      return reservations.some((r) => {
        const resStart = new Date(r.fecha_inicio);
        resStart.setHours(0, 0, 0, 0);
        const resEnd = new Date(r.fecha_fin);
        resEnd.setHours(23, 59, 59, 999);

        return checkDate >= resStart && checkDate <= resEnd;
      });
    },
    [reservations]
  );

  // Get all blocked date ranges for calendar display
  const getBlockedDateRanges = useCallback((): { from: Date; to: Date }[] => {
    return reservations.map((r) => ({
      from: new Date(r.fecha_inicio),
      to: new Date(r.fecha_fin),
    }));
  }, [reservations]);

  return {
    reservations,
    loading,
    error,
    checkAvailability,
    isDateBlocked,
    getBlockedDateRanges,
    refetch: fetchReservations,
  };
}
