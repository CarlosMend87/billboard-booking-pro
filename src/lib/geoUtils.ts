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
 * Simplified proximity check - placeholder
 */
export function isWithinProximity(
  billboardLat: number,
  billboardLng: number,
  selectedPOIs: string[]
): { isNear: boolean; nearestPOI?: string; distance?: number } {
  if (selectedPOIs.length === 0) {
    return { isNear: true };
  }

  // Placeholder - real proximity filtering will be implemented later
  return { 
    isNear: true,
    nearestPOI: selectedPOIs[0],
    distance: 0
  };
}
