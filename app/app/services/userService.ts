const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  enableCollector: boolean;
  reporterPoints: number;
  collectorPoints: number;
  globalPoints: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch current user profile from backend
 */
export async function fetchUserProfile(
  userId: string
): Promise<UserProfile> {
  try {
    console.log("📡 Fetching user profile...");
    
    const response = await fetch(`${API_URL}/api/user/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ User profile fetched successfully");
    return data.user;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    throw new Error(
      `Failed to fetch user profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    enableCollector?: boolean;
  }
): Promise<UserProfile> {
  try {
    console.log("📡 Updating user profile...", updates);
    
    const response = await fetch(`${API_URL}/api/user/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile");
    }

    const data = await response.json();
    console.log("✅ User profile updated successfully");
    return data.user;
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw new Error(
      `Failed to update user profile: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Check if user profile is complete
 * User must have name, phone, city, state, and country to report/collect waste
 */
export function isProfileComplete(user: UserProfile | null): boolean {
  if (!user) return false;
  return !!(
    user.name &&
    user.phone &&
    user.city &&
    user.state &&
    user.country
  );
}

/**
 * Check if user can collect waste
 * Must have complete profile AND collector mode enabled
 */
export function canCollectWaste(user: UserProfile | null): boolean {
  if (!user) return false;
  return isProfileComplete(user) && user.enableCollector;
}

/**
 * Get profile completion message
 */
export function getProfileCompletionMessage(user: UserProfile | null): string {
  if (!user) return "User not found";
  
  const missing: string[] = [];
  if (!user.name) missing.push("name");
  if (!user.phone) missing.push("phone number");
  if (!user.city) missing.push("city");
  if (!user.state) missing.push("state");
  if (!user.country) missing.push("country");
  
  if (missing.length === 0) return "Profile complete";
  
  return `Please complete your profile: Add your ${missing.join(", ")}`;
}
