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
 * Verify "before" image - checks similarity between original report image and collector's before image
 * This ensures the collector is at the correct location before starting collection
 */
async function verifyBeforeImage(originalImageData, beforeImageData) {
  try {
    console.log('🔍 Verifying before image with Gemini...');

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
    console.log('Gemini before image response:', responseText);

    // Parse JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const verification = JSON.parse(cleanedResponse);

    // Ensure all required fields exist
    const isValid = verification.isValid === true;
    const confidence = Math.max(0, Math.min(1, verification.confidence || 0));

    return {
      isValid,
      confidence,
      message: verification.message || 'Verification completed',
      details: {
        locationMatch: verification.locationMatch || false,
        wasteMatch: verification.wasteMatch || false,
        landmarksMatch: verification.landmarksMatch || false,
      },
    };
  } catch (error) {
    console.error('Error in verifyBeforeImage:', error);
    throw new Error(
      'Failed to verify before image. Please check your internet connection and try again.'
    );
  }
}

/**
 * Verify "after" image - checks if waste has been removed and location is clean
 * Compares before and after images to ensure authentic waste collection
 */
async function verifyAfterImage(beforeImageData, afterImageData) {
  try {
    console.log('🧹 Verifying after image with Gemini...');

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
    console.log('Gemini after image response:', responseText);

    // Parse JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const verification = JSON.parse(cleanedResponse);

    // Ensure all required fields exist
    const isValid = verification.isValid === true;
    const confidence = Math.max(0, Math.min(1, verification.confidence || 0));

    return {
      isValid,
      confidence,
      message: verification.message || 'Verification completed',
      details: {
        wasteRemoved: verification.wasteRemoved || false,
        groundClean: verification.groundClean || false,
        landmarksMatch: verification.landmarksMatch || false,
        sameLocation: verification.sameLocation || false,
        imageFresh: verification.imageFresh || false,
        lightingConsistent: verification.lightingConsistent || false,
      },
    };
  } catch (error) {
    console.error('Error in verifyAfterImage:', error);
    throw new Error(
      'Failed to verify after image. Please check your internet connection and try again.'
    );
  }
}

/**
 * Calculate location distance
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function POST(request) {
  try {
    const { 
      reportedImage, 
      beforeImage, 
      afterImage, 
      reportedLocation, 
      currentLocation,
      verificationType = 'full' // 'before', 'after', or 'full'
    } = await request.json();

    console.log('🔍 Verification request received:', { verificationType });

    // Validate required fields based on verification type
    if (verificationType === 'before' || verificationType === 'full') {
      if (!reportedImage) {
        return NextResponse.json(
          { error: 'Reported image is required for before verification' },
          { status: 400 }
        );
      }
      if (!beforeImage) {
        return NextResponse.json(
          { error: 'Before image is required for before verification' },
          { status: 400 }
        );
      }
    }

    if (verificationType === 'after' || verificationType === 'full') {
      if (!beforeImage) {
        return NextResponse.json(
          { error: 'Before image is required for after verification' },
          { status: 400 }
        );
      }
      if (!afterImage) {
        return NextResponse.json(
          { error: 'After image is required for after verification' },
          { status: 400 }
        );
      }
    }

    const results = {};

    // Step 1: Verify BEFORE image (matches reported image)
    if (verificationType === 'before' || verificationType === 'full') {
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
        results.beforeVerification = beforeVerification;

        console.log('✅ Before verification result:', beforeVerification);
      } catch (error) {
        console.error('❌ Before verification error:', error);
        return NextResponse.json(
          { 
            error: 'Before image verification failed',
            details: error.message 
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Verify AFTER image (waste removed from before image)
    if (verificationType === 'after' || verificationType === 'full') {
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
        results.afterVerification = afterVerification;

        console.log('✅ After verification result:', afterVerification);
      } catch (error) {
        console.error('❌ After verification error:', error);
        return NextResponse.json(
          { 
            error: 'After image verification failed',
            details: error.message 
          },
          { status: 400 }
        );
      }
    }

    // Step 3: Verify location (if provided)
    if (reportedLocation && currentLocation) {
      const distance = calculateDistance(
        reportedLocation.latitude,
        reportedLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      results.locationVerification = {
        distance: distance,
        isValid: distance <= 10, // Within 10km
        message: distance <= 10 
          ? `Location verified (${(distance * 1000).toFixed(0)}m away)` 
          : `Location too far (${(distance * 1000).toFixed(0)}m away, max 10km)`
      };

      console.log('📍 Location verification:', results.locationVerification);
    }

    // Step 4: Determine overall validity
    let overallValid = true;
    let overallMessage = 'Collection verified successfully';
    const failureReasons = [];

    if (results.beforeVerification) {
      if (!results.beforeVerification.isValid) {
        overallValid = false;
        failureReasons.push('Before image does not match reported waste');
      } else if (results.beforeVerification.confidence < 0.6) {
        overallValid = false;
        failureReasons.push(`Before image confidence too low (${(results.beforeVerification.confidence * 100).toFixed(0)}%)`);
      }
    }

    if (results.afterVerification) {
      if (!results.afterVerification.isValid) {
        overallValid = false;
        failureReasons.push('After image verification failed - waste not properly removed');
      } else if (results.afterVerification.confidence < 0.6) {
        overallValid = false;
        failureReasons.push(`After image confidence too low (${(results.afterVerification.confidence * 100).toFixed(0)}%)`);
      }
    }

    if (results.locationVerification && !results.locationVerification.isValid) {
      overallValid = false;
      failureReasons.push(results.locationVerification.message);
    }

    if (!overallValid) {
      overallMessage = failureReasons.join('; ');
    }

    return NextResponse.json({
      success: overallValid,
      message: overallMessage,
      ...results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      { 
        error: 'Verification failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
