export type Brand = 'Ford' | 'Lincoln' | 'Other';
export type SurveyType = 'basic' | 'preTD' | 'postTD';

export interface EmailDefinition {
  template: string;
  daysBefore?: number;
  daysAfter?: number;
  sendNow?: boolean;
  sendNowAfterDays?: number;
  customData?: any;
  sendHour?: number;
}

export interface AutoCheckOutDefinition {
  minutesAfter: number;
  postEventId: string;
}

export interface SurveyTheme {
  cssVariables?: Record<string, string>;
  [key: string]: any;
}

export interface SurveyDefinition {
  pages?: any[];
  elements?: any[];
  [key: string]: any;
}

export interface MeridianBadgeScanConfig {
  vendor: string;
  config: Record<string, any>;
}

export interface MeridianCustomConfig {
  badgeScan?: MeridianBadgeScanConfig;
  activations?: string[];
  [key: string]: any;
}

export interface MeridianEvent {
  id: string;
  name: string;

  brand?: Brand;
  fordEventID?: number;
  lincolnEventID?: number;

  surveyType?: SurveyType;
  _preEventID?: string;

  startDate: Date;
  endDate: Date;

  surveyJSModel?: Record<string, unknown>;
  surveyJSTheme?: Record<string, unknown>;

  thanks?: string;
  showLanguageChooser?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  checkInDisplay?: Record<string, string>;

  survey_count_limit?: number;
  limit_reached_message?: string;

  tags?: string[];

  confirmationEmail?: EmailDefinition;
  reminderEmail?: EmailDefinition;
  thankYouEmail?: EmailDefinition;
  checkOutEmail?: EmailDefinition;
  autoCheckOut?: AutoCheckOutDefinition;
  customConfig?: MeridianCustomConfig | null;
}
