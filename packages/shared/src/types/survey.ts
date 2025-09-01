/**
 * SurveyJS-related type definitions
 * Proper types to replace 'any' usage throughout the codebase
 */

import { Model, Question } from 'survey-core';

/**
 * SurveyJS Model data structure
 */
export interface SurveyJSModel {
  pages?: Array<{
    name: string;
    elements: Array<{
      type: string;
      name: string;
      title?: string;
      isRequired?: boolean;
      [key: string]: unknown;
    }>;
  }>;
  showQuestionNumbers?: string;
  showProgressBar?: string;
  locale?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Survey question with FFS mapping
 */
export interface SurveyQuestion extends Question {
  value: unknown;
  name: string;
  getPropertyValue(name: string): string | undefined;
  getType(): string;
}

/**
 * FFS (Ford Field System) data mapping
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
  voi?: string[];
  email_opt_in?: number;
  age_bracket?: string | null;
  [key: string]: string | string[] | number | null | undefined;
}

/**
 * Custom survey data fields
 */
export interface CustomSurveyData {
  [key: string]: string | number | boolean | Record<string, unknown> | null | undefined;
}

/**
 * Survey data structure from form submission
 */
export interface SurveyData {
  device_survey_guid?: string | null;
  microsite_email_template?: EmailTemplate | null;
  voi?: string[];
  vehiclesDriven?: string[];
  vehicles_driven?: string[];
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  _language?: string | null;
  language?: string | null;
  customData?: CustomSurveyData;
  [key: string]: unknown;
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
 * Survey event with proper typing
 */
export interface SurveyEvent {
  name: string;
  brand?: string;
  fordEventID?: string;
  lincolnEventID?: string;
  surveyType?: string;
  surveyJSModel?: SurveyJSModel;
  questions?: string;
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

/**
 * Vehicle of Interest data
 */
export interface VehicleOfInterest {
  id: string;
  make?: string;
  model: string;
  year?: string;
}

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