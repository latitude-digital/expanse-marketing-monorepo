/**
 * API client configuration and utilities
 * Copied and adapted from web-app api.ts for native app use only
 * DO NOT modify original web-app API configuration
 */

import { 
  Environment, 
  ApiEndpoints, 
  ApiClientConfig,
  RequestConfig,
  RetryConfig,
  ApiResponse
} from '../types/api-clients';

/**
 * Environment-specific base URLs
 * Copied from web-app api.ts BASE_URLS
 */
const BASE_URLS: Record<Environment, string> = {
  production: 'https://pfg.latitudewebservices.com/microsite/v1',
  staging: 'https://staging.pfg.latitudewebservices.com/microsite/v1',
  local: 'http://localhost:3000/microsite/v1'
};

/**
 * Firebase Functions base URLs for different environments
 */
const FIREBASE_FUNCTIONS_BASE: Record<Environment, string> = {
  production: 'https://us-central1-latitude-lead-system.cloudfunctions.net',
  staging: 'https://us-central1-latitude-lead-system.cloudfunctions.net',
  local: 'http://127.0.0.1:5001/latitude-lead-system/us-central1'
};

/**
 * API endpoint paths
 * Copied from web-app api.ts ENDPOINTS
 */
export function getApiEndpoints(environment: Environment): ApiEndpoints {
  const baseUrl = BASE_URLS[environment];
  const firebaseBase = FIREBASE_FUNCTIONS_BASE[environment];
  
  return {
    // Ford API endpoints
    SURVEY_UPLOAD_V11: `${baseUrl}/survey/upload/v11`,
    VEHICLES_INSERT: `${baseUrl}/survey/insert/vehicles`,
    
    // Lincoln API endpoints (fixed URLs)
    LINCOLN_SURVEY_UPLOAD: 'https://api.latitudeshowtracker.com/events/v1/survey/insert/v13',
    LINCOLN_VEHICLES_INTERESTED: 'https://api.latitudeshowtracker.com/events/v1/survey/insert/vehicles/interested',
    LINCOLN_VEHICLES_DRIVEN: 'https://api.latitudeshowtracker.com/events/v1/survey/insert/vehicles/driven',
    
    // Firebase Functions
    GET_SURVEY: `${firebaseBase}/getSurvey`,
    SAVE_SURVEY: `${firebaseBase}/saveSurvey`,
    VALIDATE_EMAIL: `${firebaseBase}/validateEmail`,
    CHECK_IN_OUT_SURVEY: `${firebaseBase}/checkInOutSurvey`,
    
    // Event management
    EVENTS_CHECK: `${baseUrl}/events/check/v2`,
    EVENTS_QR: `${baseUrl}/events/qr`,
  };
}

/**
 * Default API client configuration
 */
export function getDefaultApiConfig(environment: Environment = 'production'): ApiClientConfig {
  return {
    environment,
    baseUrl: BASE_URLS[environment],
    firebaseProjectId: 'latitude-lead-system',
    
    // Authentication headers (from web-app)
    fordAuthHeader: '989ae554-08ca-4142-862c-0058407d2769',
    lincolnAuthHeader: '91827364',
    
    // Request configuration
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  };
}

/**
 * Create request headers for Ford API
 */
export function getFordHeaders(authKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': authKey,
  };
}

/**
 * Create request headers for Lincoln API
 */
export function getLincolnHeaders(authKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'GTB-ACCESS-KEY': authKey,
  };
}

/**
 * Create request headers for Firebase Functions
 */
export function getFirebaseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Default retry configuration
 */
export function getDefaultRetryConfig(): RetryConfig {
  return {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  };
}

/**
 * Check if HTTP status code indicates a retryable error
 */
export function isRetryableError(statusCode: number, retryConfig: RetryConfig): boolean {
  return retryConfig.retryableStatusCodes.includes(statusCode);
}

/**
 * Calculate delay for retry attempt with exponential backoff
 */
export function calculateRetryDelay(attempt: number, retryConfig: RetryConfig): number {
  return retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T = any>(
  success: boolean,
  statusCode: number,
  data?: T,
  error?: string
): ApiResponse<T> {
  return {
    success,
    statusCode,
    data,
    error,
  };
}

/**
 * Validate API endpoint URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Environment detection utilities
 */
export function detectEnvironment(): Environment {
  // For native app, default to production
  // Can be overridden by configuration
  return 'production';
}

/**
 * Create request configuration for native app HTTP client
 */
export function createRequestConfig(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  headers: Record<string, string>,
  body?: any,
  timeout?: number
): RequestConfig {
  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    timeout,
  };
}

/**
 * Utility to get full API URL
 * Copied from web-app getApiUrl function
 */
export function getApiUrl(endpoint: string, baseUrl?: string): string {
  // Check if the endpoint is already a full URL
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  
  // Otherwise, prepend the base URL
  if (!baseUrl) {
    throw new Error('Base URL required for relative endpoints');
  }
  
  return baseUrl + endpoint;
}