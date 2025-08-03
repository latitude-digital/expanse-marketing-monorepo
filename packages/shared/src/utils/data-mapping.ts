/**
 * Data mapping utilities for survey responses
 * Copied and adapted from web-app mapping functions for native app use only
 * DO NOT modify original web-app mapping functions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BaseSurveyAnswers,
  FordSurveyAnswers,
  LincolnSurveyAnswers,
  FordVehicleOfInterest,
  LincolnVehicleOfInterest,
  LincolnVehicleDriven
} from '../types/survey-responses';
import { ExpanseEvent } from '../types/expanse-event';

/**
 * Create default Ford survey structure
 * Copied from web-app createDefaultFordSurvey function
 */
export function createDefaultFordSurvey(): FordSurveyAnswers {
  return {
    event_id: null,
    survey_date: null,
    survey_type: null,
    device_survey_guid: null,
    pre_drive_survey_guid: null,
    device_id: null,
    app_version: 'native_app_1.0',
    abandoned: 0,
    start_time: null,
    end_time: null,
    first_name: null,
    last_name: null,
    address1: null,
    address2: null,
    city: null,
    state: null,
    country_code: null,
    zip_code: null,
    phone: null,
    email: null,
    email_opt_in: 0,
    vehicle_driven_most_model_id: null,
    vehicle_driven_most_make_id: null,
    vehicle_driven_most_year: null,
    in_market_timing: null,
    accepts_sms: 0,
    how_likely_acquire: null,
    how_likely_purchasing: null,
    how_likely_purchasing_pre: null,
    how_likely_purchasing_post: null,
    how_likely_recommend: null,
    how_likely_recommend_post: null,
    followup_survey_opt_in: null,
    signature: null,
    minor_signature: null,
    birth_year: null,
    gender: null,
    age_bracket: null,
    impression_pre: null,
    impression_ev: null,
    can_trust: null,
    impact_overall_opinion: null,
    optins: [],
    custom_data: null,
  };
}

/**
 * Map base survey data to Ford API format
 * Adapted from web-app mapSurveyToFordSurvey function
 */
export function mapToFordSurvey(
  surveyData: BaseSurveyAnswers, 
  event?: ExpanseEvent,
  customMappings?: Record<string, any>
): FordSurveyAnswers {
  const fordSurvey = createDefaultFordSurvey();
  
  // Map basic fields
  Object.assign(fordSurvey, {
    device_survey_guid: surveyData.device_survey_guid,
    survey_date: surveyData.survey_date,
    survey_type: surveyData.survey_type || event?.surveyType || 'basic',
    start_time: surveyData.start_time,
    end_time: surveyData.end_time,
    abandoned: surveyData.abandoned,
    app_version: surveyData.app_version,
    
    // Personal information
    first_name: surveyData.first_name || null,
    last_name: surveyData.last_name || null,
    email: surveyData.email || null,
    phone: surveyData.phone || null,
    
    // Legal documents
    signature: surveyData.signature || null,
    minor_signature: surveyData.minor_signature || null,
    
    // Event-specific data
    event_id: event?.fordEventID || null,
    pre_drive_survey_guid: surveyData.pre_drive_survey_guid || null,
  });
  
  // Apply custom mappings if provided
  if (customMappings) {
    Object.assign(fordSurvey, customMappings);
  }
  
  // Ensure signature fields are strings, not objects
  if (typeof fordSurvey.signature === 'object' && fordSurvey.signature !== null) {
    fordSurvey.signature = (fordSurvey.signature as any).signature || null;
  }
  
  if (typeof fordSurvey.minor_signature === 'object' && fordSurvey.minor_signature !== null) {
    fordSurvey.minor_signature = null; // Reset if object format
  }
  
  // Handle age bracket normalization (from web-app logic)
  if (fordSurvey.age_bracket === '18 - 20' || fordSurvey.age_bracket === '21 - 24') {
    fordSurvey.age_bracket = '18 - 24';
  }
  
  return fordSurvey;
}

/**
 * Map base survey data to Lincoln API format
 * Adapted from web-app mapSurveyToLincolnSurvey function
 * Lincoln uses same structure as Ford but with different event ID
 */
export function mapToLincolnSurvey(
  surveyData: BaseSurveyAnswers,
  event?: ExpanseEvent,
  customMappings?: Record<string, any>
): LincolnSurveyAnswers {
  // Use Ford mapping as base (same structure)
  const lincolnSurvey = mapToFordSurvey(surveyData, event, customMappings);
  
  // Override event_id for Lincoln
  lincolnSurvey.event_id = event?.lincolnEventID || null;
  
  return lincolnSurvey;
}

/**
 * Create Ford VOI payload from vehicle IDs
 * Based on web-app VOI handling in Survey.tsx
 */
export function createFordVOIPayload(
  vehicleIds: string[],
  deviceSurveyGuid: string
): FordVehicleOfInterest[] {
  return vehicleIds.map(vehicle_id => ({
    vehicle_id,
    device_survey_guid: deviceSurveyGuid,
    survey_vehicle_guid: uuidv4(),
  }));
}

/**
 * Create Lincoln VOI payload from vehicle IDs
 * Based on web-app Lincoln VOI handling in Survey.tsx
 */
export function createLincolnVOIPayload(
  vehicleIds: string[],
  deviceSurveyGuid: string,
  eventId: number | string,
  surveyType: string = 'basic'
): LincolnVehicleOfInterest[] {
  return vehicleIds.map(vehicle_id => ({
    event_id: eventId,
    device_survey_guid: deviceSurveyGuid,
    survey_date: new Date().toISOString(),
    vehicle_id,
    app_version: 'native_app_1.0',
    abandoned: false,
    custom_data: {
      survey_type: surveyType
    }
  }));
}

/**
 * Create Lincoln driven vehicle payload
 * Based on web-app Lincoln driven vehicle handling in Survey.tsx
 */
export function createLincolnDrivenPayload(
  makeId: number | string | null,
  modelId: number | string | null,
  year: number | string | null,
  deviceSurveyGuid: string,
  eventId: number | string,
  surveyType: string = 'basic'
): LincolnVehicleDriven[] {
  if (!makeId && !modelId) {
    return []; // No driven vehicle data
  }
  
  return [{
    event_id: eventId,
    device_survey_guid: deviceSurveyGuid,
    survey_date: new Date().toISOString(),
    make_id: makeId,
    model_id: modelId,
    year: year,
    app_version: 'native_app_1.0',
    abandoned: false,
    custom_data: {
      survey_type: surveyType
    }
  }];
}

/**
 * Extract UTM parameters from URL or environment
 * Copied from web-app extractUTM utility
 */
export function extractUTM(): Record<string, string> {
  // In native app, this would come from app state or deep link parameters
  // For now, return empty object - to be implemented with app-specific logic
  return {};
}

/**
 * Create device survey GUID
 */
export function createDeviceSurveyGuid(): string {
  return uuidv4();
}

/**
 * Create survey vehicle GUID
 */
export function createSurveyVehicleGuid(): string {
  return uuidv4();
}

/**
 * Validate survey data before API submission
 */
export function validateSurveyData(surveyData: BaseSurveyAnswers): string[] {
  const errors: string[] = [];
  
  if (!surveyData.device_survey_guid) {
    errors.push('device_survey_guid is required');
  }
  
  if (!surveyData.event_id) {
    errors.push('event_id is required');
  }
  
  if (!surveyData.start_time) {
    errors.push('start_time is required');
  }
  
  if (!surveyData.survey_date) {
    errors.push('survey_date is required');
  }
  
  return errors;
}

/**
 * Normalize survey data types for API submission
 */
export function normalizeSurveyData(surveyData: any): BaseSurveyAnswers {
  return {
    ...surveyData,
    start_time: surveyData.start_time instanceof Date 
      ? surveyData.start_time 
      : new Date(surveyData.start_time || Date.now()),
    end_time: surveyData.end_time instanceof Date 
      ? surveyData.end_time 
      : new Date(surveyData.end_time || Date.now()),
    survey_date: surveyData.survey_date instanceof Date 
      ? surveyData.survey_date 
      : new Date(surveyData.survey_date || Date.now()),
    abandoned: Number(surveyData.abandoned) || 0,
    device_survey_guid: surveyData.device_survey_guid || createDeviceSurveyGuid(),
    app_version: surveyData.app_version || 'native_app_1.0',
  };
}

/**
 * Check if survey response contains vehicle of interest data
 */
export function hasVehicleOfInterest(surveyData: BaseSurveyAnswers): boolean {
  return Array.isArray(surveyData.voi) && surveyData.voi.length > 0;
}

/**
 * Extract vehicle of interest IDs from survey data
 */
export function extractVehicleOfInterestIds(surveyData: BaseSurveyAnswers): string[] {
  if (!hasVehicleOfInterest(surveyData)) {
    return [];
  }
  
  return surveyData.voi!.filter(id => typeof id === 'string' && id.length > 0);
}