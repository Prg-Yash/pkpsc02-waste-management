import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    
    // Build query parameters
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (city) params.append('city', city);
    
    const apiUrl = `${API_BASE_URL}/api/waste/report?${params.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste reports', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get the FormData from the request
    const formData = await request.formData();
    
    const apiUrl = `${API_BASE_URL}/api/waste/report`;
    
    console.log('Waste Report Proxy: Forwarding to', apiUrl);
    
    // Forward the FormData directly to the backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-user-id': formData.get('userId') || '',
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    // Get response as text first
    const responseText = await response.text();
    console.log('Backend Response:', responseText.substring(0, 200));

    if (!response.ok) {
      console.error('Backend API Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500)
      });
      
      // Try to parse as JSON
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch (e) {
        errorDetails = { error: responseText };
      }
      
      return NextResponse.json(
        { error: 'Failed to submit waste report', details: errorDetails },
        { status: response.status }
      );
    }

    // Parse successful response
    const data = JSON.parse(responseText);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Waste Report Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit waste report', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
