// Geographical utility functions for distance calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
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

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * POI coordinates for proximity filtering
 * These are example coordinates for major establishments in Mexico
 */
export const POI_CATEGORIES = {
  restaurantes: { lat: 19.4326, lng: -99.1332, radius: 500 }, // Mexico City center
  mcdonalds: { lat: 19.4326, lng: -99.1332, radius: 300 },
  starbucks: { lat: 19.4326, lng: -99.1332, radius: 300 },
  hospitales: { lat: 19.4326, lng: -99.1332, radius: 1000 },
  concesionarios: { lat: 19.4326, lng: -99.1332, radius: 500 },
  tiendas_conveniencia: { lat: 19.4326, lng: -99.1332, radius: 300 },
  supermercados: { lat: 19.4326, lng: -99.1332, radius: 400 },
  centros_comerciales: { lat: 19.4326, lng: -99.1332, radius: 1000 },
  universidades: { lat: 19.4326, lng: -99.1332, radius: 800 },
  bancos: { lat: 19.4326, lng: -99.1332, radius: 300 },
  gasolineras: { lat: 19.4326, lng: -99.1332, radius: 200 },
  farmacias: { lat: 19.4326, lng: -99.1332, radius: 200 },
  gimnasios: { lat: 19.4326, lng: -99.1332, radius: 400 },
  cines: { lat: 19.4326, lng: -99.1332, radius: 500 },
  bares: { lat: 19.4326, lng: -99.1332, radius: 300 }
};

/**
 * Check if a billboard is within proximity of any selected POIs
 */
export function isWithinProximity(
  billboardLat: number,
  billboardLng: number,
  selectedPOIs: string[]
): { isNear: boolean; nearestPOI?: string; distance?: number } {
  if (selectedPOIs.length === 0) {
    return { isNear: true }; // No proximity filter applied
  }

  let nearestDistance = Infinity;
  let nearestPOI = '';

  for (const poi of selectedPOIs) {
    const poiData = POI_CATEGORIES[poi as keyof typeof POI_CATEGORIES];
    if (!poiData) continue;

    const distance = calculateDistance(
      billboardLat,
      billboardLng,
      poiData.lat,
      poiData.lng
    );

    if (distance <= poiData.radius && distance < nearestDistance) {
      nearestDistance = distance;
      nearestPOI = poi;
    }
  }

  if (nearestDistance === Infinity) {
    return { isNear: false };
  }

  return {
    isNear: true,
    nearestPOI,
    distance: nearestDistance
  };
}
