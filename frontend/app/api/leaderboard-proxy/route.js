import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Determine endpoint based on type
    let endpoint;
    switch (type) {
      case 'collectors':
        endpoint = '/api/leaderboard/collectors';
        break;
      case 'reporters':
        endpoint = '/api/leaderboard/reporters';
        break;
      default:
        endpoint = '/api/leaderboard/global';
    }

    const apiUrl = `${API_BASE_URL}${endpoint}?userId=${userId}`;

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'ngrok-skip-browser-warning': 'true',
        },
      });
    } catch (fetchError) {
      console.error('Proxy: Fetch error (network/connection issue):', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to connect to backend API',
          details: fetchError.message,
          url: apiUrl,
          hint: 'Make sure the API server is running and accessible'
        },
        { status: 503 }
      );
    }

    // Get response text first to check what we're dealing with
    const responseText = await response.text();
    console.log('Proxy: Response:', responseText.substring(0, 200));
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      console.error('Backend API Error:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        url: apiUrl,
        responseText: responseText.substring(0, 500)
      });

      // Try to parse as JSON if possible
      let errorDetails = responseText;
      try {
        if (contentType.includes('application/json')) {
          errorDetails = JSON.parse(responseText);
        }
      } catch (e) {
        // Keep as text
      }

      return NextResponse.json(
        { error: 'Failed to fetch leaderboard', details: errorDetails },
        { status: response.status }
      );
    }

    // Check if response is JSON
    if (!contentType.includes('application/json')) {
      console.error('Non-JSON response from backend:', {
        contentType,
        responseText: responseText.substring(0, 500)
      });
      return NextResponse.json(
        { error: 'Backend returned non-JSON response', details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: e.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
