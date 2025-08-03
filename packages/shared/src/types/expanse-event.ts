/**
 * ExpanseEvent interface and related types
 * Copied and adapted from web-app types.d.ts for native app use only
 * DO NOT modify original web-app types
 */

/**
 * Email automation definition
 * Copied from web-app types.d.ts EmailDefinition
 */
export interface EmailDefinition {
  template: string;
  daysBefore?: number;
  daysAfter?: number;
  sendNow?: boolean;
  sendNowAfterDays?: number;
  customData?: any;
  sendHour?: number;
}

/**
 * Auto check-out configuration
 * Copied from web-app types.d.ts AutoCheckOutDefinition
 */
export interface AutoCheckOutDefinition {
  minutesAfter: number;
  postEventId: string;
}

/**
 * Survey theme interface (simplified)
 * Represents SurveyJS theme configuration
 */
export interface SurveyTheme {
  cssVariables?: Record<string, string>;
  [key: string]: any;
}

/**
 * Survey definition interface (simplified)
 * Represents SurveyJS survey JSON structure
 */
export interface SurveyDefinition {
  pages?: any[];
  elements?: any[];
  [key: string]: any;
}

/**
 * Main ExpanseEvent interface
 * Copied and adapted from web-app types.d.ts for native app
 * Contains all properties needed for event management and API routing
 */
export interface ExpanseEvent {
  // Core identifiers
  id: string; // Firestore document ID
  
  // Brand configuration - determines API routing
  brand?: 'Ford' | 'Lincoln' | 'Other';
  fordEventID?: number;     // Ford API event identifier
  lincolnEventID?: number;  // Lincoln API event identifier
  
  // Survey workflow type
  surveyType?: 'basic' | 'preTD' | 'postTD';
  _preEventID?: string;     // Links to pre-event survey for postTD
  
  // Event scheduling
  preRegDate?: Date;
  startDate: Date;
  endDate: Date;
  
  // Content and configuration
  name: string;
  questions: SurveyDefinition;  // SurveyJS survey definition
  theme: SurveyTheme;          // Visual theme configuration
  thanks?: string;             // Completion message
  
  // Display behavior
  checkInDisplay?: Record<string, string>;
  disabled?: string;           // Disable message if event is disabled
  
  // Feature toggles
  showLanguageChooser?: boolean;  // Enable language selector
  showHeader?: boolean;           // Show brand-specific header
  showFooter?: boolean;           // Show brand-specific footer
  
  // Survey limits
  survey_count_limit?: number;
  limit_reached_message?: string;
  
  // Email automation (Firestore only)
  confirmationEmail?: EmailDefinition;
  reminderEmail?: EmailDefinition;
  thankYouEmail?: EmailDefinition;
  checkOutEmail?: EmailDefinition;
  autoCheckOut?: AutoCheckOutDefinition;
}

/**
 * Simplified event info for mobile list display
 * Contains essential fields for event cards and offline caching
 */
export interface EventListItem {
  id: string;
  name: string;
  brand?: 'Ford' | 'Lincoln' | 'Other';
  startDate: Date;
  endDate: Date;
  disabled?: string;
  surveyType?: 'basic' | 'preTD' | 'postTD';
  survey_count_limit?: number;
  showLanguageChooser?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

/**
 * Event cache metadata for offline storage
 * Tracks cache status and sync requirements
 */
export interface EventCacheMetadata {
  eventId: string;
  cachedAt: Date;
  lastSyncAt?: Date;
  version: number;
  needsSync: boolean;
  syncErrors?: string[];
}

/**
 * Complete cached event data
 * Combines event data with cache metadata
 */
export interface CachedEvent {
  event: ExpanseEvent;
  metadata: EventCacheMetadata;
}

/**
 * Brand type for type safety and routing
 */
export type Brand = 'Ford' | 'Lincoln' | 'Other';

/**
 * Survey type for workflow management
 */
export type SurveyType = 'basic' | 'preTD' | 'postTD';