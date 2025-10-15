type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

type Color = RGB | RGBA | HEX;

type LatitudeAPIResponse = {
  success: boolean;
  message: string;
  surveyID?: string;
  event?: any;
  error?: any;
};

type EmailDefinition = {
  template: string;
  daysBefore?: number;
  daysAfter?: number;
  sendNow?: boolean;
  sendNowAfterDays?: number;
  customData?: any;
  sendHour?: number;
};

type AutoCheckOutDefinition = {
  minutesAfter: number;
  postEventId: string;
};

type ExpanseEvent = {
  id: string;
  brand?: 'Ford' | 'Lincoln' | 'Other';
  fordEventID?: number;
  lincolnEventID?: number;
  surveyType?: "basic" | "preTD" | "postTD" | null;
  _preEventID?: string | null;
  checkInDisplay?: Record<string, string>;
  confirmationEmail?: EmailDefinition | null;
  disabled?: string;
  preRegDate?: Date | null;
  startDate: Date;
  endDate: Date;
  name: string;
  questions: ISurvey;  // Legacy JSON string field
  surveyJSModel?: ISurvey;  // New map field
  reminderEmail?: EmailDefinition | null;
  thankYouEmail?: EmailDefinition | null;
  autoCheckOut?: AutoCheckOutDefinition | null;
  checkOutEmail?: EmailDefinition | null;
  thanks?: string;
  theme: IExtendedTheme | ITheme;  // Legacy JSON string field
  surveyJSTheme?: IExtendedTheme | ITheme;  // New map field
  survey_count_limit?: number | null;
  limit_reached_message?: string | null;
  showLanguageChooser?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  tags?: string[];  // Tags for categorizing events
  customConfig?: Record<string, any> | null;
};

// AUTH-009: CloudFront integration types
type CloudFrontCookies = {
  'CloudFront-Key-Pair-Id'?: string;
  'CloudFront-Policy'?: string;
  'CloudFront-Signature'?: string;
};

type CloudFrontTestHelpers = {
  test: () => Promise<any>;
  status: () => any;
  refresh: () => Promise<any>;
  log: () => void;
  cookies: () => CloudFrontCookies;
};

// Extend Window interface for runtime environment and testing utilities
declare global {
  interface Window {
    _env_?: any;
    CloudFrontTest?: CloudFrontTestHelpers;
  }
}
