import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Map frontend status to backend status (uppercase)
    const statusMap = {
      'active': 'ACTIVE',
      'flagged': 'FLAGGED',
      'banned': 'BANNED'
    };
    
    const backendStatus = statusMap[status.toLowerCase()];
    if (!backendStatus) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, flagged, banned' },
        { status: 400 }
      );
    }

    const apiUrl = `${API_BASE_URL}/api/user/${id}/status`;
    
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ status: backendStatus }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update user status', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user status', details: error.message },
      { status: 500 }
    );
  }
}
