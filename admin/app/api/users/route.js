import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function GET(request) {
  try {
    // Get user ID from request headers or use admin user ID from env
    // Priority: header > server env var > public env var
    let userId = request.headers.get('x-user-id') || 
                 request.headers.get('x-admin-user-id') || 
                 process.env.ADMIN_USER_ID ||
                 process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    
    const apiUrl = `${API_BASE_URL}/api/user/all`;
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    
    // Only add x-user-id header if we have a userId
    if (userId) {
      headers['x-user-id'] = userId;
      console.log('Calling backend API with user ID:', userId);
    } else {
      console.log('Calling backend API without user ID (route should be public)');
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API Error:', errorText);
      
      // If 401 and no userId, provide helpful error message
      if (response.status === 401 && !userId) {
        return NextResponse.json(
          { 
            error: 'Authentication required. Please set ADMIN_USER_ID or NEXT_PUBLIC_ADMIN_USER_ID environment variable with a valid user ID from your database.',
            details: errorText
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch users', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
