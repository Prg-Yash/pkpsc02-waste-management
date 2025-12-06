import * as FileSystem from "expo-file-system/legacy";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface PendingWasteReport {
  id: string;
  imageUrl: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  locationRaw: string;
  aiAnalysis: {
    wasteType: string;
    category: "small" | "large";
    confidence: number;
    estimatedWeightKg?: number;
    // Small waste specific
    segregation?: string;
    recyclability?: string;
    // Large waste specific
    isOverflowing?: boolean;
    urgency?: string;
    hazardPresent?: boolean;
  };
  reportedAt: string;
  reporterId: string;
}

export interface CollectionData {
  reportId: string;
  collectorId: string;
  collectorImageUri: string;
  collectorLatitude: number;
  collectorLongitude: number;
  verificationData: {
    sameWaste: boolean;
    matchConfidence: number;
    notes: string;
    // Category-specific fields
    [key: string]: any;
  };
}

/**
 * Fetches all pending waste reports from the backend
 * @param userId - Current user ID to filter out their own reports
 * @returns Array of pending waste reports
 */
export async function fetchPendingReports(
  userId: string
): Promise<PendingWasteReport[]> {
  try {
    console.log("📡 Fetching pending waste reports...");
    console.log("API URL:", API_URL);
    console.log("User ID:", userId);

    const response = await fetch(
      `${API_URL}/api/waste/pending?excludeUserId=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Fetched pending reports:", data.length);
    return data;
  } catch (error) {
    console.error("❌ Error fetching pending reports:", error);
    throw new Error(
      `Failed to fetch pending reports: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Submits collection verification to backend
 * @param data - Collection data including verification results
 * @returns Updated waste report
 */
export async function submitCollectionVerification(
  data: CollectionData
): Promise<any> {
  try {
    console.log("📡 Submitting collection verification...");
    console.log("Report ID:", data.reportId);

    // Read collector image as base64
    const imageBase64 = await FileSystem.readAsStringAsync(
      data.collectorImageUri,
      {
        encoding: "base64",
      }
    );

    const formData = new FormData();
    formData.append("collectorId", data.collectorId);
    formData.append("collectorLatitude", data.collectorLatitude.toString());
    formData.append("collectorLongitude", data.collectorLongitude.toString());
    formData.append("verificationData", JSON.stringify(data.verificationData));

    // Add image file
    const imageUri = data.collectorImageUri;
    const imageType = imageUri.endsWith(".png") ? "image/png" : "image/jpeg";
    formData.append("collectorImage", {
      uri: imageUri,
      type: imageType,
      name: `collector-${Date.now()}.jpg`,
    } as any);

    const response = await fetch(
      `${API_URL}/api/waste/${data.reportId}/collect`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Collection verification submitted successfully");
    return result;
  } catch (error) {
    console.error("❌ Error submitting collection verification:", error);
    throw new Error(
      `Failed to submit collection verification: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Updates waste report status (e.g., to IN_PROGRESS)
 * @param reportId - Waste report ID
 * @param status - New status
 */
export async function updateReportStatus(
  reportId: string,
  status: "PENDING" | "IN_PROGRESS" | "COLLECTED"
): Promise<void> {
  try {
    console.log(`📡 Updating report ${reportId} status to ${status}...`);

    const response = await fetch(`${API_URL}/api/waste/${reportId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("✅ Status updated successfully");
  } catch (error) {
    console.error("❌ Error updating report status:", error);
    throw new Error(
      `Failed to update report status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
