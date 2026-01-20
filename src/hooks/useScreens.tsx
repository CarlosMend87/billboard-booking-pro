import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScreenCardProps } from "@/components/advertiser/ScreenCard";
import { ScreenDetail } from "@/components/advertiser/ScreenDetailModal";

interface Billboard {
  id: string;
  nombre: string;
  direccion: string;
  ubicacion?: string;
  tipo: string;
  lat: number;
  lng: number;
  precio: any;
  medidas: any;
  digital: any;
  fotos: string[];
  contratacion: any;
  has_computer_vision: boolean;
  status: string;
  owner_id: string;
}

const getBadge = (billboard: Billboard): "alta-demanda" | "disponible" | "premium" | undefined => {
  if (billboard.has_computer_vision) return "premium";
  
  const isDigital = typeof billboard.digital === 'object' && billboard.digital?.es_digital === true;
  if (isDigital) return "alta-demanda";
  
  return "disponible";
};

const getPrecioMensual = (precio: any): number => {
  if (typeof precio === 'object' && precio?.mensual) {
    return precio.mensual;
  }
  if (typeof precio === 'number') {
    return precio;
  }
  return 25000;
};

const getLocation = (billboard: Billboard): string => {
  // Extract city from direccion or ubicacion
  const ubicacion = billboard.ubicacion || billboard.direccion || "";
  
  if (ubicacion.toLowerCase().includes("cdmx") || ubicacion.toLowerCase().includes("ciudad de méxico")) {
    return "CDMX";
  }
  if (ubicacion.toLowerCase().includes("monterrey")) {
    return "Monterrey";
  }
  if (ubicacion.toLowerCase().includes("guadalajara")) {
    return "Guadalajara";
  }
  
  // Try to extract from direccion
  const parts = billboard.direccion?.split(",") || [];
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  
  return "México";
};

export function useScreens() {
  const [screens, setScreens] = useState<ScreenCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScreens = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("billboards")
        .select("*")
        .eq("status", "disponible")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const billboards = (data || []) as Billboard[];

      const mappedScreens: ScreenCardProps[] = billboards.map((b) => ({
        id: b.id,
        nombre: b.nombre || "Pantalla sin nombre",
        ubicacion: b.direccion?.split(",")[0] || "Ubicación no especificada",
        ciudad: getLocation(b),
        precio: getPrecioMensual(b.precio),
        rating: 4.5 + Math.random() * 0.5, // Simulated rating
        impactos: 150000 + Math.floor(Math.random() * 200000),
        imagenes: b.fotos && b.fotos.length > 0 ? b.fotos : ["/placeholder.svg"],
        badge: getBadge(b),
      }));

      setScreens(mappedScreens);
    } catch (err: any) {
      console.error("Error fetching screens:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        ubicacion: b.ubicacion || getLocation(b),
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
      };
    } catch (err) {
      console.error("Error fetching screen by id:", err);
      return null;
    }
  };

  const getScreensByCity = (city: string): ScreenCardProps[] => {
    return screens.filter((s) => 
      s.ciudad.toLowerCase().includes(city.toLowerCase())
    );
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  return {
    screens,
    loading,
    error,
    refetch: fetchScreens,
    getScreenById,
    getScreensByCity,
  };
}
