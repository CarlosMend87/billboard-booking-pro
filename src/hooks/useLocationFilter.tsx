import { useState, useEffect } from 'react';
import { useGoogleMaps } from './useGoogleMaps';

// Mapping of Spanish keywords to search terms for nearby places
const KEYWORD_TO_SEARCH_TERMS: { [key: string]: string[] } = {
  "Bars": ["bar", "nightclub"],
  "Restaurantes": ["restaurant"],
  "McDonalds": ["McDonald's"],
  "Starbucks": ["Starbucks"],
  "Hospitales": ["hospital"],
  "Concesionarios de Autos": ["car dealer"],
  "Tiendas de Conveniencia": ["convenience store", "7-Eleven", "Oxxo"],
  "Supermercados": ["supermarket", "grocery"],
  "Centros Comerciales": ["shopping mall", "shopping center"],
  "Universidades": ["university", "college"],
  "Bancos": ["bank"],
  "Gasolineras": ["gas station"],
  "Farmacias": ["pharmacy", "drugstore"],
  "Gimnasios": ["gym", "fitness"],
  "Cines": ["movie theater", "cinema"]
};

interface NearbyPlacesCache {
  [billboardId: string]: {
    [keyword: string]: boolean;
  };
}

export function useLocationFilter() {
  const [nearbyPlacesCache, setNearbyPlacesCache] = useState<NearbyPlacesCache>({});
  const [loading, setLoading] = useState(false);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const { loaded: mapsLoaded } = useGoogleMaps();

  // Initialize Google Maps Places Service
  useEffect(() => {
    if (!mapsLoaded) return;

    const initPlacesService = async () => {
      try {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        setPlacesService(service);
      } catch (error) {
        console.error('Error loading Google Maps Places:', error);
      }
    };

    initPlacesService();
  }, [mapsLoaded]);

  const checkNearbyPlaces = async (
    billboardId: string,
    lat: number,
    lng: number,
    keywords: string[]
  ): Promise<boolean> => {
    if (keywords.length === 0) return true;
    if (!placesService) return true; // If service not loaded, don't filter out

    // Check cache first
    const cached = nearbyPlacesCache[billboardId];
    if (cached) {
      return keywords.some(keyword => cached[keyword] === true);
    }

    setLoading(true);

    try {
      const results: { [keyword: string]: boolean } = {};

      // Check each keyword
      for (const keyword of keywords) {
        const searchTerms = KEYWORD_TO_SEARCH_TERMS[keyword] || [keyword];
        let found = false;

        for (const term of searchTerms) {
          const request: google.maps.places.TextSearchRequest = {
            location: new google.maps.LatLng(lat, lng),
            radius: 500, // 500 meters
            query: term
          };

          const response = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
            placesService!.textSearch(request, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else {
                resolve([]);
              }
            });
          });

          if (response.length > 0) {
            found = true;
            break;
          }
        }

        results[keyword] = found;
      }

      // Update cache
      setNearbyPlacesCache(prev => ({
        ...prev,
        [billboardId]: results
      }));

      setLoading(false);
      return keywords.some(keyword => results[keyword] === true);
    } catch (error) {
      console.error('Error checking nearby places:', error);
      setLoading(false);
      return true; // Don't filter out on error
    }
  };

  return { checkNearbyPlaces, loading };
}
