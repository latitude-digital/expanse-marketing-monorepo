// Re-export all utilities
export * from './api-client';
export * from './data-mapping';
export * from './phoneValidation';

// Named exports for compatibility
export { mapSurveyResponseToFirestore, mapSurveyResponseToFordAPI, mapSurveyResponseToLincolnAPI } from './data-mapping';