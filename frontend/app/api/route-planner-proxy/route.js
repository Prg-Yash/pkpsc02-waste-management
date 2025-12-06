import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { wasteId, action } = body;

    if (!wasteId) {
      return NextResponse.json({ error: 'wasteId is required' }, { status: 400 });
    }

    // Determine the endpoint based on action
    let endpoint = '';
    let method = 'POST';

    if (action === 'add') {
      endpoint = '/api/route-planner/add';
    } else if (action === 'remove') {
      endpoint = '/api/route-planner/remove';
    } else if (action === 'optimize') {
      endpoint = '/api/route-planner/optimize';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ wasteId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Route Planner API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to process route planner request' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/route-planner`, {
      headers: {
        'x-user-id': userId,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Route Planner API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}
