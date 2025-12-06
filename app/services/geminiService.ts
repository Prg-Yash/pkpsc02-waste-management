// Gemini Vision AI Service
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY is not set in .env");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export type WasteCategory = "small" | "large";

export interface SmallWasteAnalysis {
  category: "small";
  wasteType: "plastic" | "organic" | "metal" | "e-waste" | "hazardous" | "mixed";
  confidence: number;
  estimatedWeightKg: number;
  segregation: Array<{ label: string; count: number }>;
  recyclabilityPercent: number;
  contaminationLevel: "low" | "medium" | "high";
  hazardous: boolean;
  notes: string;
}

export interface LargeWasteAnalysis {
  category: "large";
  wasteType: "plastic" | "organic" | "metal" | "e-waste" | "hazardous" | "mixed";
  confidence: number;
  estimatedWeightKg: number;
  overflowLevel: "low" | "medium" | "high";
  urgencyLevel: "normal" | "urgent" | "critical";
  hazardLevel: "low" | "medium" | "high";
  illegalDumping: boolean;
  notes: string;
}

export type WasteAnalysis = SmallWasteAnalysis | LargeWasteAnalysis;

const ANALYSIS_PROMPT = `You are a waste analysis AI. Analyze the image and determine if it shows SMALL/MEDIUM waste or LARGE/BULK waste.

CATEGORY DEFINITIONS:
- SMALL: Individual items, small piles (bottles, cans, bags, food waste, electronics, etc.)
- LARGE: Public dustbins, large garbage piles, bulk waste, overflowing bins, illegal dumping sites

RESPONSE RULES:
1. Output ONLY valid JSON, no other text
2. Determine category first
3. If SMALL: include segregation array and recyclabilityPercent
4. If LARGE: DO NOT include segregation or recyclabilityPercent
5. Be accurate with estimatedWeightKg

JSON FORMAT:

For SMALL waste:
{
  "category": "small",
  "wasteType": "plastic | organic | metal | e-waste | hazardous | mixed",
  "confidence": 0-100,
  "estimatedWeightKg": number,
  "segregation": [
    { "label": "item name", "count": number }
  ],
  "recyclabilityPercent": 0-100,
  "contaminationLevel": "low | medium | high",
  "hazardous": true | false,
  "notes": "brief observation"
}

For LARGE waste:
{
  "category": "large",
  "wasteType": "plastic | organic | metal | e-waste | hazardous | mixed",
  "confidence": 0-100,
  "estimatedWeightKg": number,
  "overflowLevel": "low | medium | high",
  "urgencyLevel": "normal | urgent | critical",
  "hazardLevel": "low | medium | high",
  "illegalDumping": true | false,
  "notes": "brief observation"
}

IMPORTANT: For LARGE waste, analyze the predominant waste type visible in the image (plastic bags, organic matter, mixed materials, etc.) and set wasteType accordingly. Use "mixed" if multiple types are equally present.`;

export async function analyzeWasteImage(
  imageUri: string
): Promise<WasteAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(",")[1]);
      };
      reader.readAsDataURL(blob);
    });

    // Call Gemini with image and prompt
    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);

    const text = result.response.text();
    
    // Extract JSON from response (sometimes wrapped in markdown)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const analysis: WasteAnalysis = JSON.parse(jsonText);

    // Validate the response structure
    if (!analysis.category || !["small", "large"].includes(analysis.category)) {
      throw new Error("Invalid category in AI response");
    }

    return analysis;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error(
      "Failed to analyze waste image. Please try again or enter details manually."
    );
  }
}

// Fallback/mock analysis for testing without API key
export function getMockAnalysis(category: WasteCategory): WasteAnalysis {
  if (category === "small") {
    return {
      category: "small",
      wasteType: "plastic",
      confidence: 85,
      estimatedWeightKg: 2.5,
      segregation: [
        { label: "Plastic bottles", count: 3 },
        { label: "Food wrappers", count: 5 },
      ],
      recyclabilityPercent: 70,
      contaminationLevel: "low",
      hazardous: false,
      notes: "Mixed plastic waste with some food residue",
    };
  } else {
    return {
      category: "large",
      wasteType: "mixed",
      confidence: 90,
      estimatedWeightKg: 150,
      overflowLevel: "high",
      urgencyLevel: "urgent",
      hazardLevel: "medium",
      illegalDumping: false,
      notes: "Overflowing public dustbin requiring immediate attention",
    };
  }
}
