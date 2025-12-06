// Location Service - Reverse Geocoding with Google Maps
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;
; // Normally from env

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Reverse geocode coordinates to get address details using Google Maps API
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("⚠️ Google Maps API key not configured");
      return {
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: "Unknown",
        state: "Unknown",
        country: "India",
      };
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    console.log("🗺️ Reverse geocoding:", { latitude, longitude });
    console.log("📡 API Key (first 10 chars):", GOOGLE_MAPS_API_KEY.substring(0, 10) + "...");

    const response = await fetch(url);
    const data = await response.json();

    console.log("📥 Geocoding response status:", data.status);
    
    if (data.status !== "OK") {
      console.error("❌ Geocoding failed:");
      console.error("   Status:", data.status);
      console.error("   Error:", data.error_message || "No error message");
      
      if (data.status === "REQUEST_DENIED") {
        console.error("   💡 Fix:");
        console.error("   1. Enable Geocoding API at: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com");
        console.error("   2. Make sure API key has no IP/referrer restrictions (for testing)");
        console.error("   3. Wait 1-2 minutes after enabling the API");
      }
      
      return {
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: "Unknown",
        state: "Unknown",
        country: "India",
      };
    }

    const result = data.results[0];
    const addressComponents = result.address_components;

    // Extract city, state, country from address components
    let city = "";
    let state = "";
    let country = "";

    for (const component of addressComponents) {
      const types = component.types;

      // City can be locality, sublocality, or administrative_area_level_2
      if (types.includes("locality")) {
        city = component.long_name;
      } else if (types.includes("sublocality") && !city) {
        city = component.long_name;
      } else if (types.includes("administrative_area_level_2") && !city) {
        city = component.long_name;
      }

      // State
      if (types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }

      // Country
      if (types.includes("country")) {
        country = component.long_name;
      }
    }

    const fullAddress = result.formatted_address;

    console.log("✅ Geocoded:", { city, state, country, address: fullAddress });

    return {
      address: fullAddress,
      city: city || "Unknown",
      state: state || "Unknown",
      country: country || "India",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return {
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: "Unknown",
      state: "Unknown",
      country: "India",
    };
  }
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationData): string {
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  if (location.address) {
    return location.address;
  }
  if (location.latitude && location.longitude) {
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }
  return "Location pending";
}
