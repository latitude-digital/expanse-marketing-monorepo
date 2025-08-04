/**
 * Bridge Types for Survey SPA Communication
 * 
 * Defines message types and interfaces for communication between
 * the bundled SurveyJS SPA and React Native WebView
 */

export interface SurveyMessage {
  type: 'INIT_SURVEY' | 'SURVEY_COMPLETE' | 'SURVEY_PROGRESS' | 'THEME_CHANGE' | 'SURVEY_ERROR' | 'PAGE_LOADED';
  payload: any;
}

export interface InitSurveyPayload {
  surveyJSON: any;
  brand: 'ford' | 'lincoln' | 'other';
  theme: 'light' | 'dark';
  eventId: string;
  kiosMode?: boolean;
}

export interface SurveyCompletePayload {
  surveyId: string;
  eventId: string;
  responses: Record<string, any>;
  completedAt: string;
  duration: number;
}

export interface SurveyProgressPayload {
  surveyId: string;
  eventId: string;
  currentPage: number;
  totalPages: number;
  progress: number; // 0-100
}

export interface ThemeChangePayload {
  brand: 'ford' | 'lincoln' | 'other';
  theme: 'light' | 'dark';
}

export interface SurveyErrorPayload {
  error: string;
  stack?: string;
  surveyId?: string;
  eventId?: string;
}

export interface PageLoadedPayload {
  url: string;
  ready: boolean;
}

// Window interface extensions for React Native WebView
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    nativeBridge?: {
      onThemeChange?: (brand: string, mode: string) => void;
      onSurveyInit?: (surveyJSON: any, brand: string, theme: string) => void;
    };
  }
}