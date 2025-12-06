import { DUMPING_GROUNDS, DumpingGround } from "../data/dumpingGrounds";
import { calculateDistance, formatDistance } from "../utils/locationUtils";

export interface DumpingGroundWithDistance extends DumpingGround {
  distance: number;
  formattedDistance: string;
}

/**
 * Finds the nearest dumping grounds to a given location
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param limit - Maximum number of results (default: 3)
 * @returns Array of nearest dumping grounds with distance
 */
export function findNearestDumpingGrounds(
  latitude: number,
  longitude: number,
  limit: number = 3
): DumpingGroundWithDistance[] {
  // Calculate distance for each dumping ground
  const groundsWithDistance = DUMPING_GROUNDS.map((ground) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      ground.latitude,
      ground.longitude
    );

    return {
      ...ground,
      distance,
      formattedDistance: formatDistance(distance),
    };
  });

  // Sort by distance and return top results
  return groundsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Finds dumping grounds that accept a specific waste type
 * @param wasteType - Type of waste (e.g., "Plastic", "Organic")
 * @param latitude - User's current latitude
 * @param longitude - User's current longitude
 * @param limit - Maximum number of results (default: 3)
 * @returns Array of nearest suitable dumping grounds
 */
export function findSuitableDumpingGrounds(
  wasteType: string,
  latitude: number,
  longitude: number,
  limit: number = 3
): DumpingGroundWithDistance[] {
  // Filter grounds that accept this waste type
  const suitableGrounds = DUMPING_GROUNDS.filter(
    (ground) =>
      ground.acceptedWaste.includes(wasteType) ||
      ground.acceptedWaste.includes("All types") ||
      ground.acceptedWaste.includes("Mixed")
  );

  // Calculate distance for each suitable ground
  const groundsWithDistance = suitableGrounds.map((ground) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      ground.latitude,
      ground.longitude
    );

    return {
      ...ground,
      distance,
      formattedDistance: formatDistance(distance),
    };
  });

  // Sort by distance and return top results
  return groundsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Opens the dumping ground location in Google Maps
 * @param ground - Dumping ground to navigate to
 */
export function navigateToDumpingGround(ground: DumpingGround): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${ground.latitude},${ground.longitude}`;
  // This will be used with Linking.openURL(url) in the component
  return url as any;
}
