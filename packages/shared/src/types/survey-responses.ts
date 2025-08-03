/**
 * Shared TypeScript interfaces for survey responses
 * Copied and adapted from web-app for native app use only
 * DO NOT modify original web-app interfaces
 */

/**
 * Base survey answer fields common to all platforms
 * Contains core Firestore fields and metadata
 */
export interface BaseSurveyAnswers {
  // Core identifiers
  device_survey_guid: string;
  event_id: string;
  
  // Timestamps
  start_time: Date | string;
  end_time?: Date | string;
  survey_date: Date | string;
  
  // Survey metadata
  survey_type?: string;
  app_version: string;
  abandoned: number;
  
  // UTM and tracking
  _utm?: any;
  _referrer?: string;
  _language?: string;
  device_id?: string;
  _screenWidth?: number;
  _offset?: number;
  _timeZone?: string;
  
  // Pre/post survey linking
  _preSurveyID?: string | null;
  pre_drive_survey_guid?: string | null;
  
  // Status tracking (Firestore only)
  _checkedIn?: any;
  _checkedOut?: any;
  _claimed?: any;
  _used?: any;
  _email?: any;
  _sms?: any;
  _exported?: any;
  
  // Basic respondent info
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  
  // Email template data
  microsite_email_template?: any;
  
  // Legal documents
  signature?: string;
  minor_signature?: string;
  
  // Vehicle of interest (array of IDs)
  voi?: string[];
}

/**
 * Ford API survey payload structure
 * Matches Ford SURVEY_UPLOAD_V11 endpoint requirements
 * Copied from fordSurvey.ts FordSurvey interface
 */
export interface FordSurveyAnswers {
  // Core identifiers
  event_id: number | string | null;
  survey_date: string | Date | null;
  survey_type: string | null;
  device_survey_guid: string | null;
  pre_drive_survey_guid: string | null;
  device_id: string | null;
  app_version: string | null;
  abandoned: number;
  start_time: string | Date | null;
  end_time: string | Date | null;
  
  // Personal information
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  email_opt_in: number;
  
  // Vehicle information
  vehicle_driven_most_model_id: number | string | null;
  vehicle_driven_most_make_id: number | string | null;
  vehicle_driven_most_year: number | string | null;
  
  // Survey responses
  in_market_timing: string | null;
  accepts_sms: number;
  how_likely_acquire: string | null;
  how_likely_purchasing: string | null;
  how_likely_purchasing_pre: string | null;
  how_likely_purchasing_post: string | null;
  how_likely_recommend: string | null;
  how_likely_recommend_post: string | null;
  followup_survey_opt_in: string | null;
  
  // Legal
  signature: string | null;
  minor_signature: string | null;
  
  // Demographics
  birth_year: string | number | null;
  gender: string | null;
  age_bracket: string | null;
  
  // Brand perception
  impression_pre: string | null;
  impression_ev: string | null;
  can_trust: string | null;
  impact_overall_opinion: string | null;
  
  // Data containers
  optins: any[];
  custom_data: string | null; // JSON string
}

/**
 * Lincoln API survey payload structure
 * Uses same structure as Ford but with Lincoln-specific event ID
 * Matches Lincoln API endpoints requirements
 */
export interface LincolnSurveyAnswers extends FordSurveyAnswers {
  // Lincoln uses same fields as Ford but different event_id routing
  // The mapping logic handles lincolnEventID vs fordEventID
}

/**
 * Vehicle of Interest data model for Ford API
 * Used for VEHICLES_INSERT endpoint
 */
export interface FordVehicleOfInterest {
  vehicle_id: string;
  device_survey_guid: string;
  survey_vehicle_guid: string;
}

/**
 * Vehicle of Interest data model for Lincoln API
 * Used for LINCOLN_VEHICLES_INTERESTED endpoint
 */
export interface LincolnVehicleOfInterest {
  event_id: number | string;
  device_survey_guid: string;
  survey_date: string;
  vehicle_id: string;
  app_version: string;
  abandoned: boolean;
  custom_data: {
    survey_type: string;
  };
}

/**
 * Vehicle Driven data model for Lincoln API
 * Used for LINCOLN_VEHICLES_DRIVEN endpoint
 */
export interface LincolnVehicleDriven {
  event_id: number | string;
  device_survey_guid: string;
  survey_date: string;
  make_id: number | string | null;
  model_id: number | string | null;
  year: number | string | null;
  app_version: string;
  abandoned: boolean;
  custom_data: {
    survey_type: string;
  };
}

/**
 * Brand-specific survey data unions for type safety
 */
export type BrandSurveyAnswers = FordSurveyAnswers | LincolnSurveyAnswers;

/**
 * Vehicle data unions for type safety
 */
export type VehicleOfInterest = FordVehicleOfInterest | LincolnVehicleOfInterest;
export type VehicleDriven = LincolnVehicleDriven; // Only Lincoln has this endpoint