// pages/api/proxy/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

// Define response type
type ProxyResponse = {
  success: boolean;
  [key: string]: any;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProxyResponse>
) {
  try {
    const { path } = req.query;
    
    // Ensure path is treated correctly whether it's a string or array
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    
    // Create a custom agent that ignores certificate validation
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    
    // Get the EC2 server URL from environment variables or use hardcoded value
    const baseUrl = process.env.NEXT_PUBLIC_RECHARGE360_BASE_URL || '';
    
    console.log(`Proxying request to: ${baseUrl}/${apiPath}`);
    
    // Forward the request to the EC2 server
    const response = await fetch(`${baseUrl}/${apiPath}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...req.headers as any // Forward any additional headers
      },
      // Only include body for non-GET requests
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      // Use custom agent that ignores certificate validation
      // @ts-ignore - TypeScript doesn't recognize agent option but it works
      agent: httpsAgent
    });
    
    // Get response data
    const data = await response.json();
    
    console.log('Proxy response:', {
      status: response.status,
      success: data.success,
      hasError: !!data.error
    });
    
    // Return the response with appropriate status code
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Send error response
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'PROXY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      } 
    });
  }
}