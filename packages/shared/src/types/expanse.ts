/**
 * Expanse-level type definitions
 * Core types used across the entire Expanse platform
 */

// Deprecated: use MeridianEvent from './meridian-event'
export type { MeridianEvent as ExpanseEvent } from './meridian-event';

/**
 * Expanse Event - Core event structure
 */
// Legacy interfaces below can be removed if unused by consumers

/**
 * Survey Response - Core survey response structure
 */
export interface ExpanseSurvey {
  id?: string;
  eventId: string;
  device_survey_guid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  surveyData: Record<string, unknown>;
  completedAt?: Date;
  startTime?: Date;
  endTime?: Date;
  abandoned?: boolean;
  uploadStatus?: {
    ford?: 'pending' | 'success' | 'failed';
    lincoln?: 'pending' | 'success' | 'failed';
  };
  metadata?: Record<string, unknown>;
}

/**
 * User Profile
 */
export interface ExpanseUser {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'user' | 'viewer';
  organization?: string;
  permissions?: string[];
  createdAt?: Date;
  lastLogin?: Date;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: Date;
}

/**
 * Upload Status
 */
export interface UploadStatus {
  surveyId: string;
  eventId: string;
  brand: 'Ford' | 'Lincoln';
  status: 'pending' | 'uploading' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}
