/**
 * WebView Bridge Message Type Definitions
 *
 * These types define the communication protocol between:
 * - React Native WebView (native-app)
 * - Survey WebView Bundle (web-app)
 */

/**
 * Messages sent FROM Native → TO WebView
 */
export type NativeToWebViewMessage =
  | {
      type: 'SURVEY_INIT';
      payload: {
        surveyJSON: any;
        theme?: any;
        locale?: string;
        eventId: string;
        responseId?: string;
        answers?: Record<string, any>;
        brand: 'Ford' | 'Lincoln' | 'Other';
      };
    }
  | {
      type: 'PLACES_AUTOCOMPLETE_RESULT';
      payload: {
        requestId: string;
        predictions: Array<{
          placeId: string;
          description: string;
          mainText: string;
          secondaryText: string;
        }>;
      };
    }
  | {
      type: 'PLACES_DETAILS_RESULT';
      payload: {
        requestId: string;
        details: {
          placeId: string;
          formattedAddress: string;
          addressComponents: Array<{
            longName: string;
            shortName: string;
            types: string[];
          }>;
          geometry?: {
            location: {
              lat: number;
              lng: number;
            };
          };
        };
      };
    }
  | {
      type: 'PLACES_ERROR';
      payload: {
        requestId: string;
        error: string;
      };
    };

/**
 * Messages sent FROM WebView → TO Native
 */
export type WebViewToNativeMessage =
  | {
      type: 'PAGE_LOADED';
      payload: {
        ready: boolean;
        timestamp: string;
        brand: 'Ford' | 'Lincoln' | 'Other';
      };
    }
  | {
      type: 'SURVEY_READY';
      payload: {
        pageCount: number;
        currentPage: number;
        surveyId: string;
      };
    }
  | {
      type: 'SURVEY_COMPLETE';
      payload: {
        answers: Record<string, any>;
        eventId: string;
        responseId?: string;
        completedAt: string;
        duration: number;
        device_survey_guid: string;
      };
    }
  | {
      type: 'SURVEY_ERROR';
      payload: {
        error: string;
        stack?: string;
      };
    }
  | {
      type: 'PAGE_CHANGED';
      payload: {
        pageNo: number;
        totalPages: number;
        pageName?: string;
      };
    }
  | {
      type: 'VALUE_CHANGED';
      payload: {
        name: string;
        value: any;
        question?: string;
      };
    }
  | {
      type: 'SAVE_PROGRESS';
      payload: {
        answers: Record<string, any>;
        currentPage: number;
        isCompleted: boolean;
        completedAt: string | null;
        eventId: string;
        responseId?: string;
      };
    }
  | {
      type: 'CONSOLE_LOG';
      payload: {
        message: string;
        data?: string;
      };
    }
  | {
      type: 'PLACES_AUTOCOMPLETE_REQUEST';
      payload: {
        requestId: string;
        input: string;
        sessionToken?: string;
      };
    }
  | {
      type: 'PLACES_DETAILS_REQUEST';
      payload: {
        requestId: string;
        placeId: string;
        sessionToken?: string;
      };
    };

/**
 * Survey configuration passed to WebView
 */
export interface SurveyConfig {
  surveyJSON: any;
  brand: 'Ford' | 'Lincoln' | 'Other';
  eventId: string;
  responseId?: string;
  answers?: Record<string, any>;
  theme?: any;
  locale?: string;
}

/**
 * Survey completion data returned from WebView
 */
export interface SurveyCompletionData {
  answers: Record<string, any>;
  eventId: string;
  responseId?: string;
  completedAt: string;
  duration: number;
  device_survey_guid: string;
}

/**
 * Progress save data for auto-save functionality
 */
export interface SurveyProgressData {
  answers: Record<string, any>;
  currentPage: number;
  isCompleted: boolean;
  completedAt: string | null;
  eventId: string;
  responseId?: string;
}
