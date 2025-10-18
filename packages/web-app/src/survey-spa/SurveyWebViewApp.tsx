import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Model, FunctionFactory, surveyLocalization, ComponentCollection, ElementFactory } from 'survey-core';
import { Survey, ReactQuestionFactory } from 'survey-react-ui';
import Showdown from 'showdown';
import { v4 as uuidv4 } from 'uuid';
import type { SurveyConfig, WebViewToNativeMessage, NativeToWebViewMessage } from '@meridian-event-tech/shared/types';
import type { Brand } from '@meridian-event-tech/shared/types';

// Import FDS initializer and survey preparation (same as Survey.tsx)
import { initializeFDSForBrand } from '../helpers/fdsInitializer';
import GlobalHeader from '../components/GlobalHeader';
// import GlobalFooter from '../components/GlobalFooter';
import { FordSurveyNavigation } from '../components/FordSurveyNavigation';
import { getBrandTheme, normalizeBrand } from '../utils/brandUtils';
import { prepareForSurvey } from '../helpers/surveyTemplatesAll';

// Import all FDS renderer classes for explicit registration
import { FDSTextRenderer } from '../surveysjs_renderers/FDSRenderers/FDSText';
import { FDSRadioRenderer } from '../surveysjs_renderers/FDSRenderers/FDSRadio';
import { FDSCheckboxRenderer } from '../surveysjs_renderers/FDSRenderers/FDSCheckbox';
import { FDSDropdownRenderer } from '../surveysjs_renderers/FDSRenderers/FDSDropdown';
import { FDSTagboxRenderer } from '../surveysjs_renderers/FDSRenderers/FDSTagbox';
import { FDSTextAreaRenderer } from '../surveysjs_renderers/FDSRenderers/FDSTextArea';
import { FDSToggleRenderer } from '../surveysjs_renderers/FDSRenderers/FDSToggle';
import { FDSRatingRenderer } from '../surveysjs_renderers/FDSRenderers/FDSRating';
import { FDSPanelRenderer } from '../surveysjs_renderers/FDSRenderers/FDSPanel';

/**
 * Native bridge interface for WebView ↔ React Native communication
 */
interface NativeBridge {
  postMessage: (type: WebViewToNativeMessage['type'], payload: any) => void;
  log: (message: string, data?: any) => void;
}

/**
 * Email validation function for SurveyJS
 */
function validateEmail(values: any[]): boolean {
  const email = values[0];
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Register email validation globally
FunctionFactory.Instance.register('validateEmail', validateEmail, true);

/**
 * Initialize SurveyJS localization
 */
function initializeLocalization() {
  if (!surveyLocalization.locales['en']) {
    surveyLocalization.locales['en'] = {};
  }
  if (!surveyLocalization.locales['es']) {
    surveyLocalization.locales['es'] = {};
  }
  if (!surveyLocalization.locales['fr']) {
    surveyLocalization.locales['fr'] = {};
  }

  surveyLocalization.locales['en']['optionalText'] = ' (Optional)';
  surveyLocalization.locales['es']['optionalText'] = ' (Opcional)';
  surveyLocalization.locales['fr']['optionalText'] = ' (Optionnel)';
}

/**
 * Explicitly register FDS renderers after React/SurveyJS initialization
 * This solves timing issues with IIFE bundle format where module-level registration may not execute
 */
function registerFDSRenderers(bridgeRef: React.MutableRefObject<NativeBridge | null>) {
  // Removed logging to prevent postMessage from triggering re-renders

  try {
    // Register text renderer
    ReactQuestionFactory.Instance.registerQuestion(
      "text",
      (props) => React.createElement(FDSTextRenderer, props)
    );

    // Register radio renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "radiogroup",
      (props) => React.createElement(FDSRadioRenderer, props),
      "customtype",
      true // useAsDefault: true
    );

    // Register checkbox renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "checkbox",
      (props) => React.createElement(FDSCheckboxRenderer, props),
      "customtype",
      true
    );

    // Register dropdown renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "dropdown",
      (props) => React.createElement(FDSDropdownRenderer, props),
      "customtype",
      true
    );

    // Register tagbox renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "tagbox",
      (props) => React.createElement(FDSTagboxRenderer, props),
      "customtype",
      true
    );

    // Register comment/textarea renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "comment",
      (props) => React.createElement(FDSTextAreaRenderer, props),
      "customtype",
      true
    );

    // Register boolean/toggle renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "boolean",
      (props) => React.createElement(FDSToggleRenderer, props),
      "customtype",
      true
    );

    // Register rating renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "rating",
      (props) => React.createElement(FDSRatingRenderer, props),
      "customtype",
      true
    );

    // Register panel renderer with useAsDefault
    ReactQuestionFactory.Instance.registerQuestion(
      "panel",
      (props) => React.createElement(FDSPanelRenderer, props),
      "customtype",
      true
    );

    // Removed logging to prevent postMessage from triggering re-renders

  } catch (error) {
    // Log only critical errors (catch block won't trigger re-renders unless error occurs)
    console.error('ERROR registering FDS renderers', error);
  }
}

/**
 * Main Survey WebView App Component
 *
 * This component handles:
 * - WebView bridge communication with React Native
 * - Survey initialization from config
 * - Survey rendering with brand-specific customizations
 * - Survey completion and progress tracking
 *
 * Brand is determined from the SURVEY_INIT message (config.brand)
 */
export const SurveyWebViewApp: React.FC = () => {
  const [survey, setSurvey] = useState<Model | null>(null);
  const [config, setConfig] = useState<SurveyConfig | null>(null);
  const [supportedLocales, setSupportedLocales] = useState<string[]>(['en']);
  const [currentLocale, setCurrentLocale] = useState<string>('en');
  const bridgeRef = useRef<NativeBridge | null>(null);
  const converterRef = useRef<Showdown.Converter | null>(null);

  /**
   * Initialize the native bridge
   */
  useEffect(() => {
    // Initialize markdown converter
    converterRef.current = new Showdown.Converter({
      openLinksInNewWindow: true,
    });

    // Setup native bridge
    bridgeRef.current = {
      postMessage: (type, payload) => {
        if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(
            JSON.stringify({
              type,
              payload,
            })
          );
        }
      },
      log: (message, data) => {
        console.log(`[SurveyWebView] ${message}`, data || '');
        bridgeRef.current?.postMessage('CONSOLE_LOG', {
          message,
          data: data ? JSON.stringify(data) : undefined,
        });
      },
    };

    // Initialize localization
    initializeLocalization();

    // Apply global styling class used by Ford/Lincoln survey CSS
    document.body.classList.add('survey-taking-mode');

    // Send page loaded signal
    bridgeRef.current.log('Survey bundle loaded');
    bridgeRef.current.postMessage('PAGE_LOADED', {
      ready: true,
      timestamp: new Date().toISOString(),
      brand: 'Other', // Placeholder until SURVEY_INIT provides actual brand
    });

    return () => {
      document.body.classList.remove('survey-taking-mode');
    };
  }, []);

  /**
   * Listen for messages from React Native
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message: NativeToWebViewMessage =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        bridgeRef.current?.log('Received message from native', message);

        if (message.type === 'SURVEY_INIT' && message.payload) {
          setConfig(message.payload as SurveyConfig);
        }
      } catch (error) {
        bridgeRef.current?.log('Error handling message', error);
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as any);
    };
  }, []);

  /**
   * Preprocess required validation
   * Converts isRequired: true into working expression validators
   */
  const preprocessRequiredValidation = useCallback((surveyJSON: any) => {
    const processElements = (elements: any[]) => {
      if (!elements) return;

      elements.forEach((element: any) => {
        if (element.type && element.isRequired === true) {
          if (!element.validators) {
            element.validators = [];
          }

          const hasRequiredValidator = element.validators.some(
            (v: any) => v.type === 'expression' && v.expression?.includes('notempty')
          );

          if (!hasRequiredValidator) {
            element.validators.push({
              type: 'expression',
              expression: '{self} notempty',
              text: element.requiredErrorText || 'This field is required',
            });
          }
        }

        // Recursively process nested elements
        if (element.elements && Array.isArray(element.elements)) {
          processElements(element.elements);
        }
      });
    };

    if (surveyJSON.pages && Array.isArray(surveyJSON.pages)) {
      surveyJSON.pages.forEach((page: any) => {
        if (page.elements && Array.isArray(page.elements)) {
          processElements(page.elements);
        }
      });
    }
  }, []);

  /**
   * Apply brand-specific theme, mirroring the web Survey screen behaviour
   */
  const applyBrandTheme = useCallback(
    (surveyToUpdate: Model, brandName: Brand, themeFromConfig?: any) => {
      if (!surveyToUpdate) return;

      const isFordOrLincoln = brandName === 'Ford' || brandName === 'Lincoln';

      if (themeFromConfig && themeFromConfig.cssVariables) {
        if (isFordOrLincoln) {
          const updatedTheme = {
            themeName: 'default',
            colorPalette: 'light',
            isPanelless: true,
            backgroundImage: '',
            backgroundImageFit: 'cover',
            backgroundImageAttachment: 'scroll',
            backgroundOpacity: 1,
            cssVariables: {
              '--sjs-general-backcolor-dim': '#ffffff',
              ...themeFromConfig.cssVariables,
            },
            ...themeFromConfig,
          };
          surveyToUpdate.applyTheme(updatedTheme as any);
        } else {
          surveyToUpdate.applyTheme(themeFromConfig as any);
        }
        return;
      }

      if (isFordOrLincoln) {
        const defaultFordLincolnTheme = {
          themeName: 'default',
          colorPalette: 'light',
          isPanelless: true,
          backgroundImage: '',
          backgroundImageFit: 'cover',
          backgroundImageAttachment: 'scroll',
          backgroundOpacity: 1,
          cssVariables: {
            '--sjs-general-backcolor': '#ffffff',
            '--sjs-general-backcolor-dim': '#ffffff',
            '--sjs-primary-backcolor': 'var(--colors-ford-fill-interactive)',
            '--sjs-primary-backcolor-light': 'var(--colors-ford-fill-interactive)',
            '--sjs-primary-backcolor-dark': 'var(--colors-ford-fill-interactive)',
            '--sjs-corner-radius': '4px',
            '--sjs-base-unit': '8px',
            '--sjs-font-size': '16px',
          },
        };
        surveyToUpdate.applyTheme(defaultFordLincolnTheme as any);
      }
    },
    []
  );

  const prepareSurveyJsonAndTheme = useCallback(
    (incomingSurveyJson: any, incomingTheme: any) => {
      const surveyJSON = incomingSurveyJson
        ? JSON.parse(JSON.stringify(incomingSurveyJson))
        : {};
      const theme = incomingTheme
        ? JSON.parse(JSON.stringify(incomingTheme))
        : undefined;

      const eventTheme = theme || {};

      if (eventTheme.header && !surveyJSON.headerView) {
        const hasHeaderContent = surveyJSON.title || surveyJSON.description;
        if (hasHeaderContent) {
          surveyJSON.headerView = 'advanced';
          if (!surveyJSON.description && surveyJSON.title) {
            surveyJSON.description = ' ';
          }
        }
      }

      const hasRealTitle =
        surveyJSON.title && String(surveyJSON.title).trim().length > 0;
      const hasRealDescription =
        surveyJSON.description &&
        String(surveyJSON.description).trim().length > 0;

      if (!hasRealTitle && !hasRealDescription && surveyJSON.headerView) {
        delete surveyJSON.headerView;
      }

      return { surveyJSON, theme: eventTheme };
    },
    []
  );

  /**
   * Set default survey values
   */
  const setDefaultValues = useCallback((survey: Model, eventId: string) => {
    const defaults: Record<string, any> = {
      start_time: new Date(),
      survey_date: new Date(),
      event_id: eventId,
      app_version: 'webview_1.0',
      device_survey_guid: uuidv4(),
      abandoned: 0,
      _language: window.navigator?.language,
      device_id: window.navigator?.userAgent,
      _screenWidth: window.screen?.width,
      _offset: new Date().getTimezoneOffset(),
      _timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    Object.entries(defaults).forEach(([key, value]) => {
      survey.setValue(key, value);
    });
  }, []);

  /**
   * Save progress to React Native
   */
  const saveProgress = useCallback(
    (survey: Model) => {
      if (!config) return;

      const progress = {
        answers: survey.data,
        currentPage: survey.currentPageNo,
        isCompleted: survey.isCompleted,
        completedAt: survey.isCompleted ? new Date().toISOString() : null,
        eventId: config.eventId,
        responseId: config.responseId,
      };

      bridgeRef.current?.postMessage('SAVE_PROGRESS', progress);
      bridgeRef.current?.log('Progress saved', progress);
    },
    [config]
  );

  /**
   * Create and configure the survey
   */
  useEffect(() => {
    if (!config) return;

    const localeCandidates = new Set<string>();
    if (config.locale) localeCandidates.add(config.locale);
    if (config.surveyJSON?.locale) localeCandidates.add(config.surveyJSON.locale);
    if (Array.isArray(config.surveyJSON?.supportedLocales)) {
      config.surveyJSON.supportedLocales.forEach((loc: string) => {
        if (typeof loc === 'string' && loc.trim().length > 0) {
          localeCandidates.add(loc);
        }
      });
    }
    if (config.surveyJSON?.localization && typeof config.surveyJSON.localization === 'object') {
      Object.keys(config.surveyJSON.localization).forEach((loc) => {
        if (loc && loc.trim().length > 0) {
          localeCandidates.add(loc);
        }
      });
    }
    if (localeCandidates.size === 0) {
      localeCandidates.add('en');
    }
    const derivedLocales = Array.from(localeCandidates);
    setSupportedLocales(derivedLocales);
    setCurrentLocale(config.locale || derivedLocales[0] || 'en');

    const { surveyJSON: preparedSurveyJSON, theme: preparedTheme } =
      prepareSurveyJsonAndTheme(config.surveyJSON || {}, config.theme);

    // Use async function to handle await for initializeFDSForBrand
    const initializeSurvey = async () => {

    bridgeRef.current?.log('Creating survey with config', config);

    try {
      const brandForFDS = normalizeBrand(config.brand) as Brand;

      // Initialize FDS and brand-specific questions (same as Survey.tsx)
      bridgeRef.current?.log(
        `Initializing FDS for brand: ${config.brand} (normalized: ${brandForFDS})`
      );

      try {
        await initializeFDSForBrand(brandForFDS);
        bridgeRef.current?.log('FDS initialization complete');
      } catch (error) {
        bridgeRef.current?.log('ERROR initializing FDS', error);
        throw error;
      }

      // Explicitly register FDS renderers to solve timing issues with IIFE bundle
      registerFDSRenderers(bridgeRef);

      // Log all registered custom components (ComponentCollection)
      const registeredComponents = ComponentCollection.Instance.items.map(item => item.name);
      bridgeRef.current?.log(`Registered components (${registeredComponents.length}):`, registeredComponents.join(', '));

      // Log all registered elements (ElementFactory) - this is where question types are registered!
      const registeredElements = ElementFactory.Instance.getAllTypes();
      bridgeRef.current?.log(`Registered elements in ElementFactory (${registeredElements.length}):`, registeredElements.join(', '));

      // Log which question types are in the survey JSON
      const questionTypesInSurvey: string[] = [];
      if (config.surveyJSON?.pages) {
        config.surveyJSON.pages.forEach((page: any) => {
          if (page.elements) {
            page.elements.forEach((element: any) => {
              if (element.type) {
                questionTypesInSurvey.push(element.type);
              }
            });
          }
        });
      }
      bridgeRef.current?.log('Question types in survey:', questionTypesInSurvey.join(', '));

      // Check which types are missing from ElementFactory
      const missingTypes = questionTypesInSurvey.filter(type => !registeredElements.includes(type));
      if (missingTypes.length > 0) {
        bridgeRef.current?.log('MISSING TYPES in ElementFactory:', missingTypes.join(', '));

        // WORKAROUND: Force-initialize composite questions by creating dummy instances
        // This triggers lazy registration of composite question types in SurveyJS
        bridgeRef.current?.log('Attempting to force-initialize missing types...');
        missingTypes.forEach(typeName => {
          const componentDef = ComponentCollection.Instance.getCustomQuestionByName(typeName);
          if (componentDef) {
            try {
              // Create a minimal test survey JSON with this question type
              const testJSON = {
                pages: [{
                  elements: [{
                    type: typeName,
                    name: `test_${typeName}`
                  }]
                }]
              };
              // Try to create a Model with this type - this forces initialization
              try {
                new Model(testJSON);
                bridgeRef.current?.log(`Successfully initialized type: ${typeName}`);
              } catch (e) {
                bridgeRef.current?.log(`Type ${typeName} still not recognized after initialization attempt`);
              }
            } catch (err) {
              bridgeRef.current?.log(`Failed to force-init ${typeName}:`, err);
            }
          }
        });

        // Re-check ElementFactory after force initialization
        const updatedElements = ElementFactory.Instance.getAllTypes();
        bridgeRef.current?.log(`ElementFactory after force-init (${updatedElements.length}):`, updatedElements.join(', '));
      }

      // Preprocess required validation
      preprocessRequiredValidation(preparedSurveyJSON);

      // Set defaults before creating Model
      if (!preparedSurveyJSON.widthMode) {
        preparedSurveyJSON.widthMode = "responsive";
      }
      // IMPORTANT: Save hidden field values - needed for composite panels
      preparedSurveyJSON.clearInvisibleValues = false;

      // Create survey model with detailed error handling
      let newSurvey: Model;
      try {
        bridgeRef.current?.log('Creating Model...');
        newSurvey = new Model(
          preparedSurveyJSON || {
            title: 'Survey',
            pages: [
              {
                name: 'page1',
                elements: [
                  {
                    type: 'text',
                    name: 'question1',
                    title: 'Please enter your response',
                  },
                ],
              },
            ],
          }
        );
        bridgeRef.current?.log('Model created successfully');
      } catch (modelError: any) {
        bridgeRef.current?.log('ERROR creating Model - Raw error:', modelError);
        bridgeRef.current?.log('ERROR creating Model - Error type:', typeof modelError);
        bridgeRef.current?.log('ERROR creating Model - Error string:', String(modelError));
        bridgeRef.current?.log('ERROR creating Model - Error keys:', Object.keys(modelError || {}));
        throw modelError;
      }

      // Apply theme
      const brandForSurvey = normalizeBrand(config.brand) as Brand;
      applyBrandTheme(newSurvey, brandForSurvey, preparedTheme);

      if (brandForSurvey === 'Ford' || brandForSurvey === 'Lincoln') {
        newSurvey.showNavigationButtons = false;
      }

      // Prepare survey (same as Survey.tsx)
      prepareForSurvey(newSurvey, config.brand);

      // Apply existing answers
      if (config.answers) {
        newSurvey.data = config.answers;
      }

      // Setup markdown support
      newSurvey.onTextMarkdown.add((survey, options) => {
        if (converterRef.current) {
          let str = converterRef.current.makeHtml(options.text);
          // Remove root paragraphs
          str = str.substring(3);
          str = str.substring(0, str.length - 4);
          options.html = str;
        }
      });

      // Page change handler
      newSurvey.onCurrentPageChanged.add((sender) => {
        bridgeRef.current?.postMessage('PAGE_CHANGED', {
          pageNo: sender.currentPageNo,
          totalPages: sender.visiblePageCount,
          pageName: sender.currentPage?.name,
        });

        saveProgress(sender);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Value change handler
      newSurvey.onValueChanged.add((sender, options) => {
        bridgeRef.current?.postMessage('VALUE_CHANGED', {
          name: options.name,
          value: options.value,
          question: options.question?.title,
        });
      });

      // Validation error handler - scroll to first error
      // Check if onValidatedErrorsChanged exists (not available in all survey-core versions)
      if (newSurvey.onValidatedErrorsChanged) {
        newSurvey.onValidatedErrorsChanged.add((sender) => {
          const currentPage = sender.currentPage;
          if (!currentPage) return;

          const errors = currentPage.questions.reduce((acc, q) => acc + (q.errors ? q.errors.length : 0), 0);

          if (errors > 0) {
            setTimeout(() => {
              const errorElement = document.querySelector('.sd-question__erbox:not(:empty)');
              if (errorElement) {
                const rect = errorElement.getBoundingClientRect();
                if (rect.top < 0 || rect.bottom > window.innerHeight) {
                  window.scrollTo({
                    top: window.pageYOffset + rect.top - 100,
                    behavior: 'smooth',
                  });
                }
              }
            }, 100);
          }
        });
      }

      // Completion handler
      newSurvey.onComplete.add((sender) => {
        // Enrich survey data with tracking properties and end_time
        const enrichedAnswers = {
          ...sender.data,
          end_time: new Date(),
          _preSurveyID: sender.data._preSurveyID !== undefined ? sender.data._preSurveyID : null,
          _checkedIn: sender.data._checkedIn !== undefined ? sender.data._checkedIn : null,
          _checkedOut: sender.data._checkedOut !== undefined ? sender.data._checkedOut : null,
          _claimed: sender.data._claimed !== undefined ? sender.data._claimed : null,
          _used: sender.data._used !== undefined ? sender.data._used : null,
          _email: sender.data._email !== undefined ? sender.data._email : null,
          _sms: sender.data._sms !== undefined ? sender.data._sms : null,
          _exported: sender.data._exported !== undefined ? sender.data._exported : null,
        };

        const submission = {
          answers: enrichedAnswers,
          eventId: config.eventId,
          responseId: config.responseId,
          completedAt: new Date().toISOString(),
          duration: Date.now() - new Date(sender.getValue('start_time') || Date.now()).getTime(),
          device_survey_guid: sender.getValue('device_survey_guid') || uuidv4(),
        };

        bridgeRef.current?.log('[onComplete] Submission data keys:', Object.keys(submission.answers));
        bridgeRef.current?.log('[onComplete] end_time:', submission.answers.end_time);
        bridgeRef.current?.log('[onComplete] _preSurveyID:', submission.answers._preSurveyID);
        bridgeRef.current?.postMessage('SURVEY_COMPLETE', submission);
        bridgeRef.current?.log('Survey completed', submission);
      });

      // Set default values
      setDefaultValues(newSurvey, config.eventId);

      if (config.locale) {
        newSurvey.locale = config.locale;
      } else if (derivedLocales.length > 0) {
        newSurvey.locale = derivedLocales[0];
      }
      setCurrentLocale(newSurvey.locale || config.locale || derivedLocales[0] || 'en');

      setSurvey(newSurvey);

      // Send ready signal
      bridgeRef.current?.log('Survey created successfully');
      bridgeRef.current?.postMessage('SURVEY_READY', {
        pageCount: newSurvey.visiblePageCount,
        currentPage: newSurvey.currentPageNo,
        surveyId: config.eventId,
      });
    } catch (error) {
      bridgeRef.current?.log('Error creating survey', error);
      bridgeRef.current?.postMessage('SURVEY_ERROR', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
    };

    // Call the async initialization function
    initializeSurvey();
  }, [
    config,
    preprocessRequiredValidation,
    applyBrandTheme,
    prepareSurveyJsonAndTheme,
    setDefaultValues,
    saveProgress,
  ]);

  const handleLocaleChange = useCallback(
    (locale: string) => {
      if (!locale || !survey) return;
      survey.locale = locale;
      setCurrentLocale(locale);
    },
    [survey]
  );

  const normalizedBrand = normalizeBrand(config?.brand) as Brand;
  const showBrandChrome = normalizedBrand === 'Ford' || normalizedBrand === 'Lincoln';

  if (!survey) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Loading survey...</h3>
      </div>
    );
  }

  // Removed render-time logging to prevent infinite loop from postMessage triggering re-renders

  return (
    <div className="app">
      <div className="layout-base">
        <div className="gdux-ford">
          {showBrandChrome && (
            <GlobalHeader
              brand={normalizedBrand as 'Ford' | 'Lincoln'}
              showLanguageChooser={supportedLocales.length > 1}
              supportedLocales={supportedLocales}
              currentLocale={currentLocale}
              onLanguageChange={handleLocaleChange}
            />
          )}

          <div id="fd-nxt" className={getBrandTheme(normalizedBrand)}>
            <Survey model={survey} />

            {showBrandChrome && (
              <FordSurveyNavigation survey={survey} brand={normalizedBrand} />
            )}
          </div>

          {/* GlobalFooter temporarily disabled */}
          {/*
          {showBrandChrome && (
            <GlobalFooter
              brand={normalizedBrand as 'Ford' | 'Lincoln'}
              supportedLanguages={supportedLocales}
              currentLocale={currentLocale}
              onLanguageChange={handleLocaleChange}
              showLanguageSelector={normalizedBrand === 'Ford'}
            />
          )}
          */}
        </div>
      </div>
    </div>
  );
};

export default SurveyWebViewApp;
