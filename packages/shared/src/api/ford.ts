/**
 * Ford API Configuration
 * Manages Ford-specific API endpoints and authentication
 */

import { Environment } from './types';

// Ford API Base URLs for each environment
export const FORD_BASE_URLS: Record<Environment, string> = {
  production: 'https://pfg.latitudewebservices.com',
  staging: 'https://staging.pfg.latitudewebservices.com',
  local: 'https://staging.pfg.latitudewebservices.com' // Use staging for local dev
};

// Ford API Endpoints
export const FORD_ENDPOINTS = {
  SURVEY_UPLOAD_V10: '/microsite/v1/survey/upload/v10',
  SURVEY_UPLOAD_V11: '/microsite/v1/survey/upload/v11',
} as const;

// Ford API Authentication Token
export const FORD_AUTH_TOKEN = '989ae554-08ca-4142-862c-0058407d2769';

/**
 * Get Ford API URL for a specific environment and endpoint
 */
export function getFordApiUrl(environment: Environment, endpoint: string): string {
  const baseUrl = FORD_BASE_URLS[environment] || FORD_BASE_URLS.staging;
  return baseUrl + endpoint;
}