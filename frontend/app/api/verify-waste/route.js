import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Downloads an image from URL and converts to base64
 */
async function urlToBase64(url) {
  try {
    console.log('📥 Downloading image from URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Detect mime type from response or default to jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('✅ Image downloaded and converted to base64');
    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.error('❌ Error downloading image:', error);
    throw new Error(`Failed to download image from URL: ${error.message}`);
  }
}

/**
 * Helper function to validate and clean base64 image or download from URL
 */
async function prepareImage(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image data: must be a non-empty string');
  }

  const trimmed = imageData.trim();
  
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
    throw new Error('Invalid image data: empty or undefined');
  }

  // Check if it's a URL (http/https)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return await urlToBase64(trimmed);
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

/**
 * Determines waste category from AI analysis data
 */
function determineWasteCategory(aiAnalysis) {
  if (!aiAnalysis || !aiAnalysis.category) {
    return 'small'; // Default to small if no category
  }
  
  // Large waste: bins, bulk items, overflow situations
  const largeKeywords = ['large', 'bin', 'overflow', 'bulk', 'container'];
  const category = aiAnalysis.category.toLowerCase();
  
  return largeKeywords.some(keyword => category.includes(keyword)) ? 'large' : 'small';
}

/**
 * Compares two waste images to verify they show the same waste instance
 */
async function compareWasteImages(originalImageData, collectorImageData, wasteCategory) {
  console.log('🔍 Starting Gemini similarity analysis...');
  console.log('Category:', wasteCategory);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let prompt;

  if (wasteCategory === 'small') {
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
  }

  const result = await model.generateContent([
    originalImageData,
    collectorImageData,
    { text: prompt }
  ]);

  const response = await result.response;
  const text = response.text();

  console.log('📊 Raw Gemini similarity response:', text);

  // Clean and parse JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  const analysis = JSON.parse(jsonMatch[0]);
  console.log('✅ Parsed similarity analysis:', analysis);

  // Validate the response structure
  if (wasteCategory === 'small') {
    if (
      typeof analysis.sameWaste !== 'boolean' ||
      typeof analysis.matchConfidence !== 'number' ||
      typeof analysis.segregationMatch !== 'boolean' ||
      typeof analysis.notes !== 'string'
    ) {
      throw new Error('Invalid similarity analysis structure for small waste');
    }
  } else {
    if (
      typeof analysis.sameWaste !== 'boolean' ||
      typeof analysis.matchConfidence !== 'number' ||
      typeof analysis.binShapeMatch !== 'boolean' ||
      typeof analysis.overflowMatch !== 'boolean' ||
      typeof analysis.notes !== 'string'
    ) {
      throw new Error('Invalid similarity analysis structure for large waste');
    }
  }

  return analysis;
}

/**
 * Validates if the similarity check passed based on business rules
 */
function validateSimilarity(result) {
  // Rule 1: sameWaste must be true
  if (!result.sameWaste) {
    return {
      isValid: false,
      reason: 'AI determined these are not the same waste items'
    };
  }

  // Rule 2: Confidence must be at least 60%
  if (result.matchConfidence < 60) {
    return {
      isValid: false,
      reason: `Match confidence too low: ${result.matchConfidence}%`
    };
  }

  // All checks passed
  return {
    isValid: true,
    reason: `Verified with ${result.matchConfidence}% confidence`
  };
}

export async function POST(request) {
  try {
    const { collectedImage, reportedImage, location, reportedLocation, wasteType, amount, aiAnalysis } = await request.json();

    // Validate required fields
    if (!collectedImage) {
      return NextResponse.json(
        { error: 'Collected image is required' },
        { status: 400 }
      );
    }

    if (!reportedImage) {
      return NextResponse.json(
        { error: 'Reported image is required for comparison' },
        { status: 400 }
      );
    }

    // Validate and prepare both images (handles URLs and base64)
    let collectedImageData, reportedImageData;
    
    try {
      const preparedCollector = await prepareImage(collectedImage);
      collectedImageData = {
        inlineData: {
          data: preparedCollector.data,
          mimeType: preparedCollector.mimeType
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

    try {
      const preparedReported = await prepareImage(reportedImage);
      reportedImageData = {
        inlineData: {
          data: preparedReported.data,
          mimeType: preparedReported.mimeType
        }
      };
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid reported image format',
          details: error.message 
        },
        { status: 400 }
      );
    }

    // Determine waste category from AI analysis
    const wasteCategory = determineWasteCategory(aiAnalysis);
    console.log('📦 Detected waste category:', wasteCategory);

    // Compare images using Gemini similarity analysis
    const similarityResult = await compareWasteImages(
      reportedImageData,
      collectedImageData,
      wasteCategory
    );

    // Calculate location match if coordinates provided
    let locationDistance = null;
    let locationMatch = true;
    let locationValidation = { isValid: true, reason: 'Location not verified (coordinates missing)' };

    if (location && reportedLocation && location.latitude && reportedLocation.latitude) {
      locationDistance = calculateDistance(
        location.latitude,
        location.longitude,
        reportedLocation.latitude,
        reportedLocation.longitude
      );
      
      // Location must be within 10000 meters (10 km)
      locationMatch = locationDistance < 10;
      
      if (locationMatch) {
        locationValidation = {
          isValid: true,
          reason: `Location verified: ${(locationDistance * 1000).toFixed(0)}m away from reported location`
        };
      } else {
        locationValidation = {
          isValid: false,
          reason: `Location too far: ${(locationDistance * 1000).toFixed(0)}m away (maximum 10000m allowed)`
        };
      }
      
      console.log('📍 Location check:', locationValidation);
    } else {
      console.warn('⚠️ Location verification skipped - coordinates missing');
    }

    // Validate similarity based on business rules
    const imageValidation = validateSimilarity(similarityResult);

    // Overall validation: both image AND location must pass
    const overallValidation = {
      isValid: imageValidation.isValid && locationValidation.isValid,
      imageCheck: imageValidation,
      locationCheck: locationValidation,
      reason: !imageValidation.isValid 
        ? imageValidation.reason 
        : !locationValidation.isValid 
        ? locationValidation.reason 
        : 'All checks passed - collection verified'
    };

    // Build comprehensive result
    const result = {
      success: overallValidation.isValid,
      sameWaste: similarityResult.sameWaste,
      matchConfidence: similarityResult.matchConfidence,
      validation: overallValidation,
      locationDistance: locationDistance,
      locationMatch: locationMatch,
      wasteCategory: wasteCategory,
      
      // Category-specific fields
      ...(wasteCategory === 'small' ? {
        segregationMatch: similarityResult.segregationMatch
      } : {
        binShapeMatch: similarityResult.binShapeMatch,
        overflowMatch: similarityResult.overflowMatch
      }),
      
      notes: similarityResult.notes,
      
      // Legacy compatibility fields
      containsWaste: similarityResult.sameWaste,
      wasteTypeMatch: similarityResult.sameWaste,
      quantityMatch: similarityResult.matchConfidence > 60,
      confidence: similarityResult.matchConfidence / 100,
      overallMatch: overallValidation.isValid
    };

    return NextResponse.json(result);
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
    } else if (error.message?.includes('similarity') || error.message?.includes('JSON')) {
      errorMessage = 'AI analysis failed';
      errorDetails = 'Unable to compare images. Please try again.';
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
