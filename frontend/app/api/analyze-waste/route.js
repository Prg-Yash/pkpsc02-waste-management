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
        const prompt = `You are an expert waste management analyst. Analyze this waste image carefully and provide accurate classification.

Examine the image for:
1. Primary waste materials visible (plastics, organic matter, metals, electronics, hazardous materials)
2. Quantity and size of items
3. Physical condition and contamination level

Provide your analysis in this EXACT JSON format with no additional text:
{
    "wasteType": "plastic|organic|metal|e-waste|hazardous|mixed",
    "estimatedWeight": <number>,
    "description": "<string>"
}

Classification Guidelines:
- wasteType: Select ONE primary category
    * plastic: bottles, bags, packaging, containers
    * organic: food scraps, yard waste, biodegradable materials
    * metal: cans, foil, scrap metal
    * e-waste: electronics, batteries, circuit boards
    * hazardous: chemicals, paints, medical waste
    * mixed: multiple waste types with no clear majority
    
- estimatedWeight (in kg):
    * Single small item (cup, wrapper): 0.1-0.3 kg
    * Few small items: 0.5-1 kg
    * Standard garbage bag: 2-5 kg
    * Large bag or multiple bags: 5-15 kg
    * Pile or bulk waste: 15+ kg
    
- description: Provide a concise, specific description (max 200 characters) including:
    * Main items visible
    * Condition (clean, contaminated, damaged)
    * Any safety concerns

Return ONLY the JSON object. No explanations, no markdown, no extra text.`;

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

