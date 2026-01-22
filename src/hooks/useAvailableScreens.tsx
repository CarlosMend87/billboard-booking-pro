import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScreenCardProps } from "@/components/advertiser/ScreenCard";
import { ScreenDetail } from "@/components/advertiser/ScreenDetailModal";

interface Billboard {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  lat: number;
  lng: number;
  precio: Record<string, number>;
  medidas: Record<string, number | string>;
  digital: Record<string, boolean | string | number> | null;
  fotos: string[];
  contratacion: Record<string, boolean | number>;
  has_computer_vision: boolean;
  last_detection_count: number | null;
  status: string;
  owner_id: string;
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

// Determine badge based on real billboard data
const getBadge = (billboard: Billboard): "alta-demanda" | "disponible" | "premium" | undefined => {
  if (billboard.has_computer_vision) return "premium";
  const isDigital = billboard.tipo === 'digital' || (billboard.digital && billboard.digital.cantidad_slots);
  if (isDigital) return "alta-demanda";
  return "disponible";
};

// Extract real monthly price from price object
const getPrecioMensual = (precio: Record<string, number> | null): number | null => {
  if (!precio) return null;
  if (typeof precio === 'object') {
    if (precio.mensual) return precio.mensual;
    if (precio.catorcenal) return precio.catorcenal * 2;
    if (precio.semanal) return precio.semanal * 4;
    if (precio.dia) return precio.dia * 30;
  }
  return null;
};

// Calculate real impacts based on computer vision detections or estimate by type
const getImpactos = (billboard: Billboard): number | null => {
  if (billboard.has_computer_vision && billboard.last_detection_count) {
    return billboard.last_detection_count * 30;
  }
  if (billboard.digital && billboard.digital.slots_por_hora) {
    const slotsHora = Number(billboard.digital.slots_por_hora) || 12;
    return slotsHora * 16 * 30 * 50;
  }
  return null;
};

// Extract city from address
const getLocation = (billboard: Billboard): string => {
  const direccion = billboard.direccion || "";
  const direccionLower = direccion.toLowerCase();
  
  if (direccionLower.includes("cdmx") || direccionLower.includes("ciudad de méxico") || 
      direccionLower.includes("naucalpan") || direccionLower.includes("polanco") ||
      direccionLower.includes("santa fe") || direccionLower.includes("reforma")) {
    return "CDMX";
  }
  if (direccionLower.includes("monterrey") || direccionLower.includes("nuevo león") ||
      direccionLower.includes("san pedro") || direccionLower.includes("garza garcía")) {
    return "Monterrey";
  }
  if (direccionLower.includes("guadalajara") || direccionLower.includes("jalisco") ||
      direccionLower.includes("zapopan")) {
    return "Guadalajara";
  }
  if (direccionLower.includes("mérida") || direccionLower.includes("yucatán") ||
      direccionLower.includes("montecristo")) {
    return "Mérida";
  }
  if (direccionLower.includes("cancún") || direccionLower.includes("quintana roo")) {
    return "Cancún";
  }
  if (direccionLower.includes("puebla")) {
    return "Puebla";
  }
  if (direccionLower.includes("tijuana") || direccionLower.includes("baja california")) {
    return "Tijuana";
  }
  
  const parts = direccion.split(",");
  if (parts.length > 1) {
    return parts[parts.length - 1].trim() || "México";
  }
  return "México";
};

// Extract specific location (street/zone) from address
const getUbicacionEspecifica = (billboard: Billboard): string => {
  const direccion = billboard.direccion || "";
  const parts = direccion.split(",");
  if (parts.length > 0) {
    const ubicacion = parts[0].trim();
    return ubicacion.length > 50 ? ubicacion.substring(0, 47) + "..." : ubicacion;
  }
  return billboard.nombre || "Sin ubicación";
};

export function useAvailableScreens(dateRange?: DateRange) {
  const [screens, setScreens] = useState<ScreenCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScreens = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data: Billboard[];

      // If dates are provided, use the RPC function to filter by availability
      if (dateRange?.startDate && dateRange?.endDate) {
        const { data: availableData, error: rpcError } = await supabase
          .rpc("get_available_billboards", {
            p_start_date: dateRange.startDate.toISOString().split('T')[0],
            p_end_date: dateRange.endDate.toISOString().split('T')[0],
          });

        if (rpcError) throw rpcError;
        data = (availableData || []) as Billboard[];
      } else {
        // No dates, just get all available billboards
        const { data: allData, error: fetchError } = await supabase
          .from("billboards")
          .select("*")
          .eq("status", "disponible")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        data = (allData || []) as Billboard[];
      }

      const mappedScreens: ScreenCardProps[] = data.map((b) => {
        const precio = getPrecioMensual(b.precio);
        const impactos = getImpactos(b);
        
        return {
          id: b.id,
          nombre: b.nombre,
          ubicacion: getUbicacionEspecifica(b),
          ciudad: getLocation(b),
          precio: precio,
          impactos: impactos,
          imagenes: b.fotos && b.fotos.length > 0 ? b.fotos : [],
          badge: getBadge(b),
          tipo: b.tipo,
          hasComputerVision: b.has_computer_vision,
          lat: Number(b.lat) || undefined,
          lng: Number(b.lng) || undefined,
        };
      });

      setScreens(mappedScreens);
    } catch (err: any) {
      console.error("Error fetching available screens:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()]);

  useEffect(() => {
    fetchScreens();
  }, [fetchScreens]);

  const getScreenById = async (id: string): Promise<ScreenDetail | null> => {
    try {
      const { data, error } = await supabase
        .from("billboards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const b = data as Billboard;
      
      return {
        id: b.id,
        nombre: b.nombre,
        direccion: b.direccion,
        ubicacion: getLocation(b),
        tipo: b.tipo,
        lat: Number(b.lat),
        lng: Number(b.lng),
        precio: b.precio,
        medidas: b.medidas,
        digital: b.digital,
        fotos: b.fotos || [],
        contratacion: b.contratacion,
        has_computer_vision: b.has_computer_vision,
        status: b.status,
        last_detection_count: b.last_detection_count,
      };
    } catch (err) {
      console.error("Error fetching screen by id:", err);
      return null;
    }
  };

  // Check if a specific billboard is available for a date range
  const checkAvailability = async (
    billboardId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc("check_billboard_availability", {
          p_billboard_id: billboardId,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: endDate.toISOString().split('T')[0],
        });

      if (error) throw error;
      return data as boolean;
    } catch (err) {
      console.error("Error checking availability:", err);
      return false;
    }
  };

  const getScreensByCity = (city: string): ScreenCardProps[] => {
    return screens.filter((s) => 
      s.ciudad.toLowerCase().includes(city.toLowerCase())
    );
  };

  return {
    screens,
    loading,
    error,
    refetch: fetchScreens,
    getScreenById,
    getScreensByCity,
    checkAvailability,
  };
}
