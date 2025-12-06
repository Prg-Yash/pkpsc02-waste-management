const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface UserStats {
  totalReported: number;
  totalCollected: number;
  pendingReports: number;
  points: number;
}

/**
 * Fetches user statistics
 * @param userId - User ID
 * @returns User statistics
 */
export async function fetchUserStats(userId: string): Promise<UserStats> {
  try {
    console.log("📡 Fetching user stats...");

    // Fetch reports created by user
    const reportedResponse = await fetch(
      `${API_URL}/api/waste/report?mine=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!reportedResponse.ok) {
      throw new Error(`HTTP ${reportedResponse.status}`);
    }

    const reportedData = await reportedResponse.json();
    const reported = reportedData.wastes || [];

    // Count by status
    const totalReported = reported.length;
    const pendingReports = reported.filter(
      (w: any) => w.status === "PENDING"
    ).length;

    // Fetch reports collected by user
    const collectedResponse = await fetch(
      `${API_URL}/api/waste/report?status=COLLECTED`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );

    if (!collectedResponse.ok) {
      throw new Error(`HTTP ${collectedResponse.status}`);
    }

    const collectedData = await collectedResponse.json();
    const allCollected = collectedData.wastes || [];
    
    // Filter those collected by this user
    const totalCollected = allCollected.filter(
      (w: any) => w.collectorId === userId
    ).length;

    // Calculate points (20 per collection)
    const points = totalCollected * 20;

    const stats: UserStats = {
      totalReported,
      totalCollected,
      pendingReports,
      points,
    };

    console.log("✅ User stats:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    // Return default stats on error
    return {
      totalReported: 0,
      totalCollected: 0,
      pendingReports: 0,
      points: 0,
    };
  }
}
