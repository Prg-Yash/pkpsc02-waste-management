import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev';

export async function DELETE(request, context) {
  try {
    // Extract ID from params or URL
    let id;
    
    // Try to get from context.params first
    if (context?.params) {
      const params = context.params;
      if (typeof params.then === 'function') {
        const resolvedParams = await params;
        id = resolvedParams?.id;
      } else {
        id = params?.id;
      }
    }
    
    // Fallback: extract from URL if params didn't work
    if (!id) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const idIndex = pathParts.indexOf('waste-reports');
      if (idIndex !== -1 && pathParts[idIndex + 1]) {
        id = pathParts[idIndex + 1];
      }
    }
    
    console.log('🗑️ DELETE request received for report:', id);
    console.log('Request URL:', request.url);
    console.log('Context params:', context?.params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required', url: request.url, params: context?.params },
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
