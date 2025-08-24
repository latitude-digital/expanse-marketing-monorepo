/**
 * API Configuration
 *
 * This file manages API endpoint configurations for different environments.
 * Environment is determined by:
 * 1. Build-time REACT_APP_ENV environment variable
 * 2. Default to production if none is available
 */

// Environment type definition
type Environment = 'production' | 'staging' | 'local';

// Available environments
const ENV = {
  PRODUCTION: 'production' as const,
  STAGING: 'staging' as const,
  LOCAL: 'local' as const
} as const;

// Type for environment keys
type EnvKey = keyof typeof ENV;

// Base URLs for each environment
const BASE_URLS: Record<Environment, string> = {
  [ENV.PRODUCTION]: 'https://pfg.latitudewebservices.com/microsite/v1',
  [ENV.STAGING]: 'https://staging.pfg.latitudewebservices.com/microsite/v1',  
  [ENV.LOCAL]: 'http://localhost:3000/microsite/v1'
};

// Determine current environment from build-time environment variable
const determineEnvironment = (): Environment => {
  // Check Vite environment variables
  const viteEnv = import.meta.env.VITE_ENV;
  if (viteEnv === ENV.PRODUCTION) return ENV.PRODUCTION;
  if (viteEnv === ENV.STAGING) return ENV.STAGING;
  if (viteEnv === ENV.LOCAL) return ENV.LOCAL;
  // Default to production
  console.log('No environment setting found, defaulting to PRODUCTION');
  return ENV.PRODUCTION;
};

// Current environment
const CURRENT_ENV: Environment = determineEnvironment();
console.log('Selected API environment:', CURRENT_ENV);

// Get current base URL based on environment
export const getBaseUrl = (): string => {
  return BASE_URLS[CURRENT_ENV] || BASE_URLS[ENV.PRODUCTION];
};

console.log('Using API base URL:', getBaseUrl());

// Check if we should use Firebase Functions emulator
const useFunctionsEmulator = (): boolean => {
  // Check Firebase mode first
  if (import.meta.env.VITE_FIREBASE_MODE === 'production') {
    return false;
  }
  
  if (import.meta.env.VITE_FIREBASE_MODE === 'emulator') {
    return import.meta.env.VITE_USE_FUNCTIONS_EMULATOR !== 'false';
  }
  
  // Default behavior
  const inDev = import.meta.env.MODE === 'development' || 
                window.location.hostname === 'localhost' ||
                import.meta.env.VITE_USE_EMULATOR === 'true';
  
  return inDev && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR !== 'false';
};

// Determine Firebase namespace from environment
const getFirebaseNamespace = (): string => {
  // Check VITE_FIREBASE_NAMESPACE environment variable
  const namespace = import.meta.env.VITE_FIREBASE_NAMESPACE;
  if (namespace === 'staging') return 'staging';
  if (namespace === 'prod') return 'prod';
  // Default to prod
  return 'prod';
};

const FIREBASE_NAMESPACE = getFirebaseNamespace();

// Firebase Functions base URLs
const FIREBASE_FUNCTIONS_BASE: string = useFunctionsEmulator() 
  ? 'http://127.0.0.1:5001/latitude-lead-system/us-central1'
  : 'https://us-central1-latitude-lead-system.cloudfunctions.net';

// Cloud Run base URLs (getBroncoRank is a separate service)
const CLOUD_RUN_BASE: string = useFunctionsEmulator()
  ? 'http://127.0.0.1:5001/latitude-lead-system/us-central1' // Use Functions emulator for local dev
  : 'https://getbroncorank-erqibiidsa-uc.a.run.app';

if (useFunctionsEmulator()) {
  console.log('🔧 Using Firebase emulators for Functions');
  console.log(`📦 Using namespace: ${FIREBASE_NAMESPACE}`);
} else {
  console.log('🌐 Using production Firebase Functions');
  console.log(`📦 Using namespace: ${FIREBASE_NAMESPACE}`);
}

// API endpoints interface
interface ApiEndpoints {
  SURVEY_UPLOAD: string;
  SURVEY_UPLOAD_V10: string;
  SURVEY_UPLOAD_V11: string;
  LINCOLN_SURVEY_UPLOAD: string;
  LINCOLN_VEHICLES_INTERESTED: string;
  LINCOLN_VEHICLES_DRIVEN: string;
  VEHICLES_INSERT: string;
  EVENTS_CHECK: string;
  EVENTS_QR: string;
  VALIDATE_EMAIL: string;
  GET_SURVEY: string;
  MAKE_BOKEO_BOOKING: string;
  SAVE_SURVEY: string;
  CHECK_IN_OUT_SURVEY: string;
  GET_BRONCO_RANK: string;
  CREATE_NEW_USER: string;
  GET_BOOKEO_PRODUCTS: string;
  GET_BOOKEO_SLOTS_BY_PRODUCT: string;
  HOLD_BOOKEO_BOOKING: string;
  GET_BRONCO_RANK_BASE: string;
}

// API endpoints (paths relative to base URL)
export const ENDPOINTS: ApiEndpoints = {
  SURVEY_UPLOAD: '/survey/upload/v9',
  SURVEY_UPLOAD_V10: '/survey/upload/v10',
  SURVEY_UPLOAD_V11: '/survey/upload/v11',
  LINCOLN_SURVEY_UPLOAD: 'https://api.latitudeshowtracker.com/events/v1/survey/insert/v13',
  LINCOLN_VEHICLES_INTERESTED: 'https://api.latitudeshowtracker.com/events/v1/survey/insert/vehicles/interested',
  LINCOLN_VEHICLES_DRIVEN: 'https://api.latitudeshowtracker.com/events/v1/survey/insert/vehicles/driven',
  VEHICLES_INSERT: '/survey/insert/vehicles',
  EVENTS_CHECK: '/events/check/v2',
  EVENTS_QR: '/events/qr',
  // Firebase functions are full URLs with namespace
  VALIDATE_EMAIL: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-validateEmail`,
  GET_SURVEY: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-getSurvey`,
  MAKE_BOKEO_BOOKING: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-makeBookeoBooking`,
  SAVE_SURVEY: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-saveSurvey`,
  CHECK_IN_OUT_SURVEY: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-checkInOutSurvey`,
  GET_BRONCO_RANK: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-getBroncoRank`,
  CREATE_NEW_USER: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-createNewUser`,
  GET_BOOKEO_PRODUCTS: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-getBookeoProducts`,
  GET_BOOKEO_SLOTS_BY_PRODUCT: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-getBookeoSlotsByProduct`,
  HOLD_BOOKEO_BOOKING: `${FIREBASE_FUNCTIONS_BASE}/${FIREBASE_NAMESPACE}-holdBookeoBooking`,
  // Cloud Run endpoints
  GET_BRONCO_RANK_BASE: CLOUD_RUN_BASE
};

// Get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  // Check if the endpoint is a full URL (for Firebase functions)
  if (endpoint.indexOf('http') === 0) {
    return endpoint;
  }
  // Otherwise, prepend the base URL
  return getBaseUrl() + endpoint;
};

export { ENV, CURRENT_ENV };
export type { Environment, ApiEndpoints };