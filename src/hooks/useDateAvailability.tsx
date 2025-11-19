import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Reservation {
  asset_name: string;
  fecha_inicio: string;
  fecha_fin: string;
  config: any;
}

export function useDateAvailability(startDate: Date | null, endDate: Date | null) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) {
      setReservations([]);
      return;
    }

    const fetchReservations = async () => {
      setLoading(true);
      try {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch all confirmed/accepted reservations that overlap with the date range
        const { data, error } = await supabase
          .from('reservas')
          .select('asset_name, fecha_inicio, fecha_fin, config')
          .in('status', ['accepted', 'confirmed'])
          .lte('fecha_inicio', endDateStr)
          .gte('fecha_fin', startDateStr);

        if (error) {
          console.error('Error fetching reservations:', error);
          setLoading(false);
          return;
        }

        setReservations(data || []);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [startDate, endDate]);

  const isAvailable = (billboardId: string): boolean => {
    if (!startDate || !endDate) return true;

    // Check if billboard has any overlapping reservations
    // Match by billboard ID which could be in asset_name or config
    const hasOverlap = reservations.some(res => {
      // Try to match by billboard ID in various places
      const matchesId = 
        res.asset_name === billboardId || 
        res.asset_name.includes(billboardId) ||
        res.config?.billboard_id === billboardId ||
        res.config?.asset_id === billboardId;

      if (!matchesId) return false;

      const resStart = new Date(res.fecha_inicio);
      const resEnd = new Date(res.fecha_fin);

      // Check for overlap: reservations overlap if they don't end before our start OR start after our end
      return !(endDate < resStart || startDate > resEnd);
    });

    return !hasOverlap;
  };

  return { isAvailable, loading };
}

