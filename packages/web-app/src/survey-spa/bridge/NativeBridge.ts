/**
 * Native Bridge for Survey SPA
 * 
 * Handles communication between the bundled SurveyJS SPA and React Native WebView
 * Provides methods for sending messages and handling events from React Native
 */

import { 
  SurveyMessage, 
  InitSurveyPayload, 
  SurveyCompletePayload, 
  SurveyProgressPayload, 
  ThemeChangePayload,
  SurveyErrorPayload,
  PageLoadedPayload
} from './types';

export class NativeBridge {
  private surveyStartTime: number = 0;
  private isReady: boolean = false;

  constructor() {
    this.setupGlobalBridge();
  }

  /**
   * Set up global bridge interface for React Native
   */
  private setupGlobalBridge(): void {
    window.nativeBridge = {
      onThemeChange: this.handleThemeChange.bind(this),
      onSurveyInit: this.handleSurveyInit.bind(this),
    };
  }

  /**
   * Post message to React Native WebView
   */
  postMessage(message: SurveyMessage): void {
    if (window.ReactNativeWebView) {
      try {
        const messageString = JSON.stringify(message);
        window.ReactNativeWebView.postMessage(messageString);
        console.log('[NativeBridge] Message sent:', message.type);
      } catch (error) {
        console.error('[NativeBridge] Failed to post message:', error);
        this.onSurveyError(error as Error);
      }
    } else {
      console.warn('[NativeBridge] ReactNativeWebView not available');
    }
  }

  /**
   * Handle theme change from React Native
   */
  handleThemeChange(brand: string, mode: string): void {
    const themeClass = `${brand}_${mode}`;
    const fdNextElement = document.getElementById('fd-nxt');
    
    if (fdNextElement) {
      fdNextElement.className = themeClass;
      console.log('[NativeBridge] Theme changed to:', themeClass);
    }
  }

  /**
   * Handle survey initialization from React Native
   */
  handleSurveyInit(surveyJSON: any, brand: string, theme: string): void {
    this.surveyStartTime = Date.now();
    
    // Set theme class on fd-nxt wrapper
    this.handleThemeChange(brand, theme);
    
    // Dispatch custom event for survey initialization
    const event = new CustomEvent('surveyInit', {
      detail: {
        surveyJSON,
        brand,
        theme,
      }
    });
    
    document.dispatchEvent(event);
    console.log('[NativeBridge] Survey initialized with brand:', brand, 'theme:', theme);
  }

  /**
   * Handle survey completion
   */
  onSurveyComplete(surveyData: any): void {
    const duration = Date.now() - this.surveyStartTime;
    
    const payload: SurveyCompletePayload = {
      surveyId: `survey-${Date.now()}`,
      eventId: (surveyData as any)?.eventId || 'unknown',
      responses: surveyData,
      completedAt: new Date().toISOString(),
      duration,
    };

    this.postMessage({
      type: 'SURVEY_COMPLETE',
      payload,
    });
  }

  /**
   * Handle survey progress updates
   */
  onSurveyProgress(currentPage: number, totalPages: number, eventId: string): void {
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    
    const payload: SurveyProgressPayload = {
      surveyId: `survey-${this.surveyStartTime}`,
      eventId,
      currentPage,
      totalPages,
      progress,
    };

    this.postMessage({
      type: 'SURVEY_PROGRESS',
      payload,
    });
  }

  /**
   * Handle survey errors
   */
  onSurveyError(error: Error, surveyId?: string, eventId?: string): void {
    const payload: SurveyErrorPayload = {
      error: error.message,
      stack: error.stack,
      surveyId,
      eventId,
    };

    this.postMessage({
      type: 'SURVEY_ERROR',
      payload,
    });
  }

  /**
   * Signal page load completion
   */
  onPageLoaded(): void {
    this.isReady = true;
    
    const payload: PageLoadedPayload = {
      url: window.location.href,
      ready: true,
    };

    this.postMessage({
      type: 'PAGE_LOADED',
      payload,
    });
  }

  /**
   * Handle theme switching within SPA
   */
  changeTheme(brand: 'ford' | 'lincoln' | 'other', theme: 'light' | 'dark'): void {
    const payload: ThemeChangePayload = {
      brand,
      theme,
    };

    this.postMessage({
      type: 'THEME_CHANGE',
      payload,
    });

    // Also apply theme locally
    this.handleThemeChange(brand, theme);
  }

  /**
   * Check if bridge is ready
   */
  isReady(): boolean {
    return this.isReady && !!window.ReactNativeWebView;
  }
}

// Export singleton instance
export const nativeBridge = new NativeBridge();