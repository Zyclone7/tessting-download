import { useState, useEffect } from 'react';
import crypto from 'crypto-js';

// Define interfaces for API data structures
interface ApiConfig {
  baseUrl: string;
  userId: string | undefined;
  name: string | undefined;
  secretKey: string | undefined;
}

interface TestProducts {
  PIN: string;
  TELCO: string;
}

interface JwtHeader {
  alg: string;
  typ: string;
}

interface JwtPayload {
  userid: string | undefined;
  name: string | undefined;
  time: number;
}

interface DispenseRequest {
  requestId: string;
  productCode: string;
  recipient: string;
}

interface DispenseResponse {
  rrn: string;
  token: string;
  balance: string;
  requestId?: string;
}

interface InquireResponse {
  requestId: string;
  rrn: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  productCode: string;
  price: string;
  recipient: string;
  token: string;
  balance: string;
  errorCode?: string;
  errorMessage?: string;
}

interface WalletResponse {
  balance: string;
}

interface ErrorResponse {
  code: string;
  message: string;
  requestId?: string;
  rrn?: string;
}

interface RechargeHookState {
  loading: boolean;
  error: string | null;
  result: DispenseResponse | InquireResponse | WalletResponse | null;
  balance: number | null;
  dispense: (productCode: string, recipient: string) => Promise<DispenseResponse>;
  inquire: (requestId: string) => Promise<InquireResponse>;
  getBalance: () => Promise<WalletResponse>;
  TEST_PRODUCTS: TestProducts;
}

// Enhanced error logging and debugging
const logDetailedError = (error: unknown, context: string) => {
  console.group(`API Error: ${context}`);
  
  // Log different error properties
  if (error instanceof Error) {
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
  } else {
    console.error('Unknown Error:', error);
  }

  // Log environment variables for debugging
  console.log('Environment Variables:', {
    baseUrl: process.env.NEXT_PUBLIC_RECHARGE360_BASE_URL,
    userId: process.env.NEXT_PUBLIC_RECHARGE360_USER_ID ? '[PRESENT]' : '[MISSING]',
    name: process.env.NEXT_PUBLIC_RECHARGE360_NAME ? '[PRESENT]' : '[MISSING]',
    secretKey: process.env.NEXT_PUBLIC_RECHARGE360_SECRET_KEY ? '[PRESENT]' : '[MISSING]'
  });

  console.groupEnd();
};

// Recharge360 API Configuration from environment variables
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_RECHARGE360_BASE_URL || 'https://api.recharge360.com.ph/v1',
  userId: process.env.NEXT_PUBLIC_RECHARGE360_USER_ID,
  name: process.env.NEXT_PUBLIC_RECHARGE360_NAME,
  secretKey: process.env.NEXT_PUBLIC_RECHARGE360_SECRET_KEY,
};

// For testing in localhost environment
const TEST_PRODUCTS: TestProducts = {
  PIN: process.env.NEXT_PUBLIC_RECHARGE360_PIN_PRODUCT || 'PINTEST01', // For ePIN testing
  TELCO: process.env.NEXT_PUBLIC_RECHARGE360_TELCO_PRODUCT || 'GLB10',   // For live Globe Telco product
};

/**
 * Generate JWT token for API authentication
 * @returns {string} JWT token
 */
const generateJWT = (): string => {
  try {
    // Validate configuration before generating JWT
    if (!API_CONFIG.userId) {
      throw new Error('User ID is not defined in environment variables');
    }
    if (!API_CONFIG.name) {
      throw new Error('Name is not defined in environment variables');
    }
    if (!API_CONFIG.secretKey) {
      throw new Error('Secret key is not defined in environment variables');
    }

    // Create header
    const header: JwtHeader = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    // Create payload with current timestamp
    const payload: JwtPayload = {
      userid: API_CONFIG.userId,
      name: API_CONFIG.name,
      time: Math.floor(Date.now() / 1000) // Current time in Unix timestamp format
    };
    
    // Base64Url encode header and payload
    const base64UrlHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const base64UrlPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Create signature
    const signatureInput = base64UrlHeader + '.' + base64UrlPayload;
    
    const signature = crypto.HmacSHA256(signatureInput, API_CONFIG.secretKey)
      .toString(crypto.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Combine to form JWT
    return base64UrlHeader + '.' + base64UrlPayload + '.' + signature;
  } catch (error) {
    logDetailedError(error, 'JWT Generation');
    throw error;
  }
};

/**
 * Make an authenticated request to the Recharge360 API
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<T>} API response
 */
const makeAuthenticatedRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    // Additional pre-request validation
    if (!API_CONFIG.baseUrl) {
      throw new Error('Base URL is not configured');
    }

    const token = generateJWT();
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    
    console.group('API Request Debug');
    console.log('Full URL:', url);
    console.log('Endpoint:', endpoint);
    console.log('Request Options:', options);

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...(options.method === 'POST' && { 'Content-Type': 'application/json' })
    };
    
    // Enhanced fetch with more robust error handling
    try {
      // Check network connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('No internet connection');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      const fetchOptions = {
        ...options,
        headers,
        signal: controller.signal
      };

      const response = await fetch(url, fetchOptions);
      
      clearTimeout(timeoutId);
      
      // Log response details
      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        console.error('Error Response Body:', errorText);
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response Data:', data);
      console.groupEnd();
      
      return data as T;
    } catch (fetchError) {
      console.error('Fetch Error:', fetchError);
      console.groupEnd();

      // Distinguish between different types of fetch errors
      if (fetchError instanceof TypeError) {
        logDetailedError(fetchError, 'Network Error');
        throw new Error(`Network error: ${fetchError.message}. 
          Possible causes:
          - No internet connection
          - API endpoint is unreachable
          - CORS issues
          - Network configuration problem`);
      }
      
      throw fetchError;
    }
  } catch (error) {
    logDetailedError(error, 'API Request Error');
    throw error;
  }
};

/**
 * Generate a request ID in the format used by Recharge360 API examples
 * @returns {string} Request ID (12 character hexadecimal string)
 */
export const generateRequestId = (): string => {
  // Generate a random 12-character hexadecimal string
  return Array.from({length: 12}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

/**
 * Dispense a product via Recharge360 API
 * @param {string} productCode - Product code to dispense
 * @param {string} recipient - Recipient (usually a phone number)
 * @returns {Promise<DispenseResponse>} Dispense result
 */
export const dispenseProduct = async (productCode: string, recipient: string): Promise<DispenseResponse> => {
  const requestId = generateRequestId();
  
  const payload: DispenseRequest = {
    requestId,
    productCode,
    recipient
  };
  
  const response = await makeAuthenticatedRequest<DispenseResponse>('/dispense', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  // Add requestId to response for reference
  return {
    ...response,
    requestId
  };
};

/**
 * Inquire about a transaction status
 * @param {string} requestId - The request ID from the original transaction
 * @returns {Promise<InquireResponse>} Transaction status
 */
export const inquireTransaction = async (requestId: string): Promise<InquireResponse> => {
  return makeAuthenticatedRequest<InquireResponse>(`/inquire?requestId=${requestId}`, {
    method: 'GET'
  });
};

/**
 * Get wallet balance
 * @returns {Promise<WalletResponse>} Wallet balance
 */
export const getWalletBalance = async (): Promise<WalletResponse> => {
  return makeAuthenticatedRequest<WalletResponse>('/wallet', {
    method: 'GET'
  });
};

/**
 * React hook for working with Recharge360 API
 * @returns {RechargeHookState} Recharge360 API functions and state
 */
export const useRecharge360 = (): RechargeHookState => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DispenseResponse | InquireResponse | WalletResponse | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  
  // Load wallet balance initially
  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await getWalletBalance();
        setBalance(parseFloat(data.balance));
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'Error fetching wallet balance');
          // Log the detailed error for debugging
          logDetailedError(err, 'Wallet Balance Fetch');
        } else {
          setError('Error fetching wallet balance');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalance();
  }, []);
  
  // Dispense product function with state management
  const dispense = async (productCode: string, recipient: string): Promise<DispenseResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dispenseProduct(productCode, recipient);
      setResult(data);
      
      // Update balance after successful transaction
      if (data.balance) {
        setBalance(parseFloat(data.balance));
      }
      
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error dispensing product');
        logDetailedError(err, 'Product Dispense');
      } else {
        setError('Error dispensing product');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Inquire transaction with state management
  const inquire = async (requestId: string): Promise<InquireResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await inquireTransaction(requestId);
      setResult(data);
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error inquiring transaction');
        logDetailedError(err, 'Transaction Inquiry');
      } else {
        setError('Error inquiring transaction');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Get wallet balance with state management
  const getBalance = async (): Promise<WalletResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getWalletBalance();
      setBalance(parseFloat(data.balance));
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error fetching wallet balance');
        logDetailedError(err, 'Manual Balance Fetch');
      } else {
        setError('Error fetching wallet balance');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    result,
    balance,
    dispense,
    inquire,
    getBalance,
    TEST_PRODUCTS
  };
};

// Export functions and types for external use
export type {
  DispenseResponse,
  InquireResponse,
  WalletResponse,
  TestProducts,
  RechargeHookState,
  ErrorResponse
};

export default {
  dispenseProduct,
  inquireTransaction,
  getWalletBalance,
  useRecharge360,
  generateRequestId,
  TEST_PRODUCTS
};