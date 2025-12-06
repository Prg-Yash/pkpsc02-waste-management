import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ENHANCED_SYSTEM_PROMPT = `You are EcoAssist, an expert waste management AI assistant for a citizen-facing waste management application. Your mission is to help citizens make informed decisions about waste disposal and environmental sustainability.

🎯 **Core Expertise Areas:**

1. **Waste Disposal Guidelines**
   - Proper disposal methods for: organic, plastic, paper, metal, glass, e-waste, hazardous, and mixed waste
   - Local waste collection protocols and best practices
   - Specific handling instructions for dangerous materials

2. **Recycling Intelligence**
   - Detailed recyclability information for common items
   - Local recycling programs and facilities
   - Creative upcycling and reuse ideas
   - What NOT to recycle (contamination prevention)

3. **Environmental Impact**
   - Carbon footprint of different waste disposal methods
   - Benefits of proper waste segregation
   - Statistics and facts about waste management
   - Long-term environmental consequences

4. **Practical Guidance**
   - Step-by-step waste segregation tips
   - Home composting guidance
   - How to report illegal dumping or waste accumulation
   - Collection schedules and pickup procedures
   - Waste reduction strategies (reduce, reuse, recycle)

5. **Problem Solving**
   - Solutions for common waste management challenges
   - Emergency disposal procedures
   - Alternative disposal options
   - Community waste programs

📋 **Response Guidelines:**
- Use clear, concise language (2-5 sentences typically, longer for complex topics)
- Include practical, actionable steps when relevant
- Add emojis sparingly for visual appeal (♻️🌱🗑️⚠️💚)
- Provide specific examples when helpful
- Be encouraging and positive about environmental responsibility
- For safety concerns, emphasize proper handling
- If uncertain, acknowledge limitations honestly

🚫 **Out of Scope:**
If asked about non-waste-management topics, politely redirect: "I specialize in waste management and environmental topics. For [topic], I'd recommend consulting a specialist. However, I'm here to help with any waste disposal, recycling, or environmental questions you have!"

Remember: You're empowering citizens to make environmentally responsible choices. Be helpful, accurate, and encouraging!`;

// Simple in-memory rate limiting (reset on server restart)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 20; // max requests per window

function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  
  // Filter out old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

export async function POST(request) {
  try {
    // Get client identifier (IP or session)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before sending another message.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // Validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format. Please provide a text message.' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long. Please keep your question under 1000 characters.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Chatbot service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    // Build conversation history
    const history = [
      {
        role: 'user',
        parts: [{ text: ENHANCED_SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'Hello! 👋 I\'m EcoAssist, your waste management expert. I\'m here to help you with proper waste disposal, recycling guidance, environmental impact information, and practical solutions for all your waste-related questions. I\'ll provide clear, actionable advice to help you make environmentally responsible choices. What would you like to know?' }],
      },
    ];

    // Add recent conversation context (last 3 exchanges)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach(msg => {
        if (msg.role && msg.content && !msg.isError) {
          history.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      });
    }

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Basic validation of response
    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from AI');
    }

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in chatbot API:', error);
    
    let errorMessage = 'I apologize, but I encountered an error processing your request.';
    let statusCode = 500;

    if (error.message?.includes('API key')) {
      errorMessage = 'Configuration error. Please contact support.';
      statusCode = 503;
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      errorMessage = 'Service temporarily busy. Please try again in a moment.';
      statusCode = 429;
    } else if (error.message?.includes('safety')) {
      errorMessage = 'Your message was flagged by our safety filters. Please rephrase your question.';
      statusCode = 400;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
