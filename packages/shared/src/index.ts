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
export type { FordSurveyPayload } from './types/ford';
export { createDefaultFordPayload } from './types/ford';

export type { LincolnSurveyPayload } from './types/lincoln';
export { createDefaultLincolnPayload } from './types/lincoln';

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
export * from './utils/phoneValidation';

// SurveyJS Registration
export { 
  registerCustomQuestionTypes,
  registerUniversalQuestions,
  clearRegistrationCache,
  isBrandInitialized
} from './surveyjs/universal-registration';

// SurveyJS Question Configurations
export { fordQuestions } from './surveyjs/questions/ford-questions';
export { lincolnQuestions } from './surveyjs/questions/lincoln-questions';
export { fmcQuestions } from './surveyjs/questions/fmc-questions';
export { sharedQuestions } from './surveyjs/questions/shared-questions';

// Legacy exports for backward compatibility (to be removed later)
export type { FordSurveyPayload as FordSurvey } from './types/ford';
export type { LincolnSurveyPayload as LincolnSurvey } from './types/lincoln';
export { createDefaultFordPayload as createDefaultFordSurvey } from './types/ford';
export { createDefaultLincolnPayload as createDefaultLincolnSurvey } from './types/lincoln';
export { mapToFordPayload as mapSurveyToFordSurvey } from './mappers/ford';
export { mapToLincolnPayload as mapSurveyToLincolnSurvey } from './mappers/lincoln';
