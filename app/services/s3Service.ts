// S3 Upload Service
import type { WasteAnalysis } from "./geminiService";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface WasteSubmissionData {
  imageUri: string;
  userId: string;
  analysis: WasteAnalysis;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface WasteSubmissionResult {
  reportId: string;
  imageUrl: string;
  status: string;
}

export async function submitWasteReport(
  data: WasteSubmissionData
): Promise<WasteSubmissionResult> {
  try {
    const { imageUri, userId, analysis, location } = data;
    
    console.log("🔵 Starting waste submission...");
    console.log("API_URL:", API_URL);
    console.log("User ID:", userId);
    console.log("Analysis:", JSON.stringify(analysis, null, 2));
    
    if (!API_URL) {
      throw new Error("API_URL is not configured. Check your .env file.");
    }
    
    // Create form data
    const formData = new FormData();
    
    // Get image file info
    const filename = imageUri.split("/").pop() || "waste-image.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // Append image file
    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    // Append userId
    formData.append("userId", userId);
    
    // Append location data - use full address if available, otherwise fallback to coordinates
    const locationString = location.address || "Location pending";
    formData.append("location", locationString);
    
    if (location.latitude && location.longitude) {
      formData.append("isLocationLatLng", location.address ? "false" : "true");
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());
    }
    
    // Append city, state, country if available
    if (location.city) {
      formData.append("city", location.city);
    }
    if (location.state) {
      formData.append("state", location.state);
    }
    if (location.country) {
      formData.append("country", location.country);
    }
    
    // Append AI analysis as JSON (contains wasteType, estimatedWeightKg, notes, and all other fields)
    formData.append("aiAnalysis", JSON.stringify(analysis));

    console.log("📤 Sending request to:", `${API_URL}/api/waste/report`);
    
    // Upload to backend
    const response = await fetch(`${API_URL}/api/waste/report`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
      body: formData,
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Server error:", errorData);
      throw new Error(errorData.error || "Submission failed");
    }

    const responseData = await response.json();
    console.log("✅ Success:", responseData);
    
    return {
      reportId: responseData.waste.id,
      imageUrl: responseData.waste.imageUrl,
      status: responseData.waste.status,
    };
  } catch (error: any) {
    console.error("❌ Waste submission error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
}
