// Re-export all utilities
export * from './api-client';
export * from './data-mapping';

// Named exports for compatibility
export { mapSurveyResponseToFirestore, mapSurveyResponseToFordAPI, mapSurveyResponseToLincolnAPI } from './data-mapping';