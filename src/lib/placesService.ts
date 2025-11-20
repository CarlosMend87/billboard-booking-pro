// Google Places API service for finding real POIs
import { loadGoogleMaps } from "./googleMapsLoader";

const GOOGLE_MAPS_API_KEY = "AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80";

// Cache for POI searches to avoid excessive API calls
const poiCache = new Map<string, google.maps.places.PlaceResult[]>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface POICacheEntry {
  results: google.maps.places.PlaceResult[];
  timestamp: number;
}

const cache = new Map<string, POICacheEntry>();

// Map POI types to Google Places types
const POI_TYPE_MAPPING: Record<string, string> = {
  restaurantes: 'restaurant',
  mcdonalds: 'restaurant',
  starbucks: 'cafe',
  hospitales: 'hospital',
  concesionarios: 'car_dealer',
  tiendas_conveniencia: 'convenience_store',
  supermercados: 'supermarket',
  centros_comerciales: 'shopping_mall',
  universidades: 'university',
  bancos: 'bank',
  gasolineras: 'gas_station',
  farmacias: 'pharmacy',
  gimnasios: 'gym',
  cines: 'movie_theater',
  bares: 'bar'
};

// Radius in meters for POI search
const SEARCH_RADIUS_MAPPING: Record<string, number> = {
  restaurantes: 500,
  mcdonalds: 300,
  starbucks: 300,
  hospitales: 1000,
  concesionarios: 500,
  tiendas_conveniencia: 300,
  supermercados: 400,
  centros_comerciales: 1000,
  universidades: 800,
  bancos: 300,
  gasolineras: 200,
  farmacias: 200,
  gimnasios: 400,
  cines: 500,
  bares: 300
};

let placesServiceInstance: google.maps.places.PlacesService | null = null;
let mapInstance: google.maps.Map | null = null;

/**
 * Initialize Places Service
 */
export async function initPlacesService(): Promise<google.maps.places.PlacesService> {
  if (placesServiceInstance) {
    return placesServiceInstance;
  }

  try {
    await loadGoogleMaps();

    // Create a hidden map div for PlacesService
    const mapDiv = document.createElement('div');
    mapDiv.style.display = 'none';
    document.body.appendChild(mapDiv);

    mapInstance = new google.maps.Map(mapDiv, {
      center: { lat: 23.6345, lng: -102.5528 },
      zoom: 5
    });

    placesServiceInstance = new google.maps.places.PlacesService(mapInstance);
    return placesServiceInstance;
  } catch (error) {
    console.error('Error initializing Places Service:', error);
    throw error;
  }
}

/**
 * Search for POIs near a location
 */
export async function searchNearbyPOIs(
  location: { lat: number; lng: number },
  poiType: string,
  radius: number = 1000
): Promise<google.maps.places.PlaceResult[]> {
  const cacheKey = `${poiType}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${radius}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  try {
    const service = await initPlacesService();
    const googleType = POI_TYPE_MAPPING[poiType] || poiType;

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type: googleType
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Cache results
          cache.set(cacheKey, {
            results,
            timestamp: Date.now()
          });
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          console.error('Places API error:', status);
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error('Error searching nearby POIs:', error);
    return [];
  }
}

/**
 * Get the radius for a specific POI type
 */
export function getPOIRadius(poiType: string): number {
  return SEARCH_RADIUS_MAPPING[poiType] || 500;
}

/**
 * Find the nearest POI from a list of POIs to a specific location
 */
export function findNearestPOI(
  billboardLat: number,
  billboardLng: number,
  pois: google.maps.places.PlaceResult[]
): { poi: google.maps.places.PlaceResult; distance: number } | null {
  if (pois.length === 0) return null;

  let nearest: { poi: google.maps.places.PlaceResult; distance: number } | null = null;
  let minDistance = Infinity;

  for (const poi of pois) {
    if (!poi.geometry?.location) continue;

    const poiLat = poi.geometry.location.lat();
    const poiLng = poi.geometry.location.lng();

    // Calculate distance using Haversine formula
    const distance = calculateDistance(billboardLat, billboardLng, poiLat, poiLng);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { poi, distance };
    }
  }

  return nearest;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Clear the POI cache
 */
export function clearPOICache(): void {
  cache.clear();
}
