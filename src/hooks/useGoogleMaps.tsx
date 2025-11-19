import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// Singleton instance of the loader
let loaderInstance: Loader | null = null;
let isLoading = false;
let isLoaded = false;

const GOOGLE_MAPS_API_KEY = "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80";

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(isLoaded);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setLoaded(true);
      return;
    }

    if (isLoading) {
      setLoading(true);
      return;
    }

    const initGoogleMaps = async () => {
      try {
        isLoading = true;
        setLoading(true);

        if (!loaderInstance) {
          loaderInstance = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: "weekly",
            libraries: ["places", "geometry", "marker"]
          });
        }

        await loaderInstance.load();
        
        isLoaded = true;
        isLoading = false;
        setLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        isLoading = false;
        setError(err as Error);
        setLoading(false);
      }
    };

    initGoogleMaps();
  }, []);

  return { loaded, loading, error };
}

export function getGoogleMapsLoader() {
  return loaderInstance;
}
