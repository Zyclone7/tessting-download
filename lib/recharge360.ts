import crypto from 'crypto';
import https from 'https';

// Recharge360 API configuration using environment variables
const API_CONFIG = {
  url: process.env.NEXT_PUBLIC_RECHARGE360_BASE_URL || 'https://3.1.236.143/',
  userId: process.env.RECHARGE360_USER_ID,
  name: process.env.RECHARGE360_NAME,
  secretKey: process.env.RECHARGE360_SECRET_KEY,
};

// Function to generate a JWT token for authentication
export function generateJwtToken(): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    userid: API_CONFIG.userId,
    name: API_CONFIG.name,
    time: Math.floor(Date.now() / 1000), // Current timestamp in seconds
  };

  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signatureInput = `${headerBase64}.${payloadBase64}`;
  
  // Creating HMAC signature
  const signature = crypto
    .createHmac('sha256', API_CONFIG.secretKey || '')
    .update(signatureInput)
    .digest('base64url');
  
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

// Types for the API
export type DispenseRequest = {
  requestId: string;
  productCode: string;
  recipient: string;
};

export type DispenseResponse = {
  rrn: string;
  token: string;
  balance: string;
};

export type WalletResponse = {
  balance: string;
};

export type ErrorResponse = {
  requestId: string;
  code: string;
  message: string;
  rrn: string;
};

// Improved HTTP request function with better error handling
function makeHttpRequest(
  url: string, 
  method: string, 
  headers: Record<string, string>, 
  body?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create a custom agent that ignores SSL certificate issues in non-production
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    });
    
    const options = {
      method,
      headers,
      agent: httpsAgent,
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check if the response is successful (2xx status code)
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Try to parse as JSON
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            // If not valid JSON, create an error response with the raw data
            reject({
              code: 'ResponseFormatError',
              message: `Invalid JSON response. Status: ${res.statusCode}`,
              details: data.slice(0, 100) + (data.length > 100 ? '...' : '') // Include part of the response for debugging
            });
          }
        } else {
          // Handle non-2xx status codes
          try {
            // Try to parse error response as JSON first
            const errorData = JSON.parse(data);
            reject({
              code: `StatusError${res.statusCode}`,
              message: `Request failed with status ${res.statusCode}`,
              details: errorData
            });
          } catch (error) {
            // If not valid JSON, return raw error response
            reject({
              code: `StatusError${res.statusCode}`,
              message: `Request failed with status ${res.statusCode}`,
              details: data.slice(0, 100) + (data.length > 100 ? '...' : '')
            });
          }
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        code: 'NetworkError',
        message: error.message,
        details: error
      });
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Function to make the dispense API call from server-side
export async function dispenseProduct(requestData: DispenseRequest): Promise<DispenseResponse | ErrorResponse> {
  const token = generateJwtToken();
  
  // Check if environment variables are set
  if (!API_CONFIG.userId || !API_CONFIG.name || !API_CONFIG.secretKey) {
    console.error('Missing Recharge360 API credentials in environment variables');
    return {
      requestId: requestData.requestId,
      code: 'ConfigError',
      message: 'API credentials not properly configured',
      rrn: '',
    };
  }
  
  try {
    // Ensure URL ends with '/'
    const baseUrl = API_CONFIG.url.endsWith('/') ? API_CONFIG.url : `${API_CONFIG.url}/`;
    const fullUrl = `${baseUrl}api/dispense`;
    
    console.log(`Making request to: ${fullUrl}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    const response = await makeHttpRequest(fullUrl, 'POST', headers, requestData);
    return response;
  } catch (error: any) {
    console.error('Error in dispense request:', error);
    
    // Return properly formatted error response
    return {
      requestId: requestData.requestId,
      code: error.code || 'ServerError',
      message: error.message || 'Failed to connect to the server',
      rrn: '',
    };
  }
}

// Function to get wallet balance with improved error handling
export async function getWalletBalance(): Promise<WalletResponse | ErrorResponse> {
  const token = generateJwtToken();
  
  // Check if environment variables are set
  if (!API_CONFIG.userId || !API_CONFIG.name || !API_CONFIG.secretKey) {
    console.error('Missing Recharge360 API credentials in environment variables');
    return {
      requestId: 'wallet_inquiry',
      code: 'ConfigError',
      message: 'API credentials not properly configured',
      rrn: '',
    };
  }
  
  try {
    // Ensure URL ends with '/'
    const baseUrl = API_CONFIG.url.endsWith('/') ? API_CONFIG.url : `${API_CONFIG.url}/`;
    const fullUrl = `${baseUrl}v1/wallet`;
    
    console.log(`Making request to: ${fullUrl}`);
    
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    const response = await makeHttpRequest(fullUrl, 'GET', headers);
    return response;
  } catch (error: any) {
    console.error('Error in wallet balance request:', error);
    
    // Return properly formatted error response
    return {
      requestId: 'wallet_inquiry',
      code: error.code || 'ServerError',
      message: error.message || 'Failed to connect to the server',
      rrn: '',
    };
  }
}

// Function to generate a unique request ID (UUIDv4-like format)
export function generateRequestId(): string {
  return crypto.randomBytes(6).toString('hex');
}