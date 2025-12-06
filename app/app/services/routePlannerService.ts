const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface RouteReport {
  id: string;
  reporterId: string;
  collectorId: string | null;
  routeCollectorId: string | null;
  imageUrl: string;
  collectorImageUrl: string | null;
  locationRaw: string;
  isLocationLatLng: boolean;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  aiAnalysis: any;
  status: "PENDING" | "IN_PROGRESS" | "COLLECTED";
  reportedAt: string;
  collectedAt: string | null;
  reporter?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Add a waste report to the route planner
 */
export async function addToRoutePlanner(
  reportId: string,
  userId: string
): Promise<{ success: boolean; report: RouteReport }> {
  try {
    const response = await fetch(`${API_URL}/api/route-planner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add to route planner");
    }

    const data = await response.json();
    console.log("✅ Report added to route planner:", data);

    return data;
  } catch (error: any) {
    console.error("❌ Error adding to route planner:", error);
    throw error;
  }
}

/**
 * Get all reports in user's route planner
 */
export async function fetchRoutePlannerReports(
  userId: string
): Promise<RouteReport[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/route-planner/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch route planner reports");
    }

    const data = await response.json();
    console.log(
      `✅ Fetched ${data.reports.length} reports from route planner`
    );

    return data.reports;
  } catch (error: any) {
    console.error("❌ Error fetching route planner reports:", error);
    throw error;
  }
}

/**
 * Remove a report from the route planner
 */
export async function removeFromRoutePlanner(
  reportId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(
      `${API_URL}/api/route-planner/${reportId}?userId=${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove from route planner");
    }

    const data = await response.json();
    console.log("✅ Report removed from route planner:", data);

    return data;
  } catch (error: any) {
    console.error("❌ Error removing from route planner:", error);
    throw error;
  }
}
