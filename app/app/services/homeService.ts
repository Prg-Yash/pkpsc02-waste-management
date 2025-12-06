const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface HomeStats {
  totalReports: number;
  totalCollected: number;
  yourPoints: number;
  reporterPoints: number;
  collectorPoints: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  location?: string;
  amount?: string;
  time: string;
  type: "report" | "collect" | "points";
  wasteType?: string;
}

/**
 * Fetch home dashboard statistics
 */
export async function fetchHomeStats(userId: string): Promise<HomeStats> {
  try {
    console.log("📡 Fetching home stats...");

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
    const user = data.user;

    return {
      totalReports: user.reportedWastes?.length || 0,
      totalCollected: user.collectedWastes?.length || 0,
      yourPoints: user.globalPoints || 0,
      reporterPoints: user.reporterPoints || 0,
      collectorPoints: user.collectorPoints || 0,
    };
  } catch (error) {
    console.error("❌ Error fetching home stats:", error);
    throw new Error(
      `Failed to fetch home stats: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetch recent activity (reports and collections)
 */
export async function fetchRecentActivity(
  userId: string
): Promise<RecentActivity[]> {
  try {
    console.log("📡 Fetching recent activity...");

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
    const user = data.user;

    const activities: RecentActivity[] = [];

    // Add reported wastes
    if (user.reportedWastes && user.reportedWastes.length > 0) {
      user.reportedWastes.forEach((waste: any) => {
        activities.push({
          id: waste.id,
          action: "Waste Reported",
          location: waste.city || waste.locationRaw,
          time: waste.reportedAt,
          type: "report",
          wasteType: waste.aiAnalysis?.wasteType,
        });
      });
    }

    // Add collected wastes
    if (user.collectedWastes && user.collectedWastes.length > 0) {
      user.collectedWastes.forEach((waste: any) => {
        activities.push({
          id: waste.id,
          action: "Waste Collected",
          location: waste.city || waste.locationRaw,
          time: waste.collectedAt,
          type: "collect",
          wasteType: waste.aiAnalysis?.wasteType,
        });
      });
    }

    // Sort by time (most recent first) and take top 10
    activities.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return activities.slice(0, 10);
  } catch (error) {
    console.error("❌ Error fetching recent activity:", error);
    throw new Error(
      `Failed to fetch recent activity: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
