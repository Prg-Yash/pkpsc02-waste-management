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
    
    // Append location data
    const locationString = location.address || 
      (location.latitude && location.longitude 
        ? `${location.latitude},${location.longitude}` 
        : "Location pending");
    formData.append("location", locationString);
    
    if (location.latitude && location.longitude) {
      formData.append("isLocationLatLng", "true");
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());
    }
    
    // Append AI analysis as JSON (contains wasteType, estimatedWeightKg, notes, and all other fields)
    formData.append("aiAnalysis", JSON.stringify(analysis));

    // Upload to backend
    const response = await fetch(`${API_URL}/api/waste/report`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Submission failed");
    }

    const responseData = await response.json();
    
    return {
      reportId: responseData.waste.id,
      imageUrl: responseData.waste.imageUrl,
      status: responseData.waste.status,
    };
  } catch (error) {
    console.error("Waste submission error:", error);
    throw new Error("Failed to submit waste report. Please try again.");
  }
}
