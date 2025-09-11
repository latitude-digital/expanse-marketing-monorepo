/**
 * Unified API Configuration
 * Central configuration for all API endpoints
 */

import type { Environment } from './types';
import { FORD_BASE_URLS, FORD_ENDPOINTS, FORD_AUTH_TOKEN, getFordApiUrl } from './ford';
import { LINCOLN_BASE_URLS, LINCOLN_ENDPOINTS, LINCOLN_AUTH_TOKEN, getLincolnApiUrl } from './lincoln';

// Detect current environment based on hostname or env variable
export function getCurrentEnvironment(): Environment {
  // Check Node environment variable first (for Firebase functions)
  if (typeof process !== 'undefined' && process.env) {
    // Check LATITUDE_ENV first (set in Firebase .env files)
    if (process.env.LATITUDE_ENV === 'staging') {
      console.log('[Environment] Detected staging from LATITUDE_ENV');
      return 'staging';
    }
    if (process.env.LATITUDE_ENV === 'production') {
      console.log('[Environment] Detected production from LATITUDE_ENV');
      return 'production';
    }
    
    if (process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production') {
      return 'production';
    }
    if (process.env.NODE_ENV === 'staging' || process.env.ENVIRONMENT === 'staging') {
      return 'staging';
    }
    
    // Check Firebase project ID for environment detection
    const firebaseProject = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (firebaseProject === 'latitude-leads-staging') {
      console.log('[Environment] Detected staging from Firebase project ID:', firebaseProject);
      return 'staging';
    }
    if (firebaseProject === 'latitude-lead-system') {
      console.log('[Environment] Detected production from Firebase project ID:', firebaseProject);
      return 'production';
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
export type { Environment };
export {
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
