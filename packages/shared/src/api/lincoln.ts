/**
 * Lincoln API Configuration  
 * Manages Lincoln-specific API endpoints and authentication
 */

import { Environment } from './types';

// Lincoln API Base URLs for each environment
export const LINCOLN_BASE_URLS: Record<Environment, string> = {
  production: 'https://api.latitudeshowtracker.com',
  staging: 'https://staging.api.latitudeshowtracker.com',
  local: 'https://staging.api.latitudeshowtracker.com' // Use staging for local dev
};

// Lincoln API Endpoints
export const LINCOLN_ENDPOINTS = {
  SURVEY_UPLOAD_V13: '/events/v1/survey/insert/v13',
} as const;

// Lincoln API Authentication Token
export const LINCOLN_AUTH_TOKEN = '91827364';

/**
 * Get Lincoln API URL for a specific environment and endpoint
 */
export function getLincolnApiUrl(environment: Environment, endpoint: string): string {
  const baseUrl = LINCOLN_BASE_URLS[environment] || LINCOLN_BASE_URLS.staging;
  return baseUrl + endpoint;
}