import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LocationSuggestion {
  value: string;
  label: string;
  type: "ciudad" | "zona" | "colonia";
  count: number;
}

// Normalize text for comparison (remove accents, lowercase, trim)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Extract city from address
function extractCity(direccion: string): string {
  const direccionLower = direccion.toLowerCase();
  const normalized = normalizeText(direccion);

  // Known cities mapping
  const cityMappings: Record<string, string> = {
    cdmx: "CDMX",
    "ciudad de mexico": "CDMX",
    "mexico city": "CDMX",
    "distrito federal": "CDMX",
    "miguel hidalgo": "CDMX",
    "benito juarez": "CDMX",
    cuauhtemoc: "CDMX",
    coyoacan: "CDMX",
    polanco: "CDMX",
    naucalpan: "CDMX",
    "alvaro obregon": "CDMX",
    tlalnepantla: "CDMX",
    "santa fe": "CDMX",
    reforma: "CDMX",
    insurgentes: "CDMX",
    periferico: "CDMX",
    constituyentes: "CDMX",
    monterrey: "Monterrey",
    "nuevo leon": "Monterrey",
    "san pedro garza garcia": "Monterrey",
    guadalajara: "Guadalajara",
    jalisco: "Guadalajara",
    zapopan: "Guadalajara",
    merida: "Mérida",
    yucatan: "Mérida",
    montecristo: "Mérida",
    cancun: "Cancún",
    "quintana roo": "Cancún",
    puebla: "Puebla",
    queretaro: "Querétaro",
    tijuana: "Tijuana",
    "baja california": "Tijuana",
  };

  for (const [key, city] of Object.entries(cityMappings)) {
    if (normalized.includes(key)) {
      return city;
    }
  }

  // Try to extract from address parts
  const parts = direccion.split(/[,\n]/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim() || "México";
  }

  return "México";
}

// Extract zone/colonia from address
function extractZone(direccion: string): string {
  const parts = direccion.split(/[,\n]/);
  if (parts.length >= 2) {
    // Usually the zone/colonia is in the middle
    return parts[Math.min(1, parts.length - 2)].trim();
  }
  return "";
}

export function useLocationSuggestions() {
  const [allLocations, setAllLocations] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all unique locations from billboards
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("billboards")
        .select("id, direccion, lat, lng")
        .eq("status", "disponible");

      if (fetchError) throw fetchError;

      const billboards = data || [];

      // Count by city
      const cityCount: Record<string, number> = {};
      const zoneCount: Record<string, { count: number; city: string }> = {};

      billboards.forEach((b) => {
        const city = extractCity(b.direccion || "");
        const zone = extractZone(b.direccion || "");

        // Count cities
        cityCount[city] = (cityCount[city] || 0) + 1;

        // Count zones within cities
        if (zone) {
          const zoneKey = `${zone}-${city}`;
          if (!zoneCount[zoneKey]) {
            zoneCount[zoneKey] = { count: 0, city };
          }
          zoneCount[zoneKey].count += 1;
        }
      });

      // Build suggestions list
      const suggestions: LocationSuggestion[] = [];

      // Add cities
      Object.entries(cityCount)
        .filter(([city]) => city !== "México")
        .sort((a, b) => b[1] - a[1])
        .forEach(([city, count]) => {
          suggestions.push({
            value: city,
            label: city,
            type: "ciudad",
            count,
          });
        });

      // Add zones (only if they have multiple billboards)
      Object.entries(zoneCount)
        .filter(([_, data]) => data.count >= 2)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
        .forEach(([key, data]) => {
          const zone = key.replace(`-${data.city}`, "");
          suggestions.push({
            value: zone,
            label: `${zone}, ${data.city}`,
            type: "zona",
            count: data.count,
          });
        });

      setAllLocations(suggestions);
    } catch (err: any) {
      console.error("Error fetching locations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Filter suggestions based on query
  const getSuggestions = useCallback(
    (query: string): LocationSuggestion[] => {
      if (!query || query.length < 1) {
        // Return top cities when no query
        return allLocations.filter((l) => l.type === "ciudad").slice(0, 8);
      }

      const normalized = normalizeText(query);

      return allLocations
        .filter((loc) => {
          const normalizedLabel = normalizeText(loc.label);
          const normalizedValue = normalizeText(loc.value);
          return (
            normalizedLabel.includes(normalized) ||
            normalizedValue.includes(normalized)
          );
        })
        .sort((a, b) => {
          // Prioritize exact matches
          const aExact = normalizeText(a.value).startsWith(normalized);
          const bExact = normalizeText(b.value).startsWith(normalized);
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // Then by type (cities first)
          if (a.type === "ciudad" && b.type !== "ciudad") return -1;
          if (a.type !== "ciudad" && b.type === "ciudad") return 1;

          // Then by count
          return b.count - a.count;
        })
        .slice(0, 10);
    },
    [allLocations]
  );

  // Get unique cities list
  const cities = useMemo(() => {
    return allLocations
      .filter((l) => l.type === "ciudad")
      .map((l) => l.value);
  }, [allLocations]);

  return {
    allLocations,
    loading,
    error,
    getSuggestions,
    cities,
    refetch: fetchLocations,
  };
}
