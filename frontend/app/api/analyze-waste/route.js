import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create prompt for waste analysis
    const prompt = `Analyze this waste image and provide the following information in JSON format:
    {
      "wasteType": "one of: organic, plastic, paper, metal, glass, ewaste",
      "estimatedWeight": number (in kg, be realistic),
      "description": "detailed description of the waste including type, condition, and any notable characteristics (max 200 characters)"
    }

    Rules:
    - For wasteType, choose the most dominant waste type visible
    - For estimatedWeight, provide a realistic estimate based on the visible amount (e.g., 0.5 for small items, 1-5 for medium bags, 10+ for large piles)
    - For description, be specific about what you see and its condition
    - Return ONLY valid JSON, no additional text`;

    // Prepare the image part
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: 'image/jpeg',
      },
    };

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let analysisData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      
      // Return a default response if parsing fails
      return NextResponse.json({
        wasteType: 'organic',
        estimatedWeight: 1.0,
        description: 'Unable to analyze image automatically. Please provide details manually.'
      });
    }

    // Validate and return the analysis
    return NextResponse.json({
      wasteType: analysisData.wasteType || 'organic',
      estimatedWeight: analysisData.estimatedWeight || 1.0,
      description: analysisData.description || 'Waste detected in image'
    });

  } catch (error) {
    console.error('Error analyzing waste image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image', details: error.message },
      { status: 500 }
    );
  }
}
