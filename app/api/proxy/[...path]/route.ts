// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { OutgoingHttpHeaders } from 'http';

// Define EC2 server URL
const EC2_SERVER_URL = process.env.NEXT_PUBLIC_RECHARGE360_BASE_URL || '';

// Helper function to make HTTPS requests with certificate validation disabled
async function makeSecureRequest(url: string, method: string, headers: HeadersInit, body?: any): Promise<Response> {
  return new Promise((resolve, reject) => {
    // Parse the URL to get components
    const urlObj = new URL(url);
    
    // Create options for the HTTPS request
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: `${urlObj.pathname}${urlObj.search}`,
      method: method,
      headers: {
        ...headers,
        host: urlObj.hostname,
      },
    };

    // Create a custom agent that ignores SSL certificate issues
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    const req = https.request({ ...options, agent, headers: headers as OutgoingHttpHeaders }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Create headers for the response
        const headers = new Headers();
        Object.entries(res.headers).forEach(([key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => headers.append(key, v));
            } else {
              headers.append(key, value);
            }
          }
        });
        
        // Create a Response object
        resolve(new Response(data, {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers,
        }));
      });
    });
    
    req.on('error', (error) => {
      console.error('Error in proxy request:', error);
      reject(error);
    });
    
    // Write the request body if provided
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Generic request handler function
async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<Response> {
  try {
    // Join path segments to create the target path
    const targetPath = pathSegments.join('/');
    
    // Get query string from the request URL
    const queryString = request.nextUrl.search || '';
    
    // Build the complete URL to the EC2 server
    const targetUrl = `${EC2_SERVER_URL}/${targetPath}${queryString}`;
    
    console.log(`Proxying ${method} request to: ${targetUrl}`);
    
    // Get request headers
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    });
    
    // Get request body if not a GET request
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }
    
    // Make the request to the EC2 server
    const response = await makeSecureRequest(targetUrl, method, headers, body);
    
    // Return the response
    return response;
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Return an error response
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'PROXY_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}

// Export HTTP method handlers
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}