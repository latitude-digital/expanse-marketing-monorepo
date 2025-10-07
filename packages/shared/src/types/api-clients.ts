/**
 * API client type definitions
 * Defines interfaces for different API endpoints and configurations
 */

import { 
  FordSurveyAnswers, 
  LincolnSurveyAnswers, 
  FordVehicleOfInterest, 
  LincolnVehicleOfInterest, 
  LincolnVehicleDriven 
} from './survey-responses';
import { ExpanseEvent } from './expanse-event';

/**
 * Environment configuration for API endpoints
 */
export type Environment = 'production' | 'staging' | 'local';

/**
 * API endpoint configuration
 * Based on web-app api.ts ENDPOINTS interface
 */
export interface ApiEndpoints {
  // Ford API endpoints
  SURVEY_UPLOAD_V11: string;
  VEHICLES_INSERT: string;
  
  // Lincoln API endpoints  
  LINCOLN_SURVEY_UPLOAD: string;
  LINCOLN_VEHICLES_INTERESTED: string;
  LINCOLN_VEHICLES_DRIVEN: string;
  
  // Firebase Functions
  GET_SURVEY: string;
  SAVE_SURVEY: string;
  VALIDATE_EMAIL: string;
  CHECK_IN_OUT_SURVEY: string;
  
  // Event management
  EVENTS_CHECK: string;
  EVENTS_QR: string;
}

/**
 * API client configuration
 * Contains base URLs, headers, and authentication
 */
export interface ApiClientConfig {
  environment: Environment;
  baseUrl: string;
  firebaseProjectId?: string;
  
  // Authentication headers
  fordAuthHeader: string;     // '989ae554-08ca-4142-862c-0058407d2769'
  lincolnAuthHeader: string;  // '91827364'
  
  // Request configuration
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Ford API payload structures
 */
export interface FordSurveyPayload {
  surveyCollection: FordSurveyAnswers[];
}

export interface FordVOIPayload extends Array<FordVehicleOfInterest> {}

/**
 * Lincoln API payload structures
 */
export interface LincolnSurveyPayload extends Array<LincolnSurveyAnswers> {}

export interface LincolnVOIPayload extends Array<LincolnVehicleOfInterest> {}

export interface LincolnDrivenPayload extends Array<LincolnVehicleDriven> {}

/**
 * Firestore API payloads
 */
export interface FirestoreSaveSurveyPayload {
  eventID: string;
  survey: Record<string, any>;
}

export interface FirestoreGetSurveyPayload {
  eventID: string;
  preSurveyID?: string;
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface GetSurveyResponse {
  success: boolean;
  event: ExpanseEvent;
  preSurvey?: {
    device_survey_guid?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  message?: string;
}

/**
 * Network request configuration
 */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

/**
 * Sync queue item for offline operations
 */
export interface SyncQueueItem {
  id: string;
  type: 'firestore' | 'ford' | 'lincoln';
  endpoint: string;
  payload: any;
  headers: Record<string, string>;
  createdAt: Date;
  attempts: number;
  lastAttemptAt?: Date;
  errors: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Sync status for progress tracking
 */
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueLength: number;
  lastSyncAt?: Date;
  errors: string[];
  successCount: number;
  failureCount: number;
}

/**
 * API client interface for dependency injection
 */
export interface IApiClient {
  // Configuration
  configure(config: ApiClientConfig): void;
  
  // Survey operations
  saveSurveyToFirestore(payload: FirestoreSaveSurveyPayload): Promise<ApiResponse>;
  saveSurveyToFord(payload: FordSurveyPayload): Promise<ApiResponse>;
  saveSurveyToLincoln(payload: LincolnSurveyPayload): Promise<ApiResponse>;
  
  // Vehicle operations
  saveFordVOI(payload: FordVOIPayload): Promise<ApiResponse>;
  saveLincolnVOI(payload: LincolnVOIPayload): Promise<ApiResponse>;
  saveLincolnDriven(payload: LincolnDrivenPayload): Promise<ApiResponse>;
  
  // Event operations
  getSurvey(payload: FirestoreGetSurveyPayload): Promise<GetSurveyResponse>;
  
  // Network status
  checkConnectivity(): Promise<boolean>;
}

/**
 * Sync manager interface for queue operations
 */
export interface ISyncManager {
  // Queue management
  addToQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts' | 'errors'>): Promise<void>;
  processQueue(): Promise<void>;
  clearQueue(): Promise<void>;
  
  // Status
  getStatus(): Promise<SyncStatus>;
  
  // Event listeners
  onStatusChange(callback: (status: SyncStatus) => void): void;
}