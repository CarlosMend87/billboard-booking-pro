// Geographical utility functions for distance calculations
import { searchNearbyPOIs, getPOIRadius, findNearestPOI } from './placesService';

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
 * Check if a billboard is within proximity of any selected POIs using real Google Places data
 */
export async function isWithinProximityAsync(
  billboardLat: number,
  billboardLng: number,
  selectedPOIs: string[]
): Promise<{ isNear: boolean; nearestPOI?: string; distance?: number; poiName?: string }> {
  if (selectedPOIs.length === 0) {
    return { isNear: true }; // No proximity filter applied
  }

  let nearestDistance = Infinity;
  let nearestPOIType = '';
  let nearestPOIName = '';

  for (const poiType of selectedPOIs) {
    const radius = getPOIRadius(poiType);
    
    // Search for real POIs near the billboard
    const pois = await searchNearbyPOIs(
      { lat: billboardLat, lng: billboardLng },
      poiType,
      radius
    );

    if (pois.length === 0) continue;

    // Find the nearest POI of this type
    const nearest = findNearestPOI(billboardLat, billboardLng, pois);
    
    if (nearest && nearest.distance < nearestDistance && nearest.distance <= radius) {
      nearestDistance = nearest.distance;
      nearestPOIType = poiType;
      nearestPOIName = nearest.poi.name || '';
    }
  }

  if (nearestDistance === Infinity) {
    return { isNear: false };
  }

  return {
    isNear: true,
    nearestPOI: nearestPOIType,
    distance: nearestDistance,
    poiName: nearestPOIName
  };
}

/**
 * Synchronous version for backwards compatibility - returns true by default for selected POIs
 * Should be replaced with async version for real filtering
 */
export function isWithinProximity(
  billboardLat: number,
  billboardLng: number,
  selectedPOIs: string[]
): { isNear: boolean; nearestPOI?: string; distance?: number } {
  if (selectedPOIs.length === 0) {
    return { isNear: true };
  }

  // For sync version, we'll return true to show all billboards
  // The actual filtering will happen in the component using the async version
  return { 
    isNear: true,
    nearestPOI: selectedPOIs[0],
    distance: 0
  };
}
