import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from "expo-file-system/legacy";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Similarity analysis for small waste items
export interface SmallWasteSimilarity {
  sameWaste: boolean;
  matchConfidence: number; // 0-100
  segregationMatch: boolean;
  notes: string;
}

// Similarity analysis for large waste (overflow bins)
export interface LargeWasteSimilarity {
  sameWaste: boolean;
  matchConfidence: number; // 0-100
  binShapeMatch: boolean;
  overflowMatch: boolean;
  notes: string;
}

export type SimilarityResult = SmallWasteSimilarity | LargeWasteSimilarity;

/**
 * Downloads an image from URL or reads from local file system
 * @param uri - Image URI (can be URL or local file path)
 * @returns Base64 string of the image
 */
async function getImageAsBase64(uri: string): Promise<string> {
  try {
    // Check if it's a URL (http/https)
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      console.log("📥 Downloading image from URL:", uri);
      
      // Download the image to cache directory
      const filename = uri.split("/").pop() || `temp-${Date.now()}.jpg`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);
      console.log("✅ Downloaded to:", downloadResult.uri);
      
      // Read the downloaded file as base64
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: "base64",
      });
      
      return base64;
    } else {
      // Local file - read directly
      console.log("📂 Reading local file:", uri);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      return base64;
    }
  } catch (error) {
    console.error("❌ Error reading image:", error);
    throw new Error(
      `Failed to read image from ${uri}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Analyzes if two waste images show the same waste instance
 * @param originalImageUri - URI of the originally reported waste image (can be S3 URL or local)
 * @param collectorImageUri - URI of the collector's verification image (local file)
 * @param wasteCategory - "small" or "large" from original report
 * @returns Similarity analysis with validation data
 */
export async function compareWasteImages(
  originalImageUri: string,
  collectorImageUri: string,
  wasteCategory: "small" | "large"
): Promise<SimilarityResult> {
  try {
    console.log("🔍 Starting Gemini similarity analysis...");
    console.log("Category:", wasteCategory);
    console.log("Original URI:", originalImageUri);
    console.log("Collector URI:", collectorImageUri);

    // Convert images to base64 (handles both URLs and local files)
    const originalBase64 = await getImageAsBase64(originalImageUri);
    const collectorBase64 = await getImageAsBase64(collectorImageUri);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt: string;
    let schema: any;

    if (wasteCategory === "small") {
      prompt = `You are an expert waste verification AI. Compare these two images to determine if they show THE SAME waste instance.

IMAGE 1 (Original Report): The first image shows the waste that was originally reported.
IMAGE 2 (Collector Verification): The second image was taken by a collector claiming to collect this waste.

IMPORTANT RULES:
1. Return "sameWaste: true" ONLY if you're highly confident these images show the EXACT SAME waste item(s) in the SAME location
2. Consider: lighting differences, angles, time passed, slight movement is acceptable
3. Red flags for "sameWaste: false": different items, different location background, completely different waste types, different quantities
4. Match confidence should be 0-100 (percentage certainty)
5. Check if segregation status matches between images (properly sorted vs mixed)

Return ONLY a valid JSON object with this exact structure:
{
  "sameWaste": boolean,
  "matchConfidence": number (0-100),
  "segregationMatch": boolean,
  "notes": "Brief explanation of your decision"
}`;

      schema = {
        type: "object",
        properties: {
          sameWaste: { type: "boolean" },
          matchConfidence: { type: "number" },
          segregationMatch: { type: "boolean" },
          notes: { type: "string" },
        },
        required: ["sameWaste", "matchConfidence", "segregationMatch", "notes"],
      };
    } else {
      // large waste
      prompt = `You are an expert waste verification AI. Compare these two images to determine if they show THE SAME overflowing waste bin.

IMAGE 1 (Original Report): The first image shows the overflowing bin that was originally reported.
IMAGE 2 (Collector Verification): The second image was taken by a collector claiming to service this bin.

IMPORTANT RULES:
1. Return "sameWaste: true" ONLY if you're highly confident these images show the EXACT SAME bin at the SAME location
2. Consider: lighting differences, angles, waste level may have changed slightly, but the bin structure and location should match
3. Red flags for "sameWaste: false": different bin type/color, different location, completely different surrounding environment
4. Match confidence should be 0-100 (percentage certainty)
5. Check if bin shape/type matches between images
6. Check if overflow characteristics are similar (accounting for possible changes over time)

Return ONLY a valid JSON object with this exact structure:
{
  "sameWaste": boolean,
  "matchConfidence": number (0-100),
  "binShapeMatch": boolean,
  "overflowMatch": boolean,
  "notes": "Brief explanation of your decision"
}`;

      schema = {
        type: "object",
        properties: {
          sameWaste: { type: "boolean" },
          matchConfidence: { type: "number" },
          binShapeMatch: { type: "boolean" },
          overflowMatch: { type: "boolean" },
          notes: { type: "string" },
        },
        required: [
          "sameWaste",
          "matchConfidence",
          "binShapeMatch",
          "overflowMatch",
          "notes",
        ],
      };
    }

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: originalBase64,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: collectorBase64,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("📊 Raw Gemini similarity response:", text);

    // Clean and parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log("✅ Parsed similarity analysis:", analysis);

    // Validate the response structure
    if (wasteCategory === "small") {
      if (
        typeof analysis.sameWaste !== "boolean" ||
        typeof analysis.matchConfidence !== "number" ||
        typeof analysis.segregationMatch !== "boolean" ||
        typeof analysis.notes !== "string"
      ) {
        throw new Error("Invalid similarity analysis structure for small waste");
      }
    } else {
      if (
        typeof analysis.sameWaste !== "boolean" ||
        typeof analysis.matchConfidence !== "number" ||
        typeof analysis.binShapeMatch !== "boolean" ||
        typeof analysis.overflowMatch !== "boolean" ||
        typeof analysis.notes !== "string"
      ) {
        throw new Error("Invalid similarity analysis structure for large waste");
      }
    }

    return analysis;
  } catch (error) {
    console.error("❌ Error in Gemini similarity analysis:", error);
    throw new Error(
      `Failed to analyze waste similarity: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validates if the similarity check passed based on business rules
 * @param result - Similarity analysis result
 * @returns Object with isValid boolean and reason string
 */
export function validateSimilarity(result: SimilarityResult): {
  isValid: boolean;
  reason: string;
} {
  // Rule 1: sameWaste must be true
  if (!result.sameWaste) {
    return {
      isValid: false,
      reason: "AI determined these are not the same waste items",
    };
  }

  // Rule 2: Confidence must be at least 60%
  if (result.matchConfidence < 60) {
    return {
      isValid: false,
      reason: `Match confidence too low: ${result.matchConfidence}%`,
    };
  }

  // All checks passed
  return {
    isValid: true,
    reason: `Verified with ${result.matchConfidence}% confidence`,
  };
}
