import React, { useEffect, useState } from "react";
import { Model, SurveyError, FunctionFactory, ITheme } from "survey-core";
import { Survey } from "survey-react-ui";
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { SurveySkeleton } from '../components/LoadingStates';
import * as Sentry from "@sentry/react";
import showdown from 'showdown';
import { v4 as uuidv4 } from 'uuid';

import auth from '../services/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import app from '../services/firebase';
import { checkSurveyLimit as checkSurveyLimitFn, validateSurveyLimit as validateSurveyLimitFn } from '../services/namespacedFunctions';

import { getApiUrl, ENDPOINTS } from "../config/api";

// Import FDS custom SurveyJS renderers
import { CheckboxVOIQuestion } from "../surveysjs_renderers/FDSRenderers/CheckboxVOI";
import { CheckboxVehiclesDrivenQuestion } from "../surveysjs_renderers/FDSRenderers/CheckboxVehiclesDriven";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/FDSRenderers/RadioButtonButton";
import { SurveyBookeoQuestion } from "../surveysjs_renderers/Bookeo";

// Force execution of renderer registration by referencing the class
console.log('Survey.tsx: CheckboxVehiclesDrivenQuestion loaded:', CheckboxVehiclesDrivenQuestion);
// EmailTextInput removed - FDSTextRenderer handles all text inputs including email with proper required field support
import "../surveysjs_renderers/FilePreview";

import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";

import logo from '../assets/ford-signature.svg';
import globeIcon from '../assets/icons/ford/globe.svg';
import "survey-core/survey-core.min.css";
import { prepareForSurvey, prepareSurveyOnQuestionAdded } from "../helpers/surveyTemplatesAll";
import GlobalFooter from "../components/GlobalFooter";
import { createDefaultFordSurvey } from '../helpers/fordSurvey';
import { uploadSurveyToAPI } from '@expanse/shared';
import { getCustomContentLocales, getDefaultLocale } from '../helpers/surveyLocaleHelper';
import { LanguageSelector, FordLanguageSelector } from '../components/LanguageSelector';

// Import utility functions
import {
  detectMobile,
  compressImage,
  validateFileSize,
  handleNetworkError,
  uploadWithRetry,
  extractUTM,
  determineLanguage,
  validateEmailForSurveyJS,
  type FileValidationResult
} from '../utils/surveyUtilities';

// Import brand utilities and FDS initializer
import { shouldLoadFDS, getBrandTheme, normalizeBrand } from '../utils/brandUtils';
import { initializeFDSForBrand } from '../helpers/fdsInitializer';

// Import custom Ford navigation and GlobalHeader
import { FordSurveyNavigation } from '../components/FordSurveyNavigation';
import GlobalHeader from '../components/GlobalHeader';

// TypeScript interfaces
interface RouteParams {
  eventID: string;
}

interface SurveyEvent {
  name: string;
  brand?: string;
  fordEventID?: string;
  lincolnEventID?: string;
  disabled?: string;
  _preEventID?: string;
  survey_count_limit?: number;
  limit_reached_message?: string;
  surveyType?: string;
  questions: string;  // Legacy field
  surveyJSModel?: any;  // New map field
  theme?: string;  // Legacy field
  surveyJSTheme?: any;  // New map field
  showHeader?: boolean;
  showLanguageChooser?: boolean;
}

interface PreSurvey {
  device_survey_guid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface GetSurveyResponse {
  success: boolean;
  event: SurveyEvent;
  preSurvey?: PreSurvey;
  message?: string;
}

interface SurveyLimitResult {
  data: {
    limitReached: boolean;
    message?: string;
  };
}

interface BookeoData {
  bookeoKey: string;
  customFieldId: string;
  seats: number;
  productId: string;
  previousHoldId: string;
  eventId: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phone: string;
  type: string;
  customData: string;
}

interface UploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  finalImageUrl: string;
}

interface SurveyData {
  [key: string]: any;
  device_survey_guid?: string;
  start_time?: Date;
  survey_date?: Date;
  event_id?: string;
  app_version?: string;
  abandoned?: number;
  _utm?: any;
  _referrer?: string;
  _language?: string;
  device_id?: string;
  _screenWidth?: number;
  _offset?: number;
  _timeZone?: string;
  end_time?: Date;
  _preSurveyID?: string | null;
  _checkedIn?: any;
  _checkedOut?: any;
  _claimed?: any;
  _used?: any;
  _email?: any;
  _sms?: any;
  _exported?: any;
  pre_drive_survey_guid?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  microsite_email_template?: any;
  signature?: string;
  minor_signature?: string;
  voi?: string[];
}


// Register email validation function
FunctionFactory.Instance.register("validateEmail", validateEmailForSurveyJS, true);

const SurveyComponent: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<RouteParams>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user] = useAuthState(auth);
  const [thisSurvey, setThisSurvey] = useState<Model | null>(null);
  const [thisError, setThisError] = useState<Error | null>(null);
  const [thisEvent, setThisEvent] = useState<SurveyEvent | null>(null);
  const [thisPreSurvey, setThisPreSurvey] = useState<PreSurvey | null>(null);
  const [supportedLocales, setSupportedLocales] = useState<string[]>([]);
  const [currentLocale, setCurrentLocale] = useState<string>('');
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [limitMessage, setLimitMessage] = useState<string>('');

  const converter = new showdown.Converter({
    openLinksInNewWindow: true,
  });

  const handleLanguageChange = (locale: string): void => {
    if (thisSurvey && locale) {
      thisSurvey.locale = locale;
      setCurrentLocale(locale);
      
      // Update URL with the new language parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('lang', locale);
      setSearchParams(newSearchParams);
    }
  };

  const handleSurveyStarting = (sender: Model, options: any): void => {
    console.log('handleSurveyStarting', options);
  };

  useEffect(() => {
    if (!params.eventID) return;

    // Check for preSurveyID from either location state or query parameter
    const preSurveyID = (location.state as any)?.preSurveyID || searchParams.get('pid');
    
    fetch(getApiUrl(ENDPOINTS.GET_SURVEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventID: params.eventID, preSurveyID }),
    }).then(response => {
      response.json().then(async (res: GetSurveyResponse) => {
        if (res.success) {
          setThisEvent(res.event);
          if (res.preSurvey) {
            setThisPreSurvey(res.preSurvey);
          }

          document.title = res.event.name;

          if (res.event._preEventID && !preSurveyID) {
            // this is a post-event survey, sign people out
            navigate('./out');
            return;
          }
          
          // Check survey limit if configured
          if (res.event.survey_count_limit && res.event.survey_count_limit > 0) {
            const bypass = searchParams.get('bp');
            // Use namespaced function for survey limit check
            
            try {
              const result = await checkSurveyLimitFn({ 
                eventId: params.eventID,
                bypass: bypass 
              }) as SurveyLimitResult;
              
              if (result.data.limitReached) {
                setLimitReached(true);
                setLimitMessage(result.data.message || res.event.limit_reached_message || '');
                return;
              }
            } catch (error) {
              console.error('Error checking survey limit:', error);
              // Continue to show survey on error
            }
          }

          // Use new map fields if available, otherwise parse JSON strings
          const surveyJSON = res.event.surveyJSModel || 
                            (res.event.questions ? JSON.parse(res.event.questions) : {});
          const eventTheme = res.event.surveyJSTheme || 
                            (res.event.theme ? JSON.parse(res.event.theme) : {"cssVariables": {}});

          // Auto-fix missing headerView when theme has header configuration
          if (eventTheme.header && !surveyJSON.headerView) {
            console.log('[Header Debug] Auto-fixing missing headerView for survey with theme header configuration');
            surveyJSON.headerView = "advanced";
            // Also ensure description is not null (SurveyJS may require this for header rendering)
            if (!surveyJSON.description) {
              surveyJSON.description = " ";
              console.log('[Header Debug] Auto-fixing missing description for header');
            }
          }

          // Set default properties before creating model (can be overridden by survey definition)
          const defaultSurveyProperties = {
            "widthMode": "responsive",
            ...surveyJSON // Survey definition can override defaults
          };

          // Preprocess isRequired to working validators BEFORE model creation
          function preprocessRequiredValidation(surveyJSON) {
            function processElements(elements) {
              if (!elements) return;
              
              elements.forEach(element => {
                // Handle questions with isRequired: true
                if (element.type && element.isRequired === true) {
                  // Initialize validators array if it doesn't exist
                  if (!element.validators) {
                    element.validators = [];
                  }
                  
                  // Check if expression validator already exists
                  const hasRequiredValidator = element.validators.some(v => 
                    v.type === 'expression' && v.expression?.includes('notempty')
                  );
                  
                  if (!hasRequiredValidator) {
                    // Add expression validator for required field
                    element.validators.push({
                      type: "expression",
                      expression: "{self} notempty", 
                      text: element.requiredErrorText || "This field is required"
                    });
                  }
                  
                  
                  console.log(`[Survey Preprocess] Added required validator to question: ${element.name}`);
                }
                
                // Recursively process nested elements (panels, etc.)
                if (element.elements && Array.isArray(element.elements)) {
                  processElements(element.elements);
                }
                
                // Handle matrix-type questions
                if (element.columns) {
                  processElements(element.columns);
                }
                if (element.rows) {
                  processElements(element.rows);
                }
              });
            }
            
            // Process all pages
            if (surveyJSON.pages && Array.isArray(surveyJSON.pages)) {
              surveyJSON.pages.forEach(page => {
                if (page.elements && Array.isArray(page.elements)) {
                  processElements(page.elements);
                }
                // Handle page-level panels
                if (page.panels) {
                  processElements(page.panels);
                }
              });
            }
            
            return surveyJSON;
          }

          // Apply the preprocessing
          preprocessRequiredValidation(defaultSurveyProperties);

          if (res.event.disabled && !user) {
            defaultSurveyProperties.showCompleteButton = false;
            defaultSurveyProperties.pages = [
              {
                "elements": [
                  {
                    "type": "html",
                    "html": `<h4>${res.event.disabled}</h4>`
                  }
                ]
              }
            ];
          }

          // Initialize FDS conditionally based on event brand BEFORE creating survey model
          const eventBrand = normalizeBrand(res.event.brand);
          console.log(`Event brand detected: ${eventBrand}`);
          
          // Initialize FDS for Ford/Lincoln brands only - MUST happen before new Model()
          try {
            await initializeFDSForBrand(eventBrand);
          } catch (error) {
            console.error('Failed to initialize FDS:', error);
            // Continue with survey creation even if FDS fails
          }

          const survey = new Model(defaultSurveyProperties);
          
          // Configure validation scrolling behavior
          survey.autoFocusFirstError = true; // This should scroll to first error on validation
          
          // Since FDS renderers don't preserve SurveyJS element IDs, we need to handle scrolling differently
          // The onScrollingElementToTop event fires but can't find elements, so we'll use our custom approach
          survey.onScrollingElementToTop.add((sender: Model, options: any) => {
            // Cancel the default scrolling since it won't work with FDS renderers
            options.cancel = true;
            
            // Use our custom scrolling logic in onCompleting instead
          });
          
          // Add a more direct approach - watch for errors after any validation
          if (survey.onCurrentPageChanging) {
            survey.onCurrentPageChanging.add((sender: Model, options: any) => {
              // If moving forward and current page has errors, scroll to first error
              if (options.isNextPage && !sender.currentPage?.validate(true, true)) {
              console.log('[Page Change] Validation failed, preventing page change and scrolling to error');
              
              // Allow time for errors to render, then scroll
              setTimeout(() => {
                const errorSelectors = [
                  '.fds-question-error', // FDS brands
                  '.sd-question__erbox:not(:empty)', // SurveyJS v2 errors  
                  '.sv-string-viewer--error', // SurveyJS error text
                  '.sv_q_erbox:not(:empty)' // SurveyJS v1 errors
                ];
                
                const errorElements = document.querySelectorAll(errorSelectors.join(', '));
                if (errorElements.length > 0) {
                  const firstError = errorElements[0];
                  const rect = firstError.getBoundingClientRect();
                  const scrollY = window.pageYOffset + rect.top - 100;
                  
                  console.log('[Page Change] Scrolling to error at position:', scrollY);
                  window.scrollTo({ top: scrollY, behavior: 'smooth' });
                  
                  // Try to focus input
                  const questionElement = firstError.closest('.sd-question, .sv_q, .sv_qstn, [data-name]');
                  if (questionElement) {
                    const firstInput = questionElement.querySelector('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), textarea, select') as HTMLElement;
                    if (firstInput) {
                      setTimeout(() => {
                        firstInput.focus();
                      }, 300);
                    }
                  }
                }
              }, 100);
              
              options.allow = false; // Prevent page change if validation fails
            }
          });
          }
          
          survey.onCurrentPageChanged.add(() => {
            // Reset scroll position when page changes successfully
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          
          // The CustomSurveyQuestion component now handles error detection and scrolling/focusing
          // This ensures proper integration with SurveyJS validation flow
          
          // Intercept validation errors to ensure scrolling happens
          let lastErrorCount = 0;
          if (survey.onValidatedErrorsChanged) {
            survey.onValidatedErrorsChanged.add((sender: Model) => {
            const currentPage = sender.currentPage;
            if (!currentPage) return;
            
            // Count errors on current page
            const currentErrorCount = currentPage.questions.reduce((count, q) => 
              count + (q.errors ? q.errors.length : 0), 0
            );
            
            // If errors increased (validation just happened), scroll to first error
            if (currentErrorCount > lastErrorCount && currentErrorCount > 0) {
              console.log('[Validation Scroll] Errors detected, scrolling to first error');
              
              // Let React render the errors, then scroll
              setTimeout(() => {
                // For FDS brands, look for FDS error elements
                // For non-FDS brands, look for standard SurveyJS error elements
                const errorSelectors = [
                  '.fds-question-error', // FDS brands
                  '.sd-question__erbox:not(:empty)', // SurveyJS v2 errors
                  '.sv-string-viewer--error', // SurveyJS error text
                  '.sv_q_erbox:not(:empty)' // SurveyJS v1 errors (fallback)
                ];
                
                const errorElements = document.querySelectorAll(errorSelectors.join(', '));
                if (errorElements.length > 0) {
                  const firstError = errorElements[0];
                  const rect = firstError.getBoundingClientRect();
                  
                  // Only scroll if error is not in viewport
                  if (rect.top < 0 || rect.bottom > window.innerHeight) {
                    const scrollY = window.pageYOffset + rect.top - 100;
                    console.log('[Validation Scroll] Scrolling to:', scrollY);
                    window.scrollTo({ top: scrollY, behavior: 'smooth' });
                    
                    // For non-FDS brands, also try to focus the first input
                    const questionElement = firstError.closest('.sd-question, .sv_q, .sv_qstn');
                    if (questionElement) {
                      const firstInput = questionElement.querySelector('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), textarea, select') as HTMLElement;
                      if (firstInput) {
                        setTimeout(() => {
                          firstInput.focus();
                        }, 300);
                      }
                    }
                  }
                }
              }, 100);
            }
            
            lastErrorCount = currentErrorCount;
          });
          }
          
          if (res.event.fordEventID || res.event.lincolnEventID) {
            survey.questionErrorLocation = "bottom";
          }

          // Hide built-in navigation buttons for Ford/Lincoln brands to use custom navigation
          const shouldUseCustomNavigation = eventBrand === 'Ford' || eventBrand === 'Lincoln';
          console.log('[Navigation Debug] eventBrand:', eventBrand, 'shouldUseCustomNavigation:', shouldUseCustomNavigation);
          if (shouldUseCustomNavigation) {
            console.log('[Navigation Debug] Hiding built-in navigation buttons');
            survey.showNavigationButtons = false;
          }

          // Apply theme for all brands
          if (eventTheme && eventTheme.cssVariables) {
            if (eventBrand === 'Ford' || eventBrand === 'Lincoln') {
              // Set default theme appearance to "Without Panels" for Ford/Lincoln brands
              console.log('[Theme Debug] Setting theme appearance to "Without Panels" for', eventBrand, 'brand');
              const updatedTheme = {
                themeName: "default",
                colorPalette: "light",
                isPanelless: true,
                backgroundImage: "",
                backgroundImageFit: "cover",
                backgroundImageAttachment: "scroll",
                backgroundOpacity: 1,
                cssVariables: {
                  "--sjs-general-backcolor-dim": "#ffffff",
                  ...eventTheme.cssVariables,
                },
                ...eventTheme,
              };
              survey.applyTheme(updatedTheme);
            } else {
              // Apply theme for Other brands without Ford/Lincoln specific overrides
              console.log('[Theme Debug] Applying custom theme for', eventBrand, 'brand');
              survey.applyTheme(eventTheme);
            }
          }

          prepareForSurvey(survey, eventBrand);
          
          // Configure file questions to use custom preview component
          survey.getAllQuestions().forEach((question: any) => {
            if (question.getType() === 'file') {
              // Disable built-in file preview
              question.showPreview = false;
              // Set our custom preview component
              question.filePreviewComponent = "sv-file-preview";
              // Initialize preview cache on the question
              question.previewCache = new Map();
            }
          });
          
          // Track uploaded questions to prevent duplicates
          const uploadedQuestions = new Set<string>();
          
          // Add event listener to clear uploadedQuestions when file is removed
          survey.onValueChanged.add((sender: Model, options: any) => {
            // Check if a file question value was cleared
            if (options.question && options.question.getType() === 'file') {
              if (!options.value || options.value.length === 0) {
                // File was removed, clear from uploadedQuestions
                uploadedQuestions.delete(options.question.name);
                console.log("Cleared upload tracking for question:", options.question.name);
              }
            }
          });
          
          // Image upload handler for respondents
          if ((survey as any).onUploadFiles) {
            (survey as any).onUploadFiles.add(async (sender: Model, options: any) => {
              try {
                console.log("Starting respondent image upload...");
                
                const questionId = options.question.name;
                let file: File = options.files[0];
                const isMobile = detectMobile();
                
                // Prevent multiple uploads per question
                if (uploadedQuestions.has(questionId)) {
                  console.log("Already uploaded for question:", questionId);
                  options.callback([], ["Already uploaded for this question"]);
                  return;
                }
                
                if (!file) {
                  console.error("No file provided");
                  options.callback([], ["No file selected"]);
                  return;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                  console.error("File must be an image");
                  options.callback([], ["File must be an image"]);
                  return;
                }

                // Enhanced file size validation with user-friendly messages
                const sizeValidation: FileValidationResult = validateFileSize(file, 10);
                if (!sizeValidation.valid) {
                  console.error("File size validation failed:", sizeValidation.message);
                  options.callback([], [sizeValidation.message || 'File too large']);
                  return;
                }

                // Store preview data before upload
                if (file.type.startsWith('image/') && options.question.previewCache) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    options.question.previewCache.set(file.name, {
                      dataUrl: e.target?.result,
                      isImage: true
                    });
                  };
                  await new Promise<void>((resolve) => {
                    reader.onloadend = () => resolve();
                    reader.readAsDataURL(file);
                  });
                }

                // Mobile optimization: compress images on mobile devices
                if (isMobile && file.type.startsWith('image/')) {
                  console.log("Mobile device detected, compressing image...");
                  try {
                    file = await compressImage(file, 1920, 0.8);
                    console.log(`Image compressed. Original: ${options.files[0].size} bytes, Compressed: ${file.size} bytes`);
                  } catch (compressionError) {
                    console.warn("Image compression failed, using original file:", compressionError);
                    // Continue with original file if compression fails
                  }
                }

                // Define the upload function with retry logic
                const performUpload = async (): Promise<string> => {
                  // Get upload URL from Firebase function (no auth required for respondents)
                  const uploadResponse = await fetch('https://generaterespondentuploadurl-erqibiidsa-uc.a.run.app', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      eventId: params.eventID,
                      surveyId: sender.getValue('device_survey_guid') || uuidv4(),
                      questionId: questionId,
                      filename: file.name,
                      contentType: file.type
                    })
                  });

                  if (!uploadResponse.ok) {
                    const error = new Error(`Failed to get upload URL: ${uploadResponse.statusText}`) as any;
                    error.status = uploadResponse.status;
                    throw error;
                  }

                  const { uploadUrl, fields, finalImageUrl }: UploadResponse = await uploadResponse.json();

                  // Upload to S3 using presigned POST with progress tracking
                  const formData = new FormData();
                  
                  // Add all the fields from the presigned POST
                  Object.entries(fields).forEach(([key, value]) => {
                    formData.append(key, value as string);
                  });
                  
                  // Add the file last
                  formData.append('file', file);

                  // Use XMLHttpRequest for progress tracking
                  const xhr = new XMLHttpRequest();
                  
                  // Set up mobile-optimized progress tracking
                  xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
                    if (event.lengthComputable) {
                      const percentComplete = (event.loaded / event.total) * 100;
                      console.log(`Upload progress: ${percentComplete.toFixed(1)}%`);
                      
                      if (isMobile) {
                        // Simple progress for mobile - use status message
                        const message = `Uploading... ${Math.round(percentComplete)}%`;
                        if (options.uploadProgress) {
                          options.uploadProgress(event.loaded, event.total);
                        }
                      } else {
                        // Detailed progress for desktop
                        if (options.uploadProgress) {
                          options.uploadProgress(event.loaded, event.total);
                        }
                      }
                    }
                  });

                  // Promise wrapper for XMLHttpRequest
                  const uploadPromise = new Promise<string>((resolve, reject) => {
                    xhr.addEventListener('load', () => {
                      if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(finalImageUrl);
                      } else {
                        const error = new Error(`Upload failed with status ${xhr.status}`) as any;
                        error.status = xhr.status;
                        reject(error);
                      }
                    });
                    
                    xhr.addEventListener('error', () => {
                      const error = new Error('Network error during upload') as any;
                      error.code = 'NETWORK_ERROR';
                      reject(error);
                    });
                    
                    xhr.addEventListener('timeout', () => {
                      const error = new Error('Upload timeout') as any;
                      error.status = 408;
                      reject(error);
                    });
                    
                    xhr.open('POST', uploadUrl);
                    xhr.timeout = 60000; // 60 second timeout
                    xhr.send(formData);
                  });

                  return await uploadPromise;
                };

                // Execute upload with retry logic
                const finalImageUrl = await uploadWithRetry(performUpload, 3);

                console.log("Upload successful:", finalImageUrl);
                
                // Mark this question as uploaded
                uploadedQuestions.add(questionId);
                
                // Return the file object with CDN URL to SurveyJS
                options.callback([{
                  file: file,
                  content: finalImageUrl
                }]);

              } catch (error) {
                console.error("Upload error:", error);
                
                // Use enhanced network error handling for user-friendly messages
                const errorMessage = handleNetworkError(error);
                options.callback([], [errorMessage]);
              }
            });
          } else {
            console.warn("onUploadFiles not available on survey object. File upload functionality disabled.");
          }
          
          // Get locales that have actual custom content (not just template translations)
          const customContentLocales = getCustomContentLocales(survey);
          console.log('All locales:', survey.getUsedLocales());
          console.log('Custom content locales:', customContentLocales);
          
          // Always support en, es, fr for SurveyJS built-in translations
          const supportedLanguages = customContentLocales.length > 0 ? customContentLocales : ['en', 'es', 'fr'];
          setSupportedLocales(supportedLanguages);
          
          // Determine the best language to use
          const urlLang = searchParams.get('lang');
          const browserLang = window.navigator?.language;
          const bestLang = determineLanguage(supportedLanguages, urlLang, browserLang);
          
          console.log('Selected locale:', bestLang, 
                      'URL param:', urlLang, 
                      'Browser language:', browserLang,
                      'Supported languages:', supportedLanguages);
          
          // Set the survey locale
          survey.locale = bestLang;
          setCurrentLocale(bestLang);
          
          
          // Update URL if needed (only if different from current URL param)
          if (bestLang && urlLang !== bestLang) {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('lang', bestLang);
            setSearchParams(newSearchParams, { replace: true });
          }

          survey.onAfterRenderSurvey.add((sender: Model) => {
            (sender as any).showCompleteButton = (surveyJSON as any).showCompleteButton;
            (sender as any).showNavigationButtons = (surveyJSON as any).showNavigationButtons;
            
            // Add click handler to Complete button for scroll-to-error fallback
            setTimeout(() => {
              // More comprehensive selectors for complete button
              const completeButtons = document.querySelectorAll(
                'input[type="button"][value="Complete"], ' +
                'button, ' + 
                '.sd_btn.sv_complete_btn, ' +
                '.sv-action-bar-item--primary, ' +
                '[data-name="complete-button"], ' +
                'input.sv_complete_btn'
              );
              
              // Filter for only "Complete" buttons
              const actualCompleteButtons = Array.from(completeButtons).filter(btn => 
                btn.textContent?.includes('Complete') || 
                (btn as HTMLInputElement).value?.includes('Complete')
              );
              
              console.log('[Complete Button Setup] Found Complete buttons:', actualCompleteButtons.length);
              
              actualCompleteButtons.forEach(button => {
                // Add listener without cloning to preserve SurveyJS behavior
                button.addEventListener('click', (e) => {
                  console.log('[Complete Button] Click intercepted');
                  
                  // Don't prevent default - let SurveyJS handle validation
                  // Just add scroll behavior after validation
                  setTimeout(() => {
                    // Check if there are visible errors on the page
                    const errorSelectors = [
                      '.fds-question-error', // FDS brands
                      '.sd-question__erbox:not(:empty)', // SurveyJS v2 errors
                      '.sv-string-viewer--error', // SurveyJS error text
                      '.sv_q_erbox:not(:empty)', // SurveyJS v1 errors
                      '[data-name] .sd-question__erbox:not(:empty)' // More specific selector
                    ];
                    
                    const errorElements = document.querySelectorAll(errorSelectors.join(', '));
                    console.log('[Complete Button] Found error elements after validation:', errorElements.length);
                    
                    if (errorElements.length > 0) {
                      const firstError = errorElements[0];
                      const rect = firstError.getBoundingClientRect();
                      
                      // Only scroll if error is not in viewport
                      if (rect.top < 0 || rect.bottom > window.innerHeight) {
                        const scrollY = window.pageYOffset + rect.top - 100;
                        console.log('[Complete Button] Scrolling to error at position:', scrollY);
                        window.scrollTo({ top: scrollY, behavior: 'smooth' });
                        
                        // Try to focus the first input
                        const questionElement = firstError.closest('.sd-question, .sv_q, .sv_qstn, [data-name]');
                        if (questionElement) {
                          const firstInput = questionElement.querySelector('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), textarea, select') as HTMLElement;
                          if (firstInput) {
                            setTimeout(() => {
                              console.log('[Complete Button] Focusing input');
                              firstInput.focus();
                            }, 300);
                          }
                        }
                      }
                    }
                  }, 150); // Small delay to allow validation errors to render
                });
              });
            }, 500); // Delay to ensure buttons are rendered

            // Set default values
            const defaultValues: SurveyData = {
              'start_time': new Date(),
              'survey_date': new Date(),
              'event_id': res.event.fordEventID || res.event.lincolnEventID || params.eventID,
              'app_version': 'surveyjs_2.0',
              'abandoned': 0,
              '_utm': extractUTM(),
              '_referrer': (window as any).frames?.top?.document?.referrer,
              '_language': window.navigator?.language,
              'device_id': window.navigator?.userAgent,
              '_screenWidth': window.screen?.width,
              '_offset': (new Date()).getTimezoneOffset(),
              '_timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            };

            // For postTD surveys, also set pre-survey data as defaults
            if (res.event.surveyType === 'postTD' && preSurveyID && res.preSurvey) {
              console.log('[PostTD Defaults] Setting pre-survey data as defaults');
              defaultValues['pre_drive_survey_guid'] = res.preSurvey.device_survey_guid || null;
              defaultValues['first_name'] = res.preSurvey.first_name || null;
              defaultValues['last_name'] = res.preSurvey.last_name || null;
              defaultValues['email'] = res.preSurvey.email || null;
              defaultValues['phone'] = res.preSurvey.phone || null;
            }

            // Set all default values
            Object.entries(defaultValues).forEach(([key, value]) => {
              sender.setValue(key, value);
            });

            // Log all default values
            console.log('=== Survey Default Values Set ===');
            console.log('Event Type:', res.event.surveyType);
            console.log('PreSurveyID:', preSurveyID);
            console.log('Default Values:', defaultValues);
            
            // Log all current survey data
            console.log('All Survey Data After Defaults:', sender.data);
            console.log('================================');
          });

          survey.onServerValidateQuestions.add((sender: Model, options: any) => {
            // loop & look for Bookeo
            survey.getAllQuestions().forEach((question: any) => {
              console.log('question', question.name, question.getType());
              if (question.getType() === "bookeo" && options.data[question.name]) {
                const bookeoData: BookeoData = {
                  bookeoKey: sender.getQuestionByName(question.name).getPropertyValue("bookeoKey"),
                  customFieldId: sender.getQuestionByName(question.name).getPropertyValue("customFieldId"),
                  seats: sender.getQuestionByName(question.name).getPropertyValue("seats"),
                  productId: sender.getQuestionByName(question.name).getPropertyValue("productId"),
                  previousHoldId: options.data[question.name].previousHoldId,
                  eventId: options.data[question.name].eventId,
                  firstName: options.data["first_name"],
                  lastName: options.data["last_name"],
                  emailAddress: options.data["email"],
                  phone: options.data["phone"],
                  type: "mobile",
                  customData: JSON.stringify({}),
                };

                fetch(getApiUrl(ENDPOINTS.MAKE_BOKEO_BOOKING), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(bookeoData),
                }).then(response => {
                  response.json().then((data) => {
                    if (!response.ok) {
                      options.errors[question.name] = "Booking Failed, please select a different time.";
                      sender.getQuestionByName(question.name).setPropertyValue("productId", sender.getQuestionByName(question.name).getPropertyValue("productId"));
                      console.error('Bookeo API Booking Error', data);
                      options.data[question.name] = null;
                      options.complete();
                    }

                    const val = options.data[question.name];
                    val.bookingNumber = data.bookingNumber;
                    options.data[question.name] = val;
                  });
                }).catch(err => {
                  console.error(err);
                  options.errors[question.name] = "Booking Failed, please select a different time.";
                  sender.getQuestionByName(question.name).clearValue();
                  sender.getQuestionByName(question.name).setPropertyValue("productId", sender.getQuestionByName(question.name).getPropertyValue("productId"));
                  options.complete();
                });
              }
            });

            options.complete();
          });

          survey.onCompleting.add(async (sender: Model, options: any) => {
            console.log('=== Survey onCompleting Started ===');
            
            // First, run validation to show errors
            const isValid = sender.validate(true, true);
            console.log('[Survey onCompleting] Validation result:', isValid);
            
            if (!isValid) {
              // Validation failed - scroll to first error
              console.log('[Survey onCompleting] Validation failed, scrolling to first error');
              
              // Allow time for errors to render
              setTimeout(() => {
                // Find first error element based on brand
                const errorSelectors = [
                  '.fds-question-error', // FDS brands
                  '.sd-question__erbox:not(:empty)', // SurveyJS v2 errors
                  '.sv-string-viewer--error', // SurveyJS error text
                  '.sv_q_erbox:not(:empty)', // SurveyJS v1 errors
                  '[data-name] .sd-question__erbox:not(:empty)' // More specific selector
                ];
                
                const errorElements = document.querySelectorAll(errorSelectors.join(', '));
                console.log('[Survey onCompleting] Found error elements:', errorElements.length);
                
                if (errorElements.length > 0) {
                  const firstError = errorElements[0];
                  const rect = firstError.getBoundingClientRect();
                  const scrollY = window.pageYOffset + rect.top - 100;
                  
                  console.log('[Survey onCompleting] Scrolling to position:', scrollY);
                  window.scrollTo({ top: scrollY, behavior: 'smooth' });
                  
                  // Try to focus the first input in the question with error
                  const questionElement = firstError.closest('.sd-question, .sv_q, .sv_qstn, [data-name]');
                  if (questionElement) {
                    const firstInput = questionElement.querySelector('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), textarea, select') as HTMLElement;
                    if (firstInput) {
                      setTimeout(() => {
                        console.log('[Survey onCompleting] Focusing input:', firstInput);
                        firstInput.focus();
                      }, 300);
                    }
                  }
                }
              }, 100);
              
              // Prevent completion since validation failed
              options.allow = false;
              return;
            }
            
            // Check survey limit before allowing submission
            if (res.event.survey_count_limit && res.event.survey_count_limit > 0) {
              const bypass = searchParams.get('bp');
              // Use namespaced function for survey validation
              
              try {
                const result = await validateSurveyLimitFn({ 
                  eventId: params.eventID,
                  bypass: bypass 
                });
                console.log('Survey limit validation passed:', result);
                // If we get here, validation passed
                options.allow = true;
              } catch (error) {
                console.error('Survey limit validation failed:', error);
                options.allow = false;
                
                // Extract the limit reached message from the event config or use default
                const limitReachedMessage = res.event.limit_reached_message || 
                  '## Survey Limit Reached\n\nThank you for your interest! We have reached the maximum number of responses for this survey.';
                
                // Convert markdown to HTML and display
                sender.completedHtml = `<div class="survey-limit-message">${converter.makeHtml(limitReachedMessage)}</div>`;
                return;
              }
            } else {
              // No limit set, allow completion
              options.allow = true;
            }
          });
          
          survey.onComplete.add(async (sender: Model, options: any) => {
            console.log('=== Survey onComplete Started ===');
            console.log('onComplete options:', options);
            const originalMesage = sender.completedHtml;
            console.log('originalMesage', originalMesage);
            sender.completedHtml = "<h3>Saving...</h3>";
            options.showDataSaving('Saving...');

            let surveyData: SurveyData = sender.data;
            console.log('[onComplete] Initial survey data:', JSON.stringify(surveyData, null, 2));

            // set some default hidden properties
            surveyData['_preSurveyID'] = preSurveyID || null;
            surveyData['_checkedIn'] = null;
            surveyData['_checkedOut'] = null;
            surveyData['_claimed'] = null;
            surveyData['_used'] = null;
            surveyData['_email'] = null;
            surveyData['_sms'] = null;
            surveyData['_exported'] = null;
            surveyData['end_time'] = new Date();
            surveyData['device_survey_guid'] = uuidv4(); // Use same GUID for both APIs
            
            // For postTD surveys, set pre_drive_survey_guid and copy user info from pre-survey
            console.log('[PostTD Debug] Event surveyType:', thisEvent?.surveyType);
            console.log('[PostTD Debug] preSurveyID:', preSurveyID);
            console.log('[PostTD Debug] thisPreSurvey:', thisPreSurvey);
            console.log('[PostTD Debug] Current surveyData before postTD processing:', {
              first_name: surveyData['first_name'],
              last_name: surveyData['last_name'],
              email: surveyData['email'],
              phone: surveyData['phone'],
              pre_drive_survey_guid: surveyData['pre_drive_survey_guid']
            });
            
            if (thisEvent?.surveyType === 'postTD' && preSurveyID && thisPreSurvey) {
              console.log('[PostTD Debug] Processing postTD survey data...');
              
              // Use the device_survey_guid from the pre-survey, not the Firestore document ID
              surveyData['pre_drive_survey_guid'] = thisPreSurvey.device_survey_guid || null;
              
              // Copy user info from pre-survey if not already provided
              if (!surveyData['first_name'] && thisPreSurvey.first_name) {
                console.log('[PostTD Debug] Copying first_name from pre-survey:', thisPreSurvey.first_name);
                surveyData['first_name'] = thisPreSurvey.first_name;
              }
              if (!surveyData['last_name'] && thisPreSurvey.last_name) {
                console.log('[PostTD Debug] Copying last_name from pre-survey:', thisPreSurvey.last_name);
                surveyData['last_name'] = thisPreSurvey.last_name;
              }
              if (!surveyData['email'] && thisPreSurvey.email) {
                console.log('[PostTD Debug] Copying email from pre-survey:', thisPreSurvey.email);
                surveyData['email'] = thisPreSurvey.email;
              }
              if (!surveyData['phone'] && thisPreSurvey.phone) {
                console.log('[PostTD Debug] Copying phone from pre-survey:', thisPreSurvey.phone);
                surveyData['phone'] = thisPreSurvey.phone;
              }
              
              console.log('[PostTD Debug] Updated surveyData with pre-survey info:', {
                pre_drive_survey_guid: surveyData['pre_drive_survey_guid'],
                first_name: surveyData['first_name'],
                last_name: surveyData['last_name'],
                email: surveyData['email'],
                phone: surveyData['phone']
              });
            } else {
              console.log('[PostTD Debug] Not a postTD survey or missing required data');
            }

            try {
              // Save to Firestore
              const firestoreRes = await fetch(getApiUrl(ENDPOINTS.SAVE_SURVEY), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventID: params.eventID,
                  survey: surveyData,
                }),
              });

              if (!firestoreRes.ok) {
                throw new Error(firestoreRes.statusText);
              }

              const firestoreData = await firestoreRes.json();
              console.log('saved to firestore', firestoreData);

              // Firebase function will handle upload to Ford/Lincoln APIs via surveyTrigger

              options.showDataSavingSuccess();
              sender.completedHtml = originalMesage;
              if ((location.state as any)?.preSurveyID) {
                setTimeout(() => {
                  navigate('./out');
                }, 3000);
              }
            } catch (err) {
              console.error('error', err);
              Sentry.captureException(err);
              options.showDataSavingError();
            }
          });

          prepareSurveyOnQuestionAdded(null, { survey });

          setThisSurvey(survey);
        } else {
          setThisError(new Error(res.message || 'Unknown error'));
        }
      });
    }).catch(err => {
      Sentry.captureException(err);
      alert(err);
    });
  }, [user, params.eventID, navigate, location]);

  return (
    limitReached ?
      <div className="survey-limit-message" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div dangerouslySetInnerHTML={{ __html: converter.makeHtml(limitMessage) }} />
      </div>
      :
    thisSurvey ?
      <div className="gdux-ford">
        {
          (() => {
            const currentBrand = normalizeBrand(thisEvent?.brand);
            const shouldShowHeader = (currentBrand === 'Ford' || currentBrand === 'Lincoln') 
              && thisEvent?.showHeader !== false; // Default to true if not specified
            
            return shouldShowHeader && (
              <GlobalHeader
                brand={currentBrand}
                showLanguageChooser={thisEvent?.showLanguageChooser === true && supportedLocales.length > 1}
                supportedLocales={supportedLocales}
                currentLocale={currentLocale}
                onLanguageChange={handleLanguageChange}
              />
            );
          })()
        }
        {/* Show standard language selector only for non-Ford/Lincoln surveys */}
        {supportedLocales.length > 1 && normalizeBrand(thisEvent?.brand) === 'Other' && (thisEvent?.showLanguageChooser === true) && (
          <LanguageSelector 
            survey={thisSurvey}
            supportedLocales={supportedLocales}
            currentLocale={currentLocale}
            onChange={handleLanguageChange}
          />
        )}
        <div id="fd-nxt" className={
          getBrandTheme(thisEvent?.brand)
        }>
          
          <Survey model={thisSurvey} />
          
          {/* Custom Ford/Lincoln navigation */}
          {(() => {
            const currentBrand = normalizeBrand(thisEvent?.brand);
            const shouldShowCustomNav = currentBrand === 'Ford' || currentBrand === 'Lincoln';
            console.log('[Custom Navigation Debug] currentBrand:', currentBrand, 'shouldShowCustomNav:', shouldShowCustomNav);
            return shouldShowCustomNav && (
              <FordSurveyNavigation 
                survey={thisSurvey} 
                brand={currentBrand} 
              />
            );
          })()}
        </div>
        {/* GlobalFooter - Show for Ford/Lincoln brands only */}
        {
          (() => {
            const currentBrand = normalizeBrand(thisEvent?.brand);
            const shouldShowFooter = (currentBrand === 'Ford' || currentBrand === 'Lincoln') 
              && thisEvent?.showFooter !== false; // Default to true if not specified
            
            return shouldShowFooter && (
              <GlobalFooter
                brand={currentBrand}
                supportedLanguages={supportedLocales}
                currentLocale={currentLocale}
                onLanguageChange={handleLanguageChange}
                showLanguageSelector={thisEvent?.showLanguageChooser === true && supportedLocales.length > 1}
              />
            );
          })()
        }
      </div>
      :
      thisError ? <h2>{thisError.message}</h2> : <SurveySkeleton />
  );
};

export default SurveyComponent;