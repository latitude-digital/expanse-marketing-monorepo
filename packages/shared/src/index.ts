/**
 * Shared utilities for Expanse Marketing
 * Organized exports for better maintainability
 */

// API Configuration and Upload
export { uploadSurveyToAPI, type UploadResult } from './api/uploader';
export { 
  getCurrentEnvironment,
  normalizeBrand,
  getFordApiUrl,
  getLincolnApiUrl,
  FORD_BASE_URLS,
  FORD_ENDPOINTS,
  FORD_AUTH_TOKEN,
  LINCOLN_BASE_URLS,
  LINCOLN_ENDPOINTS,
  LINCOLN_AUTH_TOKEN,
  type Environment
} from './api/config';

// Core Types
export * from './types';  // Exports all types including core.ts
export * from './types/expanse';  // Keep for backward compatibility

// Survey Type Definitions
export { 
  FordSurveyPayload,
  createDefaultFordPayload 
} from './types/ford';

export { 
  LincolnSurveyPayload,
  createDefaultLincolnPayload 
} from './types/lincoln';

// Survey Mapping Functions
export { mapToFordPayload } from './mappers/ford';
export { mapToLincolnPayload } from './mappers/lincoln';

// Services
export * from './services';  // Email validation and other services

// Utility Functions
export * from './utils/validation';
export * from './utils/network';
export * from './utils/formatting';
export * from './utils/surveyLocale';
export * from './utils/browser';

// SurveyJS Registration
export { 
  registerCustomQuestionTypes,
  registerUniversalQuestions
} from './surveyjs/universal-registration';

// Legacy exports for backward compatibility (to be removed later)
export { FordSurveyPayload as FordSurvey } from './types/ford';
export { LincolnSurveyPayload as LincolnSurvey } from './types/lincoln';
export { createDefaultFordPayload as createDefaultFordSurvey } from './types/ford';
export { createDefaultLincolnPayload as createDefaultLincolnSurvey } from './types/lincoln';
export { mapToFordPayload as mapSurveyToFordSurvey } from './mappers/ford';
export { mapToLincolnPayload as mapSurveyToLincolnSurvey } from './mappers/lincoln';