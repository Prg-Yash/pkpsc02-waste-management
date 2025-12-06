/**
 * WASTE VERIFICATION API
 * 
 * This API provides comprehensive waste collection verification using Google Gemini AI.
 * Supports multiple verification workflows to ensure authentic waste collection.
 * 
 * VERIFICATION TYPES:
 * 
 * 1. 'legacy' (default) - Single-step verification
 *    - Compares collector's image with reported image
 *    - Supports waste category detection (small/large)
 *    - Category-specific validation (segregation, bin shape, overflow)
 *    - Location distance verification
 *    Required: collectedImage, reportedImage
 * 
 * 2. 'before-after' - Two-step verification (RECOMMENDED for highest accuracy)
 *    - BEFORE: Verifies collector is at correct location with same waste
 *    - AFTER: Verifies waste was actually collected and area is clean
 *    - Prevents fake collections and ensures genuine cleanup
 *    Required: reportedImage, beforeImage, afterImage
 * 
 * 3. 'before' - Before-only verification
 *    - Only verifies the before image matches reported waste
 *    - Useful for starting collection process
 *    Required: reportedImage, beforeImage
 * 
 * 4. 'after' - After-only verification
 *    - Only verifies waste was removed from before image
 *    - Useful for completing collection process
 *    Required: beforeImage, afterImage
 * 
 * FEATURES:
 * - AI-powered image comparison using Gemini 2.0 Flash Exp
 * - Location verification (GPS distance calculation)
 * - Confidence scoring (minimum 60% required)
 * - Landmark and environment matching
 * - Waste removal verification
 * - Fake image detection
 * - Comprehensive validation rules
 * 
 * USAGE EXAMPLES:
 * 
 * // Legacy single-step (backward compatible)
 * POST /api/verify-waste
 * {
 *   "verificationType": "legacy",
 *   "collectedImage": "base64 or URL",
 *   "reportedImage": "base64 or URL",
 *   "location": { "latitude": 0, "longitude": 0 },
 *   "reportedLocation": { "latitude": 0, "longitude": 0 },
 *   "aiAnalysis": { "category": "small waste" }
 * }
 * 
 * // Two-step before-after (most secure)
 * POST /api/verify-waste
 * {
 *   "verificationType": "before-after",
 *   "reportedImage": "base64 or URL",
 *   "beforeImage": "base64 or URL",
 *   "afterImage": "base64 or URL",
 *   "location": { "latitude": 0, "longitude": 0 },
 *   "reportedLocation": { "latitude": 0, "longitude": 0 }
 * }
 */

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
 * Verify "before" image - checks similarity between original report and collector's before image
 */
async function verifyBeforeImage(originalImageData, beforeImageData) {
  console.log('🔍 Verifying BEFORE image with Gemini...');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
    originalImageData,
    beforeImageData,
  ]);

  const responseText = result.response.text();
  console.log('📊 Gemini before response:', responseText);

  const cleanedResponse = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const verification = JSON.parse(cleanedResponse);

  return {
    isValid: verification.isValid === true,
    confidence: Math.max(0, Math.min(1, verification.confidence || 0)),
    message: verification.message || 'Before verification completed',
    locationMatch: verification.locationMatch || false,
    wasteMatch: verification.wasteMatch || false,
    landmarksMatch: verification.landmarksMatch || false,
  };
}

/**
 * Verify "after" image - checks if waste has been removed and location is clean
 */
async function verifyAfterImage(beforeImageData, afterImageData) {
  console.log('🧹 Verifying AFTER image with Gemini...');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
  "landmarksMatch": true/false,
  "sameLocation": true/false,
  "imageFresh": true/false,
  "lightingConsistent": true/false
}`;

  const result = await model.generateContent([
    prompt,
    beforeImageData,
    afterImageData,
  ]);

  const responseText = result.response.text();
  console.log('📊 Gemini after response:', responseText);

  const cleanedResponse = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const verification = JSON.parse(cleanedResponse);

  return {
    isValid: verification.isValid === true,
    confidence: Math.max(0, Math.min(1, verification.confidence || 0)),
    message: verification.message || 'After verification completed',
    wasteRemoved: verification.wasteRemoved || false,
    groundClean: verification.groundClean || false,
    landmarksMatch: verification.landmarksMatch || false,
    sameLocation: verification.sameLocation || false,
    imageFresh: verification.imageFresh || false,
    lightingConsistent: verification.lightingConsistent || false,
  };
}

/**
 * Compares two waste images to verify they show the same waste instance (legacy single-step)
 */
async function compareWasteImages(originalImageData, collectorImageData, wasteCategory) {
  console.log('🔍 Starting Gemini similarity analysis...');
  console.log('Category:', wasteCategory);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

/**
 * Handle before-after verification workflow
 */
async function handleBeforeAfterVerification({ reportedImage, beforeImage, afterImage, location, reportedLocation, aiAnalysis }) {
  try {
    const results = {};

    // Step 1: Prepare images
    const preparedReported = await prepareImage(reportedImage);
    const preparedBefore = await prepareImage(beforeImage);
    const preparedAfter = await prepareImage(afterImage);

    const reportedImageData = {
      inlineData: {
        data: preparedReported.data,
        mimeType: preparedReported.mimeType
      }
    };

    const beforeImageData = {
      inlineData: {
        data: preparedBefore.data,
        mimeType: preparedBefore.mimeType
      }
    };

    const afterImageData = {
      inlineData: {
        data: preparedAfter.data,
        mimeType: preparedAfter.mimeType
      }
    };

    // Step 2: Verify before image
    const beforeVerification = await verifyBeforeImage(reportedImageData, beforeImageData);
    results.beforeVerification = beforeVerification;

    // Step 3: Verify after image
    const afterVerification = await verifyAfterImage(beforeImageData, afterImageData);
    results.afterVerification = afterVerification;

    // Step 4: Location verification
    let locationDistance = null;
    let locationMatch = true;
    let locationValidation = { isValid: true, reason: 'Location not verified' };

    if (location && reportedLocation && location.latitude && reportedLocation.latitude) {
      locationDistance = calculateDistance(
        location.latitude,
        location.longitude,
        reportedLocation.latitude,
        reportedLocation.longitude
      );
      
      locationMatch = locationDistance < 10;
      
      if (locationMatch) {
        locationValidation = {
          isValid: true,
          reason: `Location verified: ${(locationDistance * 1000).toFixed(0)}m away`
        };
      } else {
        locationValidation = {
          isValid: false,
          reason: `Location too far: ${(locationDistance * 1000).toFixed(0)}m away (max 10km)`
        };
      }
    }

    results.locationVerification = locationValidation;
    results.locationDistance = locationDistance;
    results.locationMatch = locationMatch;

    // Step 5: Overall validation
    let overallValid = true;
    const failureReasons = [];

    if (!beforeVerification.isValid) {
      overallValid = false;
      failureReasons.push('Before image does not match reported waste');
    } else if (beforeVerification.confidence < 0.6) {
      overallValid = false;
      failureReasons.push(`Before image confidence too low (${(beforeVerification.confidence * 100).toFixed(0)}%)`);
    }

    if (!afterVerification.isValid) {
      overallValid = false;
      failureReasons.push('After image verification failed - waste not properly removed');
    } else if (afterVerification.confidence < 0.6) {
      overallValid = false;
      failureReasons.push(`After image confidence too low (${(afterVerification.confidence * 100).toFixed(0)}%)`);
    }

    if (!locationValidation.isValid) {
      overallValid = false;
      failureReasons.push(locationValidation.reason);
    }

    const overallMessage = overallValid 
      ? 'Collection verified successfully' 
      : failureReasons.join('; ');

    return NextResponse.json({
      success: overallValid,
      message: overallMessage,
      verificationType: 'before-after',
      ...results,
      overallMatch: overallValid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Before-after verification error:', error);
    return NextResponse.json(
      { 
        error: 'Before-after verification failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle before-only verification
 */
async function handleBeforeOnlyVerification({ reportedImage, beforeImage, location, reportedLocation }) {
  try {
    const preparedReported = await prepareImage(reportedImage);
    const preparedBefore = await prepareImage(beforeImage);

    const reportedImageData = {
      inlineData: {
        data: preparedReported.data,
        mimeType: preparedReported.mimeType
      }
    };

    const beforeImageData = {
      inlineData: {
        data: preparedBefore.data,
        mimeType: preparedBefore.mimeType
      }
    };

    const beforeVerification = await verifyBeforeImage(reportedImageData, beforeImageData);

    // Location verification
    let locationValidation = { isValid: true, reason: 'Location not verified' };
    let locationDistance = null;

    if (location && reportedLocation && location.latitude && reportedLocation.latitude) {
      locationDistance = calculateDistance(
        location.latitude,
        location.longitude,
        reportedLocation.latitude,
        reportedLocation.longitude
      );
      
      const locationMatch = locationDistance < 10;
      
      locationValidation = {
        isValid: locationMatch,
        reason: locationMatch 
          ? `Location verified: ${(locationDistance * 1000).toFixed(0)}m away`
          : `Location too far: ${(locationDistance * 1000).toFixed(0)}m away (max 10km)`
      };
    }

    const overallValid = beforeVerification.isValid && beforeVerification.confidence >= 0.6 && locationValidation.isValid;

    return NextResponse.json({
      success: overallValid,
      verificationType: 'before',
      beforeVerification,
      locationVerification: locationValidation,
      locationDistance,
      overallMatch: overallValid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Before verification error:', error);
    return NextResponse.json(
      { 
        error: 'Before verification failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle after-only verification
 */
async function handleAfterOnlyVerification({ beforeImage, afterImage, location, reportedLocation }) {
  try {
    const preparedBefore = await prepareImage(beforeImage);
    const preparedAfter = await prepareImage(afterImage);

    const beforeImageData = {
      inlineData: {
        data: preparedBefore.data,
        mimeType: preparedBefore.mimeType
      }
    };

    const afterImageData = {
      inlineData: {
        data: preparedAfter.data,
        mimeType: preparedAfter.mimeType
      }
    };

    const afterVerification = await verifyAfterImage(beforeImageData, afterImageData);

    const overallValid = afterVerification.isValid && afterVerification.confidence >= 0.6;

    return NextResponse.json({
      success: overallValid,
      verificationType: 'after',
      afterVerification,
      overallMatch: overallValid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ After verification error:', error);
    return NextResponse.json(
      { 
        error: 'After verification failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { 
      collectedImage, 
      reportedImage, 
      beforeImage,
      afterImage,
      location, 
      reportedLocation, 
      wasteType, 
      amount, 
      aiAnalysis,
      verificationType = 'legacy' // 'legacy', 'before-after', 'before', 'after'
    } = await request.json();

    console.log('🔍 Verification type:', verificationType);

    // Validate required fields based on verification type
    if (verificationType === 'before-after') {
      // Two-step verification: before + after images
      if (!reportedImage) {
        return NextResponse.json(
          { error: 'Reported image is required for before-after verification' },
          { status: 400 }
        );
      }
      if (!beforeImage) {
        return NextResponse.json(
          { error: 'Before image is required for before-after verification' },
          { status: 400 }
        );
      }
      if (!afterImage) {
        return NextResponse.json(
          { error: 'After image is required for before-after verification' },
          { status: 400 }
        );
      }
    } else if (verificationType === 'before') {
      if (!reportedImage || !beforeImage) {
        return NextResponse.json(
          { error: 'Reported and before images are required' },
          { status: 400 }
        );
      }
    } else if (verificationType === 'after') {
      if (!beforeImage || !afterImage) {
        return NextResponse.json(
          { error: 'Before and after images are required' },
          { status: 400 }
        );
      }
    } else {
      // Legacy single-step verification
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
    }

    // Handle different verification workflows
    if (verificationType === 'before-after') {
      // Two-step verification workflow
      return await handleBeforeAfterVerification({
        reportedImage,
        beforeImage,
        afterImage,
        location,
        reportedLocation,
        aiAnalysis
      });
    } else if (verificationType === 'before') {
      // Only verify before image
      return await handleBeforeOnlyVerification({
        reportedImage,
        beforeImage,
        location,
        reportedLocation
      });
    } else if (verificationType === 'after') {
      // Only verify after image
      return await handleAfterOnlyVerification({
        beforeImage,
        afterImage,
        location,
        reportedLocation
      });
    }

    // Legacy single-step verification (existing functionality)
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
