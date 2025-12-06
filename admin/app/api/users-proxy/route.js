import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function GET(request) {
  try {
    const apiUrl = `${API_BASE_URL}/api/user/all`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        // Note: Backend requires x-user-id but for admin viewing all users, 
        // we can use a dummy admin ID or the backend should allow admin access
        'x-user-id': 'admin_dashboard',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API Error:', errorText);
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
