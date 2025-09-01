/**
 * Central export point for all shared types
 */

// Core types (consolidated from all packages) - these override survey.ts
export * from './core';

// Re-export surveyjs types for convenience
export type { Model as SurveyModel, Question as SurveyQuestionBase } from 'survey-core';