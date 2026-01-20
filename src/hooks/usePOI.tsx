import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface POI {
  id: string;
  nombre: string;
  tipo: string;
  lat: number;
  lng: number;
  direccion: string | null;
  ciudad: string | null;
}

export interface POIType {
  value: string;
  label: string;
  icon: string;
  count: number;
}

export interface ProximityResult {
  billboardId: string;
  billboardNombre: string;
  poiId: string;
  poiNombre: string;
  distanceMeters: number;
}

// Radius options in meters
export const RADIUS_OPTIONS = [
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
];

// POI type labels with icons
export const POI_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  aeropuerto: { label: "Aeropuertos", icon: "✈️" },
  centro_comercial: { label: "Centros Comerciales", icon: "🛒" },
  estadio: { label: "Estadios", icon: "🏟️" },
  hospital: { label: "Hospitales", icon: "🏥" },
  universidad: { label: "Universidades", icon: "🎓" },
  hotel: { label: "Hoteles", icon: "🏨" },
  restaurante: { label: "Restaurantes", icon: "🍽️" },
  gasolinera: { label: "Gasolineras", icon: "⛽" },
};

export function usePOI() {
  const [poiTypes, setPoiTypes] = useState<POIType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available POI types with counts
  const fetchPOITypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("points_of_interest")
        .select("tipo");

      if (fetchError) throw fetchError;

      // Count by type
      const typeCounts: Record<string, number> = {};
      (data || []).forEach((poi) => {
        typeCounts[poi.tipo] = (typeCounts[poi.tipo] || 0) + 1;
      });

      // Build POI types list
      const types: POIType[] = Object.entries(typeCounts)
        .map(([tipo, count]) => ({
          value: tipo,
          label: POI_TYPE_LABELS[tipo]?.label || tipo,
          icon: POI_TYPE_LABELS[tipo]?.icon || "📍",
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setPoiTypes(types);
    } catch (err: any) {
      console.error("Error fetching POI types:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get billboards near a specific POI type within radius
  const getBillboardsNearPOI = useCallback(
    async (poiType: string, radiusMeters: number): Promise<string[]> => {
      try {
        const { data, error: fetchError } = await supabase.rpc(
          "get_billboards_near_poi",
          {
            poi_type: poiType,
            radius_meters: radiusMeters,
          }
        );

        if (fetchError) throw fetchError;

        // Return unique billboard IDs
        const billboardIds = new Set<string>();
        (data || []).forEach((result: any) => {
          billboardIds.add(result.billboard_id);
        });

        return Array.from(billboardIds);
      } catch (err) {
        console.error("Error getting billboards near POI:", err);
        return [];
      }
    },
    []
  );

  // Get all POIs of a specific type
  const getPOIsByType = useCallback(async (poiType: string): Promise<POI[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from("points_of_interest")
        .select("*")
        .eq("tipo", poiType);

      if (fetchError) throw fetchError;

      return (data || []).map((poi) => ({
        id: poi.id,
        nombre: poi.nombre,
        tipo: poi.tipo,
        lat: Number(poi.lat),
        lng: Number(poi.lng),
        direccion: poi.direccion,
        ciudad: poi.ciudad,
      }));
    } catch (err) {
      console.error("Error fetching POIs:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchPOITypes();
  }, [fetchPOITypes]);

  return {
    poiTypes,
    loading,
    error,
    getBillboardsNearPOI,
    getPOIsByType,
    refetch: fetchPOITypes,
  };
}
