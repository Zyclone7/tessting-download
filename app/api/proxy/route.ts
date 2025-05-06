// File: app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateJwtToken } from '@/lib/recharge360';

// Base URL for the Recharge360 API
const API_BASE_URL = process.env.NEXT_PUBLIC_RECHARGE360_BASE_URL || '';

export async function GET(request: NextRequest) {
  try {
    // Extract the endpoint from the query parameter
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || 'api/wallet';
    
    // Generate JWT token
    const token = generateJwtToken();
    
    // Make request to Recharge360 API
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    // Get response data
    const data = await response.json();
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { code: 'PROXY_ERROR', message: 'Error in proxy request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract the endpoint from the query parameter
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || 'api/dispense';
    
    // Get request body
    const body = await request.json();
    
    // Generate JWT token
    const token = generateJwtToken();
    
    // Make request to Recharge360 API
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    // Get response data
    const data = await response.json();
    
    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { code: 'PROXY_ERROR', message: 'Error in proxy request' },
      { status: 500 }
    );
  }
}