import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to validate and clean base64 image
function cleanBase64Image(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image data: must be a non-empty string');
  }

  // Remove whitespace
  const trimmed = imageData.trim();
  
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
    throw new Error('Invalid image data: empty or undefined');
  }

  // Extract base64 data and mime type
  let base64Data = trimmed;
  let mimeType = 'image/jpeg'; // default

  // Check if it's a data URL (data:image/png;base64,...)
  if (trimmed.startsWith('data:')) {
    const matches = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }
    mimeType = matches[1];
    base64Data = matches[2];
  } else if (trimmed.includes(',')) {
    // Handle cases like "image/jpeg,base64data"
    const parts = trimmed.split(',');
    if (parts.length === 2) {
      base64Data = parts[1];
    }
  }

  // Validate base64 format
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
    throw new Error('Invalid base64 format');
  }

  // Ensure minimum length (actual images should be much larger)
  if (base64Data.length < 100) {
    throw new Error('Base64 data too short - likely corrupted');
  }

  return { data: base64Data, mimeType };
}

export async function POST(request) {
  try {
    const { collectedImage, reportedImage, location, reportedLocation, wasteType, amount } = await request.json();

    if (!collectedImage) {
      return NextResponse.json(
        { error: 'Collected image is required' },
        { status: 400 }
      );
    }

    // Validate and clean collected image
    let collectedImageData;
    try {
      const cleaned = cleanBase64Image(collectedImage);
      collectedImageData = {
        inlineData: {
          data: cleaned.data,
          mimeType: cleaned.mimeType
        }
      };
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid collected image format',
          details: error.message 
        },
        { status: 400 }
      );
    }

    // Initialize Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = `You are an expert waste management AI system. Analyze the uploaded image and provide a detailed verification report.

Task Details:
- Waste Type: ${wasteType}
- Reported Amount: ${amount}
- Reported Location: ${reportedLocation}
- Current Location: ${location ? `Latitude: ${location.latitude}, Longitude: ${location.longitude}` : 'Not provided'}

Please analyze the image and provide:
1. Does the image contain waste materials? (Yes/No)
2. Does the waste type match "${wasteType}"? (Yes/No with confidence percentage)
3. Estimated amount of waste in the image (in kg)
4. Does the estimated amount match the reported amount "${amount}"? (Yes/No with confidence percentage)
5. Overall confidence score (0-100%)
6. Any concerns or discrepancies

`;

    // If reported image is provided, add comparison
    if (reportedImage) {
      let reportedImageData;
      try {
        const cleaned = cleanBase64Image(reportedImage);
        reportedImageData = {
          inlineData: {
            data: cleaned.data,
            mimeType: cleaned.mimeType
          }
        };
      } catch (error) {
        console.warn('Invalid reported image, skipping comparison:', error.message);
        // Continue without reported image comparison
        const result = await model.generateContent([prompt, collectedImageData]);
        const response = await result.response;
        const analysisText = response.text();

        return NextResponse.json({
          success: true,
          analysis: analysisText,
          parsedResult: parseGeminiResponse(analysisText, location, reportedLocation)
        });
      }

      prompt += `\nAdditionally, compare the uploaded image with the reported image and provide:
7. Image similarity score (0-100%)
8. Are these images of the same waste collection point? (Yes/No with confidence)
9. Notable differences between the images`;

      // Generate response with both images
      const result = await model.generateContent([
        prompt,
        reportedImageData,
        collectedImageData
      ]);

      const response = await result.response;
      const analysisText = response.text();

      return NextResponse.json({
        success: true,
        analysis: analysisText,
        parsedResult: parseGeminiResponse(analysisText, location, reportedLocation)
      });
    } else {
      // Generate response with only collected image
      const result = await model.generateContent([prompt, collectedImageData]);

      const response = await result.response;
      const analysisText = response.text();

      return NextResponse.json({
        success: true,
        analysis: analysisText,
        parsedResult: parseGeminiResponse(analysisText, location, reportedLocation)
      });
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to verify waste collection';
    let errorDetails = error.message;
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorMessage = 'AI model not available';
      errorDetails = 'The verification AI model is currently unavailable. Please try again later.';
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      errorMessage = 'AI service quota exceeded';
      errorDetails = 'Too many verification requests. Please try again in a few moments.';
    } else if (error.message?.includes('image')) {
      errorMessage = 'Image processing failed';
      errorDetails = 'Unable to process the uploaded image. Please ensure it\'s a valid image file.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        success: false
      },
      { status: 500 }
    );
  }
}

// Parse Gemini response to extract structured data
function parseGeminiResponse(text, currentLocation, reportedLocation) {
  const result = {
    containsWaste: false,
    wasteTypeMatch: false,
    quantityMatch: false,
    confidence: 0,
    locationMatch: false,
    locationDistance: null,
    imageSimilarity: 0,
    concerns: [],
    estimatedAmount: null
  };

  try {
    // Extract Yes/No answers and percentages using regex
    const lowerText = text.toLowerCase();

    // Check if contains waste
    if (lowerText.includes('contains waste') || lowerText.includes('waste materials')) {
      result.containsWaste = lowerText.includes('yes') || lowerText.includes('contain');
    }

    // Extract waste type match
    const wasteTypeMatch = text.match(/waste type match[:\s]+(\w+)/i);
    if (wasteTypeMatch) {
      result.wasteTypeMatch = wasteTypeMatch[1].toLowerCase().includes('yes');
    }

    // Extract quantity match
    const quantityMatch = text.match(/amount match[:\s]+(\w+)/i);
    if (quantityMatch) {
      result.quantityMatch = quantityMatch[1].toLowerCase().includes('yes');
    }

    // Extract confidence score
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)/i) || text.match(/(\d+)%/);
    if (confidenceMatch) {
      result.confidence = parseInt(confidenceMatch[1]) / 100;
    }

    // Extract image similarity if available
    const similarityMatch = text.match(/similarity[:\s]+(\d+)/i);
    if (similarityMatch) {
      result.imageSimilarity = parseInt(similarityMatch[1]) / 100;
    }

    // Extract concerns
    const concernsMatch = text.match(/concerns?[:\s]+(.+?)(?:\n\n|\n[0-9]|$)/is);
    if (concernsMatch) {
      result.concerns = [concernsMatch[1].trim()];
    }

    // Calculate location match if both locations provided
    if (currentLocation && reportedLocation) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        reportedLocation.latitude,
        reportedLocation.longitude
      );
      result.locationDistance = distance;
      result.locationMatch = distance < 0.1; // Within 100 meters
    }

    // Overall match calculation
    result.overallMatch = 
      result.containsWaste &&
      result.wasteTypeMatch &&
      result.quantityMatch &&
      result.confidence > 0.7 &&
      (result.locationDistance === null || result.locationMatch);

  } catch (error) {
    console.error('Error parsing Gemini response:', error);
  }

  return result;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
