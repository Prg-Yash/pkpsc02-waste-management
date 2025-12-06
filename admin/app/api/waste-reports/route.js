import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query parameters
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    
    // If no status or status is 'all', we need to fetch all statuses
    // Only valid statuses: PENDING, IN_PROGRESS, COLLECTED
    const statuses = ['PENDING', 'IN_PROGRESS', 'COLLECTED'];
    
    let allWastes = [];
    
    if (status && status !== 'all') {
      // Fetch for specific status
      const apiUrl = `${API_BASE_URL}/api/waste/report?${params.toString()}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API Error:', errorText);
        return NextResponse.json(
          { error: 'Failed to fetch waste reports', details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      allWastes = data.wastes || [];
    } else {
      // Fetch all statuses and combine
      const fetchPromises = statuses.map(async (statusValue) => {
        const apiUrl = `${API_BASE_URL}/api/waste/report?status=${statusValue}`;
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          });

          if (response.ok) {
            const data = await response.json();
            return data.wastes || [];
          }
          return [];
        } catch (error) {
          console.error(`Error fetching status ${statusValue}:`, error);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      allWastes = results.flat();
    }
    
    return NextResponse.json({ wastes: allWastes });
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste reports', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('🗑️ DELETE request received for report:', id);
    console.log('Request URL:', request.url);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }
    
    const apiUrl = `${API_BASE_URL}/api/waste/${id}`;
    console.log('📡 Calling API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    console.log('📥 API Response status:', response.status);

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('❌ Backend API Error:', errorText);
      } catch (e) {
        errorText = `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Backend API Error (could not parse):', errorText);
      }
      return NextResponse.json(
        { error: 'Failed to delete waste report', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Delete successful:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to delete waste report', details: error.message },
      { status: 500 }
    );
  }
}

