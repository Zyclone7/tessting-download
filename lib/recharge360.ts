import crypto from 'crypto';
import https from 'https';

// Recharge360 API configuration using environment variables
const API_CONFIG = {
  url: process.env.RECHARGE360_API_URL || 'https://api.recharge360.com.ph',
  userId: process.env.RECHARGE360_USER_ID,
  name: process.env.RECHARGE360_NAME, // Changed from USER_NAME to NAME to match .env
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
    // Create a custom agent that ignores SSL certificate issues
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production', // Only bypass in non-production
    });
    
    const response = await new Promise<{ json: () => any }>((resolve, reject) => {
      const req = https.request(
        `${API_CONFIG.url}/v1/dispense`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          agent: httpsAgent,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ json: () => JSON.parse(data) }));
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify(requestData));
      req.end();
    });
    
    const data = response.json();
    return data;
  } catch (error) {
    console.error('Error in dispense request:', error);
    return {
      requestId: requestData.requestId,
      code: 'ServerError',
      message: error instanceof Error ? error.message : 'Failed to connect to the server',
      rrn: '',
    };
  }
}

// Function to get wallet balance
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
    // Create a custom agent that ignores SSL certificate issues
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production', // Only bypass in non-production
    });
    
    const response = await new Promise<{ json: () => any }>((resolve, reject) => {
      const req = https.request(
        `${API_CONFIG.url}/v1/wallet`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          agent: httpsAgent,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ json: () => JSON.parse(data) }));
        }
      );
      req.on('error', reject);
      req.end();
    });
    
    const data = response.json();
    return data;
  } catch (error) {
    console.error('Error in wallet balance request:', error);
    return {
      requestId: 'wallet_inquiry',
      code: 'ServerError',
      message: error instanceof Error ? error.message : 'Failed to connect to the server',
      rrn: '',
    };
  }
}

// Function to generate a unique request ID (UUIDv4-like format)
export function generateRequestId(): string {
  return crypto.randomBytes(6).toString('hex');
}