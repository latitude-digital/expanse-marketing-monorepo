/**
 * Core type definitions for the entire monorepo
 * This file consolidates all shared type definitions to eliminate duplication
 */

import { Model, Question } from 'survey-core';

// Re-export SurveyJS types directly - don't recreate them
export type { Model as SurveyJSModel, Question as SurveyJSQuestion } from 'survey-core';

/**
 * Survey Event - Consolidated from web-app and shared packages
 */
export interface SurveyEvent {
  name: string;
  brand?: string;
  fordEventID?: string;
  lincolnEventID?: string;
  disabled?: string;
  _preEventID?: string;
  survey_count_limit?: number;
  limit_reached_message?: string;
  surveyType?: string;
  questions?: string;  // Legacy field - to be migrated to surveyJSModel
  surveyJSModel?: any;  // SurveyJS model definition (dynamic structure)
  theme?: string;  // Legacy field
  surveyJSTheme?: any;  // New theme format
  showHeader?: boolean;
  showLanguageChooser?: boolean;
}

/**
 * Survey Data - Core fields that exist regardless of survey definition
 * Everything else comes from the dynamic survey form
 */
export interface SurveyData {
  // Core identification fields (always present)
  device_survey_guid?: string | null;
  event_id?: string;
  device_id?: string;
  
  // Timing fields (always present)
  start_time?: Date | string;
  end_time?: Date | string;
  survey_date?: Date | string;
  
  // Technical metadata (always present)
  app_version?: string;
  _utm?: Record<string, string>;
  _referrer?: string;
  _language?: string | null;
  _screenWidth?: number;
  _offset?: number;
  _timeZone?: string;
  
  // Status/internal fields (always present)
  abandoned?: number;
  _preSurveyID?: string | null;
  _checkedIn?: unknown;
  _checkedOut?: unknown;
  _claimed?: unknown;
  _used?: unknown;
  _email?: unknown;
  _sms?: unknown;
  _exported?: unknown;
  
  // PostTD specific field
  pre_drive_survey_guid?: string | null;
  
  // All other fields are dynamic based on survey definition
  // This includes first_name, last_name, email, phone, voi, etc.
  // which are commonly used but not guaranteed to exist
  [key: string]: unknown;
}

/**
 * Custom survey data - completely flexible container
 */
export type CustomSurveyData = Record<string, unknown>;

/**
 * Pre-Survey data structure
 */
export interface PreSurvey {
  device_survey_guid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

/**
 * Survey API response structure
 */
export interface GetSurveyResponse {
  success: boolean;
  event: SurveyEvent;
  preSurvey?: PreSurvey;
  message?: string;
}

/**
 * Survey limit check result
 */
export interface SurveyLimitResult {
  data: {
    limitReached: boolean;
    message?: string;
  };
}

/**
 * Bookeo integration data
 */
export interface BookeoData {
  bookeoKey: string;
  customFieldId: string;
  seats: number;
  productId: string;
  previousHoldId: string;
  eventId: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phone: string;
  type: string;
  customData: string;
}

/**
 * File upload response structure
 */
export interface UploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  finalImageUrl: string;
}

/**
 * Email template structure
 */
export interface EmailTemplate {
  templateId?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
}

/**
 * Email validation result from SparkPost
 */
export interface EmailValidationResult {
  valid?: boolean;
  is_disposable?: boolean;
  delivery_confidence?: number;
  did_you_mean?: string;
}

/**
 * Email validation API response
 */
export interface EmailValidationResponse {
  results: EmailValidationResult;  // Note: 'results' not 'result' - matches actual API
}

/**
 * FFS (Ford Field System) data mapping
 * This is used internally to map survey questions to Ford/Lincoln API fields
 * Survey questions have an _ffs property that maps to these fields
 */
export interface FFSData {
  signature?: string | null;
  minor_signature?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country_code?: string | null;
  voi?: string[];  // Array of vehicle IDs
  email_opt_in?: number;
  age_bracket?: string | null;
  [key: string]: string | string[] | number | null | undefined;
}

/**
 * Opt-in data structure
 */
export interface OptIn {
  type: 'email' | 'sms' | 'phone' | 'mail';
  value: boolean;
  timestamp?: Date;
  source?: string;
}

/**
 * Address data from survey
 */
export interface AddressData {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
}

/**
 * Waiver data structure
 */
export interface WaiverData {
  signature?: string;
  minorsYesNo?: '0' | '1';
  [key: string]: string | undefined;
}

// Removed VehicleOfInterest interface - VOI is just string[] (array of vehicle IDs)

// Use SurveyJS's Question type directly, don't extend it

/**
 * Helper function type for filtering undefined values
 */
export type FilterUndefined<T> = {
  [K in keyof T]: T[K] extends undefined ? never : T[K];
};

/**
 * Type guard for checking if a value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}