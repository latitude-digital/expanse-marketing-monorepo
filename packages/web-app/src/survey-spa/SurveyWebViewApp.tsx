import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Model, FunctionFactory, surveyLocalization, ComponentCollection, ElementFactory } from 'survey-core';
import { Survey } from 'survey-react-ui';
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
import { registerAllFDSRenderers } from '../surveysjs_renderers/FDSRenderers/register';
import { nativePlacesApi } from '../utils/nativePlacesApi';

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

// Register email validation globally as a SYNCHRONOUS validator
// Note: Third parameter `false` (or omitted) = synchronous, `true` = async
// Async validators MUST call this.returnResult() - this function is synchronous
FunctionFactory.Instance.register('validateEmail', validateEmail, false);

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
function ensureFDSRenderersRegistered() {
  try {
    registerAllFDSRenderers();
  } catch (error) {
    console.error('ERROR registering FDS renderers', error);
    throw error;
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
        console.log(`[WebBundle] ${message}`, data || '');
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
      if (brandForFDS === 'Ford' || brandForFDS === 'Lincoln') {
        ensureFDSRenderersRegistered();
      }

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

      // DEBUG: Global click handler to detect ANY click
      // document.addEventListener('click', (e) => {
      //   const target = e.target as HTMLElement;
      //   console.log('[WebBundle] GLOBAL CLICK:', {
      //     tagName: target.tagName,
      //     className: target.className,
      //     id: target.id,
      //     value: (target as any).value,
      //     title: (target as any).title,
      //     textContent: target.textContent?.substring(0, 50),
      //   });

      //   // Check if it's a Complete button
      //   const isCompleteButton =
      //     (target.tagName === 'INPUT' || target.tagName === 'BUTTON') &&
      //     (target.className.includes('complete') ||
      //      (target as any).value === 'Complete' ||
      //      (target as any).title === 'Complete' ||
      //      target.textContent === 'Complete');

      //   if (isCompleteButton) {
      //     console.log('[WebBundle] 🔴 COMPLETE BUTTON DETECTED!');
      //     console.log('[WebBundle] Survey state:', newSurvey.state);
      //     console.log('[WebBundle] Survey mode:', (newSurvey as any).mode);
      //     console.log('[WebBundle] Is last page:', newSurvey.isLastPage);
      //     console.log('[WebBundle] Current page has errors:', newSurvey.currentPage?.hasErrors());
      //     console.log('[WebBundle] Is completed:', (newSurvey as any).isCompleted);
      //     console.log('[WebBundle] showNavigationButtons:', (newSurvey as any).showNavigationButtons);
      //     console.log('[WebBundle] clearInvisibleValues:', (newSurvey as any).clearInvisibleValues);

      //     // Check if there's a completeLastPage override
      //     console.log('[WebBundle] completeLastPage is:', typeof newSurvey.completeLastPage);
      //     console.log('[WebBundle] doComplete is:', typeof (newSurvey as any).doComplete);
      //     console.log('[WebBundle] onComplete.isEmpty:', newSurvey.onComplete.isEmpty);
      //     console.log('[WebBundle] onComplete.length:', (newSurvey.onComplete as any).length);

      //     // Try manually triggering completion methods
      //     console.log('[WebBundle] Testing manual completion methods...');

      //     setTimeout(() => {
      //       console.log('[WebBundle] Before completeLastPage - state:', newSurvey.state);
      //       console.log('[WebBundle] Calling survey.completeLastPage()...');
      //       try {
      //         newSurvey.completeLastPage();
      //         console.log('[WebBundle] completeLastPage() called successfully');
      //         console.log('[WebBundle] After completeLastPage - state:', newSurvey.state);
      //         console.log('[WebBundle] After completeLastPage - isCompleted:', (newSurvey as any).isCompleted);

      //         // If still not completed, try doComplete
      //         if (newSurvey.state !== 'completed') {
      //           console.log('[WebBundle] State still not completed, trying doComplete()...');
      //           (newSurvey as any).doComplete();
      //           console.log('[WebBundle] After doComplete - state:', newSurvey.state);
      //         }
      //       } catch (err) {
      //         console.error('[WebBundle] completeLastPage() error:', err);
      //       }
      //     }, 100);
      //   }

      //   // Check if it's any navigation button
      //   if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
      //     console.log('[WebBundle] ⚠️ BUTTON/INPUT CLICKED:', target);
      //   }
      // }, true);

      // Render hook - detect button clicks
      newSurvey.onAfterRenderSurvey.add((survey, htmlElement) => {
        console.log('[WebBundle] onAfterRenderSurvey fired, htmlElement type:', typeof htmlElement);

        // Validate htmlElement is an actual HTMLElement
        if (!htmlElement || !(htmlElement instanceof HTMLElement)) {
          console.log('[WebBundle] ⚠️ htmlElement is not an HTMLElement, skipping button detection');
          return;
        }

        // Find and log all navigation buttons - try multiple selectors
        const selectors = [
          'input[value="Complete"]',
          'input[title*="Complete"]',
          'input[title*="complete"]',
          'button[title*="Complete"]',
          'button[title*="complete"]',
          'input.sd-btn',
          'input.sv-btn',
          '.sv-footer__complete-btn',
          '.sd-footer__complete-btn',
        ];

        console.log('[WebBundle] Searching for complete buttons with selectors:', selectors);

        selectors.forEach(selector => {
          try {
            const buttons = htmlElement.querySelectorAll(selector);
            console.log(`[WebBundle] Selector "${selector}" found ${buttons.length} buttons`);

            buttons.forEach((btn, index) => {
              console.log(`[WebBundle] Button ${index} for selector "${selector}":`, {
                tagName: btn.tagName,
                className: btn.className,
                value: (btn as any).value,
                title: (btn as any).title,
              });

              const handler = (event: Event) => {
                console.log(`[WebBundle] ✅ COMPLETE BUTTON CLICKED! (selector: ${selector}, index: ${index})`);
                console.log('[WebBundle] Click event:', event);
              };
              btn.addEventListener('click', handler, true);
            });
          } catch (error) {
            console.error(`[WebBundle] Error with selector "${selector}":`, error);
          }
        });

        // Also dump the entire HTML to see what's there
        try {
          console.log('[WebBundle] Survey HTML structure:', htmlElement.innerHTML.substring(0, 500));
        } catch (error) {
          console.error('[WebBundle] Error dumping HTML:', error);
        }
      });

      // Validation hook - fires when validation runs on current page
      newSurvey.onValidatedErrorsOnCurrentPage.add((sender, options) => {
        console.log('[WebBundle] 🔍 Validation ran on current page');
        const errors = options.errors;
        console.log('[WebBundle] Validation errors count:', errors.length);
        if (errors.length > 0) {
          console.log('[WebBundle] ⚠️ VALIDATION FAILED:');
          errors.forEach((error, i) => {
            console.log(`[WebBundle]   ${i + 1}. ${error.question?.name || 'Unknown'}: ${error.text}`);
          });
        } else {
          console.log('[WebBundle] ✅ Validation passed');
        }

        // DIAGNOSTIC: Check for invisible required questions that could block completion
        const invisibleRequired = sender.getAllQuestions(false, false, true)
          .filter(q => q.isRequired && !q.isVisible && q.isEmpty());

        if (invisibleRequired.length > 0) {
          console.error('[WebBundle] ⚠️ INVISIBLE REQUIRED QUESTIONS DETECTED:',
            invisibleRequired.map(q => ({
              name: q.name,
              parent: q.parent?.name,
              isVisible: q.isVisible,
              isEmpty: q.isEmpty(),
              hasErrors: q.hasErrors()
            }))
          );
          bridgeRef.current?.log('INVISIBLE REQUIRED QUESTIONS BLOCKING:',
            invisibleRequired.map(q => `${q.name} (parent: ${q.parent?.name || 'none'})`).join(', ')
          );
        }
      });

      // Completion handler
      newSurvey.onComplete.add((sender) => {
        console.log('[WebBundle] 🎉 onComplete fired!');
        console.log('[WebBundle] Survey state:', sender.state);
        console.log('[WebBundle] Survey data:', sender.data);

        // DIAGNOSTIC: Final check for invisible required questions
        const invisibleRequired = sender.getAllQuestions(false, false, true)
          .filter(q => q.isRequired && !q.isVisible && q.isEmpty());

        if (invisibleRequired.length > 0) {
          console.error('[WebBundle] ⚠️ WARNING: Survey completed despite invisible required questions:',
            invisibleRequired.map(q => ({
              name: q.name,
              parent: q.parent?.name,
              type: q.getType(),
              isVisible: q.isVisible,
              isEmpty: q.isEmpty()
            }))
          );
          bridgeRef.current?.log('WARNING: Invisible required questions present at completion:',
            invisibleRequired.map(q => q.name).join(', ')
          );
        }

        try {
          console.log('[WebBundle] onComplete - START processing');
          bridgeRef.current?.log('[onComplete] Handler fired - START');

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

          console.log('[WebBundle] Answers enriched');
          bridgeRef.current?.log('[onComplete] Answers enriched');

          const submission = {
            answers: enrichedAnswers,
            eventId: config.eventId,
            responseId: config.responseId,
            completedAt: new Date().toISOString(),
            duration: Date.now() - new Date(sender.getValue('start_time') || Date.now()).getTime(),
            device_survey_guid: sender.getValue('device_survey_guid') || uuidv4(),
          };

          console.log('[WebBundle] Submission object created:', submission);
          bridgeRef.current?.log('[onComplete] Submission object created');
          bridgeRef.current?.log('[onComplete] Submission data keys:', Object.keys(submission.answers));
          bridgeRef.current?.log('[onComplete] end_time:', submission.answers.end_time);
          bridgeRef.current?.log('[onComplete] _preSurveyID:', submission.answers._preSurveyID);

          console.log('[WebBundle] About to post SURVEY_COMPLETE message');
          bridgeRef.current?.log('[onComplete] About to post SURVEY_COMPLETE message');
          bridgeRef.current?.postMessage('SURVEY_COMPLETE', submission);
          console.log('[WebBundle] ✅ SURVEY_COMPLETE message posted!');
          bridgeRef.current?.log('[onComplete] Message posted - COMPLETE');
        } catch (error) {
          console.error('[WebBundle] ❌ ERROR in onComplete handler:', error);
          bridgeRef.current?.log('[onComplete] ERROR in handler:', error);
          throw error;
        }
      });

      // Set default values
      setDefaultValues(newSurvey, config.eventId);

      if (config.locale) {
        newSurvey.locale = config.locale;
      } else if (derivedLocales.length > 0) {
        newSurvey.locale = derivedLocales[0];
      }
      setCurrentLocale(newSurvey.locale || config.locale || derivedLocales[0] || 'en');

      console.log('[WebBundle] Setting survey state...');
      setSurvey(newSurvey);
      console.log('[WebBundle] ✅ Survey state set!');

      // DIAGNOSTIC: Log initial survey configuration
      console.log('[WebBundle] Initial survey configuration:', {
        state: newSurvey.state,
        visiblePageCount: newSurvey.visiblePageCount,
        currentPageNo: newSurvey.currentPageNo,
        showNavigationButtons: newSurvey.showNavigationButtons,
        showPreviewBeforeComplete: newSurvey.showPreviewBeforeComplete,
        showCompletedPage: newSurvey.showCompletedPage,
        checkErrorsMode: newSurvey.checkErrorsMode,
        clearInvisibleValues: newSurvey.clearInvisibleValues,
        widthMode: newSurvey.widthMode
      });
      bridgeRef.current?.log('[Init] Survey config:', `state=${newSurvey.state}, pages=${newSurvey.visiblePageCount}, navButtons=${newSurvey.showNavigationButtons}`);

      // Log survey completion handler count
      console.log('[WebBundle] onComplete handlers registered:', newSurvey.onComplete.length || 'unknown');
      console.log('[WebBundle] onCompleting handlers registered:', newSurvey.onCompleting.length || 'unknown');

      // Send ready signal
      console.log('[WebBundle] Survey created successfully, sending SURVEY_READY');
      bridgeRef.current?.log('Survey created successfully');
      bridgeRef.current?.postMessage('SURVEY_READY', {
        pageCount: newSurvey.visiblePageCount,
        currentPage: newSurvey.currentPageNo,
        surveyId: config.eventId,
      });
      console.log('[WebBundle] SURVEY_READY message sent');
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

  /**
   * Initialize address autocomplete after survey is rendered
   */
  useEffect(() => {
    if (!survey) return;

    bridgeRef.current?.log('[AddressAutocomplete] Survey rendered, setting up address autocomplete...');

    // Wait for the DOM to be ready
    const initializeAddressFields = () => {
      const addressInputs = document.querySelectorAll(
        'input[autocomplete="address-line1"]'
      );

      bridgeRef.current?.log(`[AddressAutocomplete] Found ${addressInputs.length} address inputs`);

      addressInputs.forEach((input) => {
        const inputElement = input as HTMLInputElement;

        // Check if already initialized
        if (inputElement.hasAttribute('data-autocomplete-initialized')) {
          return;
        }

        inputElement.setAttribute('data-autocomplete-initialized', 'true');
        bridgeRef.current?.log('[AddressAutocomplete] Initializing autocomplete for input:', inputElement.name);

        // Initialize native autocomplete
        initializeNativeAutocomplete(inputElement, survey);
      });
    };

    // Try immediately
    initializeAddressFields();

    // Also watch for dynamically added inputs
    const observer = new MutationObserver(() => {
      try {
        initializeAddressFields();
      } catch (error) {
        bridgeRef.current?.log('[AddressAutocomplete] MutationObserver error:', error);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [survey]);

  /**
   * Initialize native autocomplete for an input element
   */
  const initializeNativeAutocomplete = (inputElement: HTMLInputElement, surveyModel: Model) => {
    let debounceTimeout: any;
    let currentPredictions: any[] = [];
    let dropdownElement: HTMLDivElement | null = null;

    const createDropdown = () => {
      if (dropdownElement) return dropdownElement;

      dropdownElement = document.createElement('div');
      dropdownElement.className = 'native-places-dropdown';
      dropdownElement.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 9999;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        display: none;
      `;
      document.body.appendChild(dropdownElement);
      return dropdownElement;
    };

    const positionDropdown = () => {
      if (!dropdownElement) return;
      const rect = inputElement.getBoundingClientRect();
      dropdownElement.style.left = `${rect.left + window.scrollX}px`;
      dropdownElement.style.top = `${rect.bottom + window.scrollY}px`;
      dropdownElement.style.width = `${rect.width}px`;
    };

    const showDropdown = (predictions: any[]) => {
      const dropdown = createDropdown();
      dropdown.innerHTML = '';
      currentPredictions = predictions;

      if (predictions.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      predictions.forEach((prediction) => {
        const item = document.createElement('div');
        item.className = 'native-places-dropdown-item';
        item.style.cssText = `
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        `;
        item.innerHTML = `
          <div style="font-weight: 500;">${prediction.mainText}</div>
          <div style="font-size: 0.9em; color: #666;">${prediction.secondaryText}</div>
        `;

        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#f5f5f5';
        });
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'white';
        });
        item.addEventListener('click', async () => {
          await handlePredictionSelect(prediction);
        });

        dropdown.appendChild(item);
      });

      // Add Google attribution (required by Google Places API Terms of Service)
      const attribution = document.createElement('div');
      attribution.style.cssText = `
        padding: 8px 12px;
        font-size: 0.75em;
        color: #666;
        background: #f9f9f9;
        text-align: right;
        border-top: 1px solid #ddd;
      `;
      attribution.innerHTML = 'Powered by Google';
      dropdown.appendChild(attribution);

      positionDropdown();
      dropdown.style.display = 'block';
    };

    const hideDropdown = () => {
      if (dropdownElement) {
        dropdownElement.style.display = 'none';
      }
    };

    const handlePredictionSelect = async (prediction: any) => {
      try {
        bridgeRef.current?.log('[AddressAutocomplete] Fetching details for place:', prediction.placeId);
        const details = await nativePlacesApi.getPlaceDetails(prediction.placeId);

        // Parse address components
        const ParsedData: Record<string, any> = {
          formatted_address: details.formattedAddress,
        };

        const postalData = details.addressComponents.find((item) =>
          item.types.includes("postal_code")
        );
        const countryData = details.addressComponents.find((item) =>
          item.types.includes("country")
        );
        const addressData = details.addressComponents.find((item) =>
          item.types.includes("administrative_area_level_1")
        );
        const cityData = details.addressComponents.find((item) =>
          item.types.includes("locality")
        );
        const routeData = details.addressComponents.find((item) =>
          item.types.includes("route")
        );
        const streetNumberData = details.addressComponents.find((item) =>
          item.types.includes("street_number")
        );

        ParsedData.address1 = [
          streetNumberData?.longName,
          routeData?.longName,
        ]
          .join(" ")
          .trim();
        ParsedData.city = cityData == null ? "" : cityData.longName;
        ParsedData.state = addressData == null ? "" : addressData.shortName;
        ParsedData.zip_code = postalData == null ? "" : postalData.longName;
        ParsedData.country = countryData == null ? "" : countryData.shortName;

        // Update survey values
        const isComposite = surveyModel.getQuestionByName("address_group");
        if (isComposite) {
          surveyModel.setValue("address_group", ParsedData);
        } else {
          [
            "address1",
            "city",
            "state",
            "zip_code",
            "country",
          ].forEach((key) => {
            try {
              surveyModel.setValue(key, ParsedData[key]);
            } catch (e) {
              console.log("error", e);
            }
          });
        }

        hideDropdown();
      } catch (error) {
        bridgeRef.current?.log('[AddressAutocomplete] Error fetching place details:', error);
      }
    };

    const handleInput = async (event: Event) => {
      const value = (event.target as HTMLInputElement).value;

      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      if (!value || value.length < 3) {
        hideDropdown();
        return;
      }

      debounceTimeout = setTimeout(async () => {
        try {
          bridgeRef.current?.log('[AddressAutocomplete] Fetching predictions for:', value);
          const predictions = await nativePlacesApi.getAutocompletePredictions(value);
          showDropdown(predictions);
        } catch (error) {
          bridgeRef.current?.log('[AddressAutocomplete] Error fetching predictions:', error);
          hideDropdown();
        }
      }, 300);
    };

    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('blur', () => {
      setTimeout(hideDropdown, 200);
    });
    inputElement.addEventListener('focus', () => {
      if (currentPredictions.length > 0 && inputElement.value.length >= 3) {
        showDropdown(currentPredictions);
      }
    });
  };

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
