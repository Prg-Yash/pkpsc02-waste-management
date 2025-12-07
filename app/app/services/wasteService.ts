const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface HeatmapReport {
  id: string;
  latitude: number;
  longitude: number;
  wasteType: string;
  status: "PENDING" | "VERIFIED" | "IN_PROGRESS" | "COLLECTED";
  location: string;
  amount: string;
  createdAt: string;
}

/**
 * Fetch all waste reports for heatmap visualization
 */
export async function fetchAllReportsForHeatmap(userId?: string): Promise<HeatmapReport[]> {
  try {
    console.log("📡 Fetching all reports for heatmap...");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    };

    if (userId) {
      headers["x-user-id"] = userId;
    }

    const response = await fetch(`${API_URL}/api/waste/report`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const wastesArray = data.wastes || [];
    
    console.log("✅ Fetched reports for heatmap:", wastesArray.length);

    // Filter wastes with valid coordinates and transform to HeatmapReport format
    const validReports = wastesArray
      .filter((report: any) => {
        const lat = parseFloat(report.latitude);
        const lng = parseFloat(report.longitude);
        return (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      })
      .map((report: any) => ({
        id: report.id,
        latitude: parseFloat(report.latitude),
        longitude: parseFloat(report.longitude),
        wasteType: report.aiAnalysis?.wasteType || report.wasteType || "Mixed",
        status: report.status || "PENDING",
        location: report.city || report.locationRaw || "Unknown location",
        amount: report.aiAnalysis?.category || report.aiAnalysis?.estimatedWeightKg?.toString() || "Unknown",
        createdAt: report.reportedAt || new Date().toISOString(),
      }));

    return validReports;
  } catch (error) {
    console.error("❌ Error fetching heatmap reports:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}
