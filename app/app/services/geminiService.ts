import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Convert image URI to base64 format for Gemini
 */
async function imageToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process image");
  }
}

/**
 * Verify "before" image - checks similarity between original report image and collector's before image
 * This ensures the collector is at the correct location before starting collection
 */
export async function verifyBeforeImage(
  originalImageUrl: string,
  beforeImageUri: string
): Promise<{
  isValid: boolean;
  confidence: number;
  message: string;
  details?: {
    locationMatch: boolean;
    wasteMatch: boolean;
    landmarksMatch: boolean;
  };
}> {
  try {
    console.log("🔍 Verifying before image with Gemini...");

    // Convert images to base64
    const originalBase64 = await imageToBase64(originalImageUrl);
    const beforeBase64 = await imageToBase64(beforeImageUri);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert waste management verification system. Compare these two images:

IMAGE 1 (ORIGINAL REPORT): The first image shows the waste that was originally reported.
IMAGE 2 (COLLECTOR'S BEFORE IMAGE): The second image is taken by the collector before starting collection.

Your task is to verify if these images show THE SAME LOCATION and THE SAME WASTE.

Analyze and check:
✔ Is this the SAME LOCATION? (Check landmarks, buildings, surroundings, ground texture)
✔ Is this the SAME WASTE? (Check waste type, size, color, shape, position)
✔ Are the LANDMARKS/SURROUNDINGS the same? (Trees, walls, roads, buildings)
✔ Is the waste in the SAME POSITION relative to surroundings?
✔ Could these images be taken at the same place at different times?

IMPORTANT RULES:
- Minor differences in lighting, angle, or time of day are acceptable
- The waste should be clearly visible in BOTH images
- Background landmarks should be recognizable in both images
- If waste has been slightly moved (wind, animals) but location matches, it's still valid
- If these are completely different locations or different waste, mark as INVALID

Respond ONLY with this exact JSON format (no markdown, no additional text):
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "message": "Brief explanation of your decision",
  "locationMatch": true/false,
  "wasteMatch": true/false,
  "landmarksMatch": true/false
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: originalBase64,
          mimeType: "image/jpeg",
        },
      },
      {
        inlineData: {
          data: beforeBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    console.log("Gemini response:", responseText);

    // Parse JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const verification = JSON.parse(cleanedResponse);

    // Ensure all required fields exist
    const isValid = verification.isValid === true;
    const confidence = Math.max(0, Math.min(1, verification.confidence || 0));

    return {
      isValid,
      confidence,
      message: verification.message || "Verification completed",
      details: {
        locationMatch: verification.locationMatch || false,
        wasteMatch: verification.wasteMatch || false,
        landmarksMatch: verification.landmarksMatch || false,
      },
    };
  } catch (error) {
    console.error("Error in verifyBeforeImage:", error);
    throw new Error(
      "Failed to verify before image. Please check your internet connection and try again."
    );
  }
}

/**
 * Verify "after" image - checks if waste has been removed and location is clean
 * Compares before and after images to ensure authentic waste collection
 */
export async function verifyAfterImage(
  beforeImageUri: string,
  afterImageUri: string
): Promise<{
  isValid: boolean;
  confidence: number;
  message: string;
  details?: {
    wasteRemoved: boolean;
    groundClean: boolean;
    landmarksSame: boolean;
    sameLocation: boolean;
    imageFresh: boolean;
    lightingConsistent: boolean;
  };
}> {
  try {
    console.log("🧹 Verifying after image with Gemini...");

    // Convert images to base64
    const beforeBase64 = await imageToBase64(beforeImageUri);
    const afterBase64 = await imageToBase64(afterImageUri);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert waste management verification system. Compare these two images:

IMAGE 1 (BEFORE COLLECTION): Shows the waste BEFORE collection started.
IMAGE 2 (AFTER COLLECTION): Shows the area AFTER collection is claimed to be complete.

Your task is to verify if the waste was GENUINELY COLLECTED and the area is now CLEAN.

Analyze and verify:
✔ Is the WASTE REMOVED? (The waste visible in Image 1 should be gone in Image 2)
✔ Is the GROUND CLEAN? (No debris, waste residue, or scattered items remaining)
✔ Are the LANDMARKS the SAME? (Buildings, trees, walls, roads should be identical)
✔ Is this the SAME LOCATION? (Background, surroundings, ground texture should match)
✔ Is the image FRESH? (Not a reused image from elsewhere, proper shadows/lighting for current time)
✔ Is the LIGHTING CONSISTENT? (Shadows, time of day should be reasonable - allow for time passage)

IMPORTANT RULES:
- The waste must be COMPLETELY REMOVED (not just moved)
- The ground should be clean (allow minor natural dirt/stains)
- Landmarks MUST be identical (this proves same location)
- Small lighting differences are acceptable (collection takes time)
- If the waste is still there, or location is different, mark as INVALID
- If the image appears reused or fake, mark as INVALID

Respond ONLY with this exact JSON format (no markdown, no additional text):
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "message": "Brief explanation of your decision",
  "wasteRemoved": true/false,
  "groundClean": true/false,
  "landmarksSame": true/false,
  "sameLocation": true/false,
  "imageFresh": true/false,
  "lightingConsistent": true/false
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: beforeBase64,
          mimeType: "image/jpeg",
        },
      },
      {
        inlineData: {
          data: afterBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    console.log("Gemini response:", responseText);

    // Parse JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const verification = JSON.parse(cleanedResponse);

    // Ensure all required fields exist
    const isValid = verification.isValid === true;
    const confidence = Math.max(0, Math.min(1, verification.confidence || 0));

    return {
      isValid,
      confidence,
      message: verification.message || "Verification completed",
      details: {
        wasteRemoved: verification.wasteRemoved || false,
        groundClean: verification.groundClean || false,
        landmarksSame: verification.landmarksSame || false,
        sameLocation: verification.sameLocation || false,
        imageFresh: verification.imageFresh || false,
        lightingConsistent: verification.lightingConsistent || false,
      },
    };
  } catch (error) {
    console.error("Error in verifyAfterImage:", error);
    throw new Error(
      "Failed to verify after image. Please check your internet connection and try again."
    );
  }
}
