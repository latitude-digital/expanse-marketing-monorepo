/**
 * Unified API Configuration
 * Central configuration for all API endpoints
 */

import { Environment } from './types';
import { FORD_BASE_URLS, FORD_ENDPOINTS, FORD_AUTH_TOKEN, getFordApiUrl } from './ford';
import { LINCOLN_BASE_URLS, LINCOLN_ENDPOINTS, LINCOLN_AUTH_TOKEN, getLincolnApiUrl } from './lincoln';

// Detect current environment based on hostname or env variable
export function getCurrentEnvironment(): Environment {
  // Check Node environment variable first (for Firebase functions)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production') {
      return 'production';
    }
    if (process.env.NODE_ENV === 'staging' || process.env.ENVIRONMENT === 'staging') {
      return 'staging';
    }
  }
  
  // Check browser hostname (for web-app)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'local';
    }
    if (hostname.includes('staging')) {
      return 'staging';
    }
    if (hostname.includes('production') || hostname.includes('.com')) {
      return 'production';
    }
  }
  
  // Default to staging for safety
  return 'staging';
}

// Helper function to normalize brand
export function normalizeBrand(brand?: string | null): 'Ford' | 'Lincoln' | 'Other' {
  if (brand === 'Ford' || brand === 'Lincoln') {
    return brand;
  }
  return 'Other';
}

// Export everything for convenience
export {
  // Types
  Environment,
  
  // Ford configuration
  FORD_BASE_URLS,
  FORD_ENDPOINTS,
  FORD_AUTH_TOKEN,
  getFordApiUrl,
  
  // Lincoln configuration
  LINCOLN_BASE_URLS,
  LINCOLN_ENDPOINTS,
  LINCOLN_AUTH_TOKEN,
  getLincolnApiUrl,
};