/**
 * Location utilities for calculating distances and validating proximity
 */

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

/**
 * Formats distance in human-readable format
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.2 km" or "450 m")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

/**
 * Validates if collector is within acceptable proximity to the waste location
 * @param reportLat - Reported waste latitude
 * @param reportLon - Reported waste longitude
 * @param collectorLat - Collector's current latitude
 * @param collectorLon - Collector's current longitude
 * @param thresholdMeters - Maximum acceptable distance (default: 500m)
 * @returns Object with isValid boolean, distance, and formatted distance
 */
export function validateProximity(
  reportLat: number | null,
  reportLon: number | null,
  collectorLat: number,
  collectorLon: number,
  thresholdMeters: number = 500
): {
  isValid: boolean;
  distance: number;
  formattedDistance: string;
  message: string;
} {
  // If report doesn't have coordinates, skip proximity check
  if (reportLat === null || reportLon === null) {
    return {
      isValid: true,
      distance: 0,
      formattedDistance: "Unknown",
      message: "Location verification skipped (no coordinates available)",
    };
  }

  const distance = calculateDistance(
    reportLat,
    reportLon,
    collectorLat,
    collectorLon
  );

  const formattedDistance = formatDistance(distance);

  if (distance > thresholdMeters) {
    return {
      isValid: false,
      distance,
      formattedDistance,
      message: `You are ${formattedDistance} away from the waste location (max: ${formatDistance(
        thresholdMeters
      )})`,
    };
  }

  return {
    isValid: true,
    distance,
    formattedDistance,
    message: `Location verified (${formattedDistance} away)`,
  };
}

/**
 * Gets distance from user's current location to a waste report
 * Useful for sorting/filtering reports by distance
 */
export function getDistanceToReport(
  userLat: number,
  userLon: number,
  reportLat: number | null,
  reportLon: number | null
): number | null {
  if (reportLat === null || reportLon === null) {
    return null;
  }
  return calculateDistance(userLat, userLon, reportLat, reportLon);
}

/**
 * Sorts an array of reports by distance from user
 */
export function sortByDistance<T extends { latitude: number | null; longitude: number | null }>(
  reports: T[],
  userLat: number,
  userLon: number
): T[] {
  return [...reports].sort((a, b) => {
    const distA = getDistanceToReport(userLat, userLon, a.latitude, a.longitude);
    const distB = getDistanceToReport(userLat, userLon, b.latitude, b.longitude);
    
    // Put items without location at the end
    if (distA === null) return 1;
    if (distB === null) return -1;
    
    return distA - distB;
  });
}
