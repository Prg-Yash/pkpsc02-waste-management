/**
 * Location validation utilities
 * Validates if user's current location is within their registered state
 */

// Simplified state boundaries for India (expandable to other countries)
// Format: { state: { minLat, maxLat, minLng, maxLng } }
const INDIA_STATE_BOUNDARIES: { [key: string]: { minLat: number; maxLat: number; minLng: number; maxLng: number } } = {
  maharashtra: { minLat: 15.6, maxLat: 22.0, minLng: 72.6, maxLng: 80.9 },
  delhi: { minLat: 28.4, maxLat: 28.9, minLng: 76.8, maxLng: 77.3 },
  karnataka: { minLat: 11.5, maxLat: 18.5, minLng: 74.0, maxLng: 78.6 },
  "tamil nadu": { minLat: 8.1, maxLat: 13.6, minLng: 76.2, maxLng: 80.3 },
  "west bengal": { minLat: 21.5, maxLat: 27.2, minLng: 85.8, maxLng: 89.9 },
  gujarat: { minLat: 20.1, maxLat: 24.7, minLng: 68.2, maxLng: 74.5 },
  rajasthan: { minLat: 23.0, maxLat: 30.2, minLng: 69.5, maxLng: 78.3 },
  "uttar pradesh": { minLat: 23.9, maxLat: 30.4, minLng: 77.1, maxLng: 84.6 },
  "madhya pradesh": { minLat: 21.1, maxLat: 26.9, minLng: 74.0, maxLng: 82.8 },
  telangana: { minLat: 15.9, maxLat: 19.9, minLng: 77.2, maxLng: 81.3 },
  "andhra pradesh": { minLat: 12.6, maxLat: 19.9, minLng: 76.8, maxLng: 84.8 },
  punjab: { minLat: 29.5, maxLat: 32.6, minLng: 73.9, maxLng: 76.9 },
  haryana: { minLat: 27.7, maxLat: 30.9, minLng: 74.5, maxLng: 77.6 },
  kerala: { minLat: 8.2, maxLat: 12.8, minLng: 74.9, maxLng: 77.4 },
  odisha: { minLat: 17.8, maxLat: 22.6, minLng: 81.3, maxLng: 87.5 },
  jharkhand: { minLat: 21.9, maxLat: 25.3, minLng: 83.3, maxLng: 87.9 },
  assam: { minLat: 24.1, maxLat: 28.0, minLng: 89.7, maxLng: 96.0 },
  bihar: { minLat: 24.3, maxLat: 27.5, minLng: 83.3, maxLng: 88.3 },
  chhattisgarh: { minLat: 17.8, maxLat: 24.1, minLng: 80.3, maxLng: 84.4 },
  goa: { minLat: 14.9, maxLat: 15.8, minLng: 73.7, maxLng: 74.3 },
  himachalpradesh: { minLat: 30.4, maxLat: 33.2, minLng: 75.6, maxLng: 79.0 },
  "jammu and kashmir": { minLat: 32.3, maxLat: 37.1, minLng: 73.3, maxLng: 80.3 },
  uttarakhand: { minLat: 28.7, maxLat: 31.5, minLng: 77.6, maxLng: 81.0 },
};

/**
 * Check if coordinates are within a state's boundaries
 */
export function isLocationInState(
  latitude: number,
  longitude: number,
  state: string,
  country: string = "india"
): boolean {
  // Convert state to lowercase for matching
  const stateLower = state.toLowerCase().trim();
  const countryLower = country.toLowerCase().trim();

  // Currently only supporting India, can be expanded
  if (countryLower !== "india") {
    // For non-India countries, skip validation (or add more country data)
    console.log(`⚠️ Location validation not available for ${country}`);
    return true; // Allow by default for unsupported countries
  }

  // Check if we have boundaries for this state
  if (!INDIA_STATE_BOUNDARIES[stateLower]) {
    console.log(`⚠️ State boundaries not found for: ${state}`);
    return true; // Allow by default if state not in our database
  }

  const bounds = INDIA_STATE_BOUNDARIES[stateLower];

  // Check if coordinates are within bounds
  const isWithinBounds =
    latitude >= bounds.minLat &&
    latitude <= bounds.maxLat &&
    longitude >= bounds.minLng &&
    longitude <= bounds.maxLng;

  return isWithinBounds;
}

/**
 * Get validation error message if location is outside state
 */
export function getLocationValidationMessage(
  latitude: number,
  longitude: number,
  state: string,
  country: string = "india"
): string | null {
  if (isLocationInState(latitude, longitude, state, country)) {
    return null; // No error
  }

  return `⚠️ Location Mismatch\n\nYour current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) appears to be outside of ${state}, ${country}.\n\nPlease update your location in profile settings or move to ${state} to report/collect waste.`;
}

/**
 * Validate user location against profile state
 * Returns true if valid, false if invalid
 */
export function validateUserLocation(
  userState: string,
  userCountry: string,
  currentLatitude: number,
  currentLongitude: number
): { isValid: boolean; message: string | null } {
  const message = getLocationValidationMessage(
    currentLatitude,
    currentLongitude,
    userState,
    userCountry
  );

  return {
    isValid: message === null,
    message,
  };
}
