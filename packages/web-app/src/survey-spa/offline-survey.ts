/**
 * Offline Survey Bundle
 * Self-contained survey implementation without React dependencies
 */

import { Model, FunctionFactory, surveyLocalization } from 'survey-core';
import Showdown from 'showdown';

// Simple UUID v4 generator (avoiding external dependency)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

type Brand = 'FORD' | 'LINCOLN' | 'OTHER';

// Initialize markdown converter
const converter = new Showdown.Converter({
  openLinksInNewWindow: true,
});

// Native bridge interface
interface NativeBridge {
  postMessage: (type: string, payload: any) => void;
  log: (message: string, data?: any) => void;
}

// Survey configuration
interface SurveyConfig {
  surveyJson: any;
  brand?: Brand;
  eventId: string;
  responseId?: string;
  answers?: Record<string, any>;
  theme?: any;
  locale?: string;
}

class OfflineSurvey {
  private survey: Model | null = null;
  private config: SurveyConfig | null = null;
  private bridge: NativeBridge;

  constructor() {
    // Setup native bridge
    this.bridge = {
      postMessage: (type: string, payload: any) => {
        if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type,
            payload
          }));
        }
      },
      log: (message: string, data?: any) => {
        console.log(`[OfflineSurvey] ${message}`, data || '');
        this.bridge.postMessage('CONSOLE_LOG', { 
          message, 
          data: data ? JSON.stringify(data) : undefined 
        });
      }
    };

    // Initialize
    this.initialize();
  }

  private initialize() {
    this.bridge.log('Initializing offline survey');
    
    // Configure localization
    if (!surveyLocalization.locales["en"]) {
      surveyLocalization.locales["en"] = {};
    }
    if (!surveyLocalization.locales["es"]) {
      surveyLocalization.locales["es"] = {};
    }
    if (!surveyLocalization.locales["fr"]) {
      surveyLocalization.locales["fr"] = {};
    }
    
    surveyLocalization.locales["en"]["optionalText"] = " (Optional)";
    surveyLocalization.locales["es"]["optionalText"] = " (Opcional)";
    surveyLocalization.locales["fr"]["optionalText"] = " (Optionnel)";

    // Register custom validators
    FunctionFactory.Instance.register("validateEmail", this.validateEmail, true);

    // Setup message handlers
    this.setupMessageHandlers();
    
    // Send ready signal
    this.bridge.postMessage('PAGE_LOADED', {
      ready: true,
      timestamp: new Date().toISOString()
    });
  }

  private validateEmail(values: any[], params: any[]): any {
    const email = values[0];
    if (!email) return true;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private setupMessageHandlers() {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = typeof event.data === 'string' ? 
          JSON.parse(event.data) : event.data;
        
        this.bridge.log('Received message', message);
        
        if (message.type === 'SURVEY_INIT' && message.payload) {
          this.createSurvey(message.payload);
        } else if (message.type === 'LOAD_ANSWERS' && this.survey) {
          this.survey.data = message.payload.answers;
        }
      } catch (error) {
        this.bridge.log('Error handling message', error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any);
    
    // Custom event listener
    document.addEventListener('surveyInit', (event: CustomEvent) => {
      this.bridge.log('surveyInit event received', event.detail);
      if (event.detail) {
        this.createSurvey(event.detail);
      }
    });
  }

  private async createSurvey(config: SurveyConfig) {
    this.bridge.log('Creating survey with config', config);
    this.config = config;
    
    try {
      // Apply brand-specific initialization
      if (config.brand === 'Ford' || config.brand === 'Lincoln') {
        await this.initializeBrandFeatures(config.brand);
      }
      
      // Preprocess required validation
      this.preprocessRequiredValidation(config.surveyJson);
      
      // Create survey model
      this.survey = new Model(config.surveyJson || {
        title: "Survey",
        pages: [{
          name: "page1",
          elements: [{
            type: "text",
            name: "question1",
            title: "Please enter your response"
          }]
        }]
      });
      
      // Apply theme
      if (config.theme) {
        this.survey.applyTheme(config.theme);
      } else if (config.brand === 'Ford' || config.brand === 'Lincoln') {
        this.applyDefaultBrandTheme(config.brand);
      }
      
      // Set locale
      if (config.locale) {
        this.survey.locale = config.locale;
      }
      
      // Apply existing answers
      if (config.answers) {
        this.survey.data = config.answers;
      }
      
      // Setup event handlers
      this.setupSurveyHandlers();
      
      // Apply markdown support
      this.survey.onTextMarkdown.add((survey, options) => {
        let str = converter.makeHtml(options.text);
        // Remove root paragraphs
        str = str.substring(3);
        str = str.substring(0, str.length - 4);
        options.html = str;
      });
      
      // Render survey
      this.survey.render("survey-root");
      
      // Set default values
      this.setDefaultValues();
      
      this.bridge.log('Survey created successfully');
      this.bridge.postMessage('SURVEY_READY', {
        pageCount: this.survey.visiblePageCount,
        currentPage: this.survey.currentPageNo,
        surveyId: config.eventId
      });
      
      // Expose API
      (window as any).surveyAPI = {
        nextPage: () => this.survey?.nextPage(),
        prevPage: () => this.survey?.prevPage(),
        complete: () => this.survey?.completeLastPage(),
        getData: () => this.survey?.data,
        setData: (data: any) => { if (this.survey) this.survey.data = data; },
        getProgress: () => this.survey?.progress,
        getCurrentPage: () => this.survey?.currentPageNo
      };
      
    } catch (error) {
      this.bridge.log('Error creating survey', error);
      this.bridge.postMessage('SURVEY_ERROR', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  }

  private async initializeBrandFeatures(brand: 'Ford' | 'Lincoln') {
    this.bridge.log(`Initializing ${brand} features`);
    
    // Register custom question types for Ford/Lincoln
    // Note: In the offline version, we'll use standard SurveyJS questions
    // Custom renderers would need to be reimplemented without React
    
    document.body.className = `brand-${brand.toLowerCase()}`;
  }

  private preprocessRequiredValidation(surveyJSON: any) {
    function processElements(elements: any[]) {
      if (!elements) return;
      
      elements.forEach(element => {
        if (element.type && element.isRequired === true) {
          if (!element.validators) {
            element.validators = [];
          }
          
          const hasRequiredValidator = element.validators.some((v: any) => 
            v.type === 'expression' && v.expression?.includes('notempty')
          );
          
          if (!hasRequiredValidator) {
            element.validators.push({
              type: "expression",
              expression: "{self} notempty", 
              text: element.requiredErrorText || "This field is required"
            });
          }
        }
        
        if (element.elements && Array.isArray(element.elements)) {
          processElements(element.elements);
        }
      });
    }
    
    if (surveyJSON.pages && Array.isArray(surveyJSON.pages)) {
      surveyJSON.pages.forEach((page: any) => {
        if (page.elements && Array.isArray(page.elements)) {
          processElements(page.elements);
        }
      });
    }
  }

  private applyDefaultBrandTheme(brand: 'Ford' | 'Lincoln') {
    if (!this.survey) return;
    
    const theme = {
      themeName: "defaultV2",
      colorPalette: "light",
      isPanelless: true,
      cssVariables: {
        "--sjs-general-backcolor": "#ffffff",
        "--sjs-general-backcolor-dim": "#ffffff",
        "--sjs-primary-backcolor": brand === 'Ford' ? "#003478" : "#000000",
        "--sjs-primary-backcolor-light": brand === 'Ford' ? "#1e88e5" : "#757575",
        "--sjs-primary-backcolor-dark": brand === 'Ford' ? "#003478" : "#000000",
        "--sjs-corner-radius": "4px",
        "--sjs-base-unit": "8px",
        "--sjs-font-size": "16px"
      }
    };
    
    this.survey.applyTheme(theme);
  }

  private setupSurveyHandlers() {
    if (!this.survey) return;
    
    // Page change handler
    this.survey.onCurrentPageChanged.add((sender, options) => {
      this.bridge.postMessage('PAGE_CHANGED', {
        pageNo: sender.currentPageNo,
        totalPages: sender.visiblePageCount,
        pageName: sender.currentPage?.name
      });
      
      this.saveProgress();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Value change handler
    this.survey.onValueChanged.add((sender, options) => {
      this.bridge.postMessage('VALUE_CHANGED', {
        name: options.name,
        value: options.value,
        question: options.question?.title
      });
    });

    // Validation handler
    this.survey.onValidatedErrorsChanged.add((sender) => {
      const currentPage = sender.currentPage;
      if (!currentPage) return;
      
      const errors = currentPage.questions.reduce((acc, q) => 
        acc + (q.errors ? q.errors.length : 0), 0
      );
      
      if (errors > 0) {
        setTimeout(() => {
          const errorElement = document.querySelector('.sd-question__erbox:not(:empty)');
          if (errorElement) {
            const rect = errorElement.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              window.scrollTo({ 
                top: window.pageYOffset + rect.top - 100, 
                behavior: 'smooth' 
              });
            }
          }
        }, 100);
      }
    });

    // Completion handler
    this.survey.onComplete.add((sender) => {
      const submission = {
        answers: sender.data,
        eventId: this.config?.eventId,
        responseId: this.config?.responseId,
        completedAt: new Date().toISOString(),
        device_survey_guid: sender.getValue('device_survey_guid') || uuidv4()
      };
      
      this.bridge.postMessage('SURVEY_COMPLETED', submission);
      this.bridge.log('Survey submitted', submission);
    });
  }

  private setDefaultValues() {
    if (!this.survey || !this.config) return;
    
    const defaults: Record<string, any> = {
      'start_time': new Date(),
      'survey_date': new Date(),
      'event_id': this.config.eventId,
      'app_version': 'offline_1.0',
      'device_survey_guid': uuidv4(),
      'abandoned': 0,
      '_language': window.navigator?.language,
      'device_id': window.navigator?.userAgent,
      '_screenWidth': window.screen?.width,
      '_offset': (new Date()).getTimezoneOffset(),
      '_timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
      this.survey!.setValue(key, value);
    });
  }

  private saveProgress() {
    if (!this.survey || !this.config) return;
    
    const progress = {
      answers: this.survey.data,
      currentPage: this.survey.currentPageNo,
      isCompleted: this.survey.isCompleted,
      completedAt: this.survey.isCompleted ? new Date().toISOString() : null,
      eventId: this.config.eventId,
      responseId: this.config.responseId
    };
    
    this.bridge.postMessage('SAVE_PROGRESS', progress);
    this.bridge.log('Progress saved', progress);
  }
}

// Initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new OfflineSurvey();
    });
  } else {
    new OfflineSurvey();
  }
}

// Security measures for kiosk mode
document.addEventListener('DOMContentLoaded', () => {
  // Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Disable refresh and dev tools
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || 
        (e.ctrlKey && e.key === 'r') || 
        (e.metaKey && e.key === 'r') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
    }
  });
  
  // Disable text selection except in inputs
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches('input, textarea, select')) {
      e.preventDefault();
    }
  });
});