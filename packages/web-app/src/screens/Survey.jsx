import { useEffect, useState } from "react";
import { Model, SurveyError, FunctionFactory } from "survey-core";
import { Survey } from "survey-react-ui";
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { Loader } from "@progress/kendo-react-indicators";
import * as Sentry from "@sentry/react";
import showdown from 'showdown';
import { v4 as uuidv4 } from 'uuid';
import UAParser from 'ua-parser-js';

import auth from '../services/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { httpsCallable } from 'firebase/functions';
import app from '../services/firebase';
import functions from '../services/functions';

import { getApiUrl, ENDPOINTS } from "../config/api";

// these are the custom surveyjs renderers
// while not referenced in the code they have to be imported to be registered
import { CheckboxVOIQuestion } from "../surveysjs_renderers/CheckboxVOI";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/RadioButtonButton";
import { SurveyBookeoQuestion } from "../surveysjs_renderers/Bookeo";
import { EmailTextInput } from "../surveysjs_renderers/EmailTextInput";
import "../surveysjs_renderers/FilePreview";

import logo from '../assets/ford-signature.svg';
import globeIcon from '../assets/icons/ford/globe.svg';
import { fordCSS } from "../themes/surveyJS/ford";
import "survey-core/defaultV2.min.css";
import "../themes/surveyJS/fds/custom-fds.css";

import "./Surveys.css";
import { prepareForSurvey, prepareSurveyOnQuestionAdded } from "../helpers/surveyTemplatesAll";
import FordFooter from "../components/FordFooter";
import { createDefaultFordSurvey } from '../helpers/fordSurvey';
import { mapSurveyToFordSurvey } from '../helpers/mapSurveyToFord';
import { getCustomContentLocales, getDefaultLocale } from '../helpers/surveyLocaleHelper';

function validateEmail() {
    console.log('[validateEmail]', this.question.value);
    const email = this.question.value;

    this.question.setPropertyValue('didYouMean', "");

    if (!email) {
        this.returnResult();
        return;
    }

    fetch(getApiUrl(ENDPOINTS.VALIDATE_EMAIL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }).then(response => {
        response.json().then((res) => {
            const { results } = res;

            let valid = true;
            console.log('this.survey', this.survey);
            console.log('this.question', this.question);
            console.log('validateEmail res', res);

            // bad emails are rejected
            if (results?.valid === false) {
                valid = false;
            }

            // disposable email services are rejected
            if (results?.is_disposable === true) {
                valid = false;
            }

            // reject delivery_confidence below 20
            if (results?.delivery_confidence < 20) {
                valid = false;
            }

            // typos are rejected with correction
            if (results.did_you_mean) {
                valid = true;
                this.question.setPropertyValue('didYouMean', results.did_you_mean);

                console.log('this.question after', this.question.didYouMean);
            }

            this.returnResult(valid);
        });
    }).catch(err => {
        Sentry.captureException(err);
        alert(err);
    });
}

FunctionFactory.Instance.register("validateEmail", validateEmail, true);

// Mobile Upload Optimization Functions

// Mobile device detection
const detectMobile = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    return result.device.type === 'mobile' || result.device.type === 'tablet';
};

// Image compression for mobile uploads
const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
    if (!file.type.startsWith('image/')) return file;
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                // Only compress if image is larger than maxWidth
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, { 
                        type: file.type,
                        lastModified: file.lastModified 
                    });
                    resolve(compressedFile);
                }, file.type, quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

// Enhanced file size validation with user-friendly messages
const validateFileSize = (file, maxSizeMB = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            message: `File size must be less than ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
        };
    }
    return { valid: true };
};

// Network error handling with specific messages
const handleNetworkError = (error) => {
    if (!navigator.onLine) {
        return "No internet connection. Please check your network and try again.";
    }
    
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
        return "Network error. Please check your connection and try again.";
    }
    
    if (error.status === 413) {
        return "File too large for upload. Please choose a smaller image.";
    }
    
    if (error.status === 408) {
        return "Upload timeout. Please try again.";
    }
    
    return "Upload failed. Please try again.";
};

// Upload with retry logic and exponential backoff
const uploadWithRetry = async (uploadFn, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await uploadFn();
        } catch (error) {
            lastError = error;
            
            // Don't retry on client errors (400-499)
            if (error.status >= 400 && error.status < 500) {
                throw error;
            }
            
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                console.log(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
};

const extractUTM = () => {
    // Get the UTM parameters from the URL
    var search = window.location.search;
    var params = new URLSearchParams(search);

    const utm = {};

    // Loop through each UTM parameter
    for (var [key, value] of params.entries()) {
        // Check if the parameter is "utm_source", "utm_medium", "utm_campaign", "utm_term", or "utm_content"
        if (["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].includes(key)) {
            utm[key] = value;
        }
    }

    return utm;
}

// Helper function to determine the best language to use
const determineLanguage = (supportedLocales, urlLang, browserLang) => {
    // If URL parameter is provided and supported, use it
    if (urlLang && supportedLocales.includes(urlLang)) {
        return urlLang;
    }
    
    // Try to match browser language (full code like 'en-US')
    if (browserLang && supportedLocales.includes(browserLang)) {
        return browserLang;
    }
    
    // Try to match just the primary language code (like 'en' from 'en-US')
    const primaryBrowserLang = browserLang?.split('-')[0];
    if (primaryBrowserLang && supportedLocales.includes(primaryBrowserLang)) {
        return primaryBrowserLang;
    }
    
    // Fall back to the first supported locale or 'en' if available
    return supportedLocales.includes('en') ? 'en' : supportedLocales[0];
};

// Standard Language selector component
const LanguageSelector = ({ survey, supportedLocales, currentLocale, onChange }) => {
    if (!supportedLocales || supportedLocales.length <= 1) return null;
    
    return (
        <div className="language-selector" style={{ textAlign: 'right', padding: '10px 20px' }}>
            <select 
                value={currentLocale} 
                onChange={(e) => onChange(e.target.value)}
                style={{ 
                    padding: '5px 10px', 
                    borderRadius: '4px',
                    border: '1px solid #ccc' 
                }}
            >
                {supportedLocales.map(locale => (
                    <option key={locale} value={locale}>
                        {locale === 'en' ? 'English' : 
                         locale === 'es' ? 'Español' : 
                         locale === 'fr' ? 'Français' : 
                         locale === 'de' ? 'Deutsch' : 
                         locale === 'pt' ? 'Português' :
                         locale === 'it' ? 'Italiano' :
                         locale === 'nl' ? 'Nederlands' :
                         locale === 'ru' ? 'Русский' :
                         locale === 'ja' ? '日本語' :
                         locale === 'zh' ? '中文' :
                         locale}
                    </option>
                ))}
            </select>
        </div>
    );
};

// Ford Language selector component with globe icon
const FordLanguageSelector = ({ survey, supportedLocales, currentLocale, onChange }) => {
    if (!supportedLocales || supportedLocales.length <= 1) return null;
    
    const [isOpen, setIsOpen] = useState(false);
    
    const toggleDropdown = () => setIsOpen(!isOpen);
    
    const selectLanguage = (locale) => {
        onChange(locale);
        setIsOpen(false);
    };
    
    // Get the display name for the current locale
    const getLocaleDisplayName = (locale) => {
        return locale === 'en' ? 'English' : 
               locale === 'es' ? 'Español' : 
               locale === 'fr' ? 'Français' : 
               locale === 'de' ? 'Deutsch' : 
               locale === 'pt' ? 'Português' :
               locale === 'it' ? 'Italiano' :
               locale === 'nl' ? 'Nederlands' :
               locale === 'ru' ? 'Русский' :
               locale === 'ja' ? '日本語' :
               locale === 'zh' ? '中文' :
               locale;
    };
    
    return (
        <div className="ford-language-selector" style={{ position: 'relative' }}>
            <button 
                onClick={toggleDropdown}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <img src={globeIcon} alt="Language" style={{ height: '24px', width: '24px' }} />
            </button>
            
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    background: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    zIndex: 1000,
                    minWidth: '150px'
                }}>
                    {supportedLocales.map(locale => (
                        <div 
                            key={locale}
                            onClick={() => selectLanguage(locale)}
                            style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                backgroundColor: locale === currentLocale ? '#f0f0f0' : 'transparent',
                                borderBottom: '1px solid #eee'
                            }}
                        >
                            {getLocaleDisplayName(locale)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function SurveyComponent() {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [user] = useAuthState(auth);
    const [thisSurvey, setThisSurvey] = useState();
    const [thisError, setThisError] = useState();
    const [thisEvent, setThisEvent] = useState();
    const [thisPreSurvey, setThisPreSurvey] = useState();
    const [supportedLocales, setSupportedLocales] = useState([]);
    const [currentLocale, setCurrentLocale] = useState('');
    const [limitReached, setLimitReached] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

    const converter = new showdown.Converter({
        openLinksInNewWindow: true,
    });

    const handleLanguageChange = (locale) => {
        if (thisSurvey && locale) {
            thisSurvey.locale = locale;
            setCurrentLocale(locale);
            
            // Update URL with the new language parameter
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('lang', locale);
            setSearchParams(newSearchParams);
        }
    };

    const handleSurveyStarting = (sender, options) => {
        console.log('handleSurveyStarting', options);
    }

    useEffect(() => {
        // Check for preSurveyID from either location state or query parameter
        const preSurveyID = location.state?.preSurveyID || searchParams.get('pid');
        
        fetch(getApiUrl(ENDPOINTS.GET_SURVEY), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventID: params.eventID, preSurveyID }),
        }).then(response => {
            response.json().then(async (res) => {
                if (res.success) {
                    setThisEvent(res.event);
                    if (res.preSurvey) {
                        setThisPreSurvey(res.preSurvey);
                    }
                    const themeJSON = JSON.parse(res.event.theme);

                    document.body.style.backgroundColor = themeJSON.cssVariables['--sjs-editor-background'];

                    document.title = res.event.name;
                    // if the favicon is defined
                    if (themeJSON.favicon) {
                        var link = document.querySelector("link[rel~='icon']");
                        link.href = themeJSON.favicon;
                    }

                    if (res.event._preEventID && !preSurveyID) {
                        // this is a post-event survey, sign people out
                        navigate('./out');
                        return;
                    }
                    
                    // Check survey limit if configured
                    if (res.event.survey_count_limit && res.event.survey_count_limit > 0) {
                        const bypass = searchParams.get('bp');
                        const checkSurveyLimit = httpsCallable(functions, 'checkSurveyLimit');
                        
                        try {
                            const result = await checkSurveyLimit({ 
                                eventId: params.eventID,
                                bypass: bypass 
                            });
                            
                            if (result.data.limitReached) {
                                setLimitReached(true);
                                setLimitMessage(result.data.message || res.event.limit_reached_message);
                                return;
                            }
                        } catch (error) {
                            console.error('Error checking survey limit:', error);
                            // Continue to show survey on error
                        }
                    }

                    const surveyJSON = JSON.parse(res.event.questions);

                    if (res.event.disabled && !user) {
                        surveyJSON.showCompleteButton = false;
                        surveyJSON.pages = [
                            {
                                "elements": [
                                    {
                                        "type": "html",
                                        "html": `<h4>${res.event.disabled}</h4>`
                                    }
                                ]
                            }
                        ]
                    }

                    const survey = new Model(surveyJSON);
                    survey.applyTheme(themeJSON);
                    
                    if (res.event.fordEventID) {
                        survey.css = fordCSS;
                        survey.questionErrorLocation = "bottom";
                    }

                    prepareForSurvey(survey);
                    
                    // Configure file questions to use custom preview component
                    survey.getAllQuestions().forEach(question => {
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
                    const uploadedQuestions = new Set();
                    
                    // Add event listener to clear uploadedQuestions when file is removed
                    survey.onValueChanged.add((sender, options) => {
                        // Check if a file question value was cleared
                        if (options.question && options.question.getType() === 'file') {
                            if (!options.value || options.value.length === 0) {
                                // File was removed, clear from uploadedQuestions
                                uploadedQuestions.delete(options.question.name);
                                console.log("Cleared upload tracking for question:", options.question.name);
                            }
                        }
                    });
                    
                    // Image upload handler for respondents (check if onUploadFiles exists)
                    if (survey.onUploadFiles) {
                        survey.onUploadFiles.add(async (sender, options) => {
                        try {
                            console.log("Starting respondent image upload...");
                            
                            const questionId = options.question.name;
                            let file = options.files[0];
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
                            const sizeValidation = validateFileSize(file, 10);
                            if (!sizeValidation.valid) {
                                console.error("File size validation failed:", sizeValidation.message);
                                options.callback([], [sizeValidation.message]);
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
                                await new Promise((resolve) => {
                                    reader.onloadend = resolve;
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
                            const performUpload = async () => {
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
                                    const error = new Error(`Failed to get upload URL: ${uploadResponse.statusText}`);
                                    error.status = uploadResponse.status;
                                    throw error;
                                }

                                const { uploadUrl, fields, finalImageUrl } = await uploadResponse.json();

                                // Upload to S3 using presigned POST with progress tracking
                                const formData = new FormData();
                                
                                // Add all the fields from the presigned POST
                                Object.entries(fields).forEach(([key, value]) => {
                                    formData.append(key, value);
                                });
                                
                                // Add the file last
                                formData.append('file', file);

                                // Use XMLHttpRequest for progress tracking
                                const xhr = new XMLHttpRequest();
                                
                                // Set up mobile-optimized progress tracking
                                xhr.upload.addEventListener('progress', (event) => {
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
                                const uploadPromise = new Promise((resolve, reject) => {
                                    xhr.addEventListener('load', () => {
                                        if (xhr.status >= 200 && xhr.status < 300) {
                                            resolve(finalImageUrl);
                                        } else {
                                            const error = new Error(`Upload failed with status ${xhr.status}`);
                                            error.status = xhr.status;
                                            reject(error);
                                        }
                                    });
                                    
                                    xhr.addEventListener('error', () => {
                                        const error = new Error('Network error during upload');
                                        error.code = 'NETWORK_ERROR';
                                        reject(error);
                                    });
                                    
                                    xhr.addEventListener('timeout', () => {
                                        const error = new Error('Upload timeout');
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
                    
                    // Only show language selector if there are custom content translations
                    setSupportedLocales(customContentLocales);
                    
                    // Determine the best language to use
                    if (customContentLocales.length > 0) {
                        const urlLang = searchParams.get('lang');
                        const browserLang = window.navigator?.language;
                        const bestLang = determineLanguage(customContentLocales, urlLang, browserLang);
                        
                        console.log('Selected locale:', bestLang, 
                                    'URL param:', urlLang, 
                                    'Browser language:', browserLang);
                        
                        // Set the survey locale
                        survey.locale = bestLang;
                        setCurrentLocale(bestLang);
                        
                        // Update URL if needed
                        if (bestLang && (!urlLang || urlLang !== bestLang)) {
                            const newSearchParams = new URLSearchParams(searchParams);
                            newSearchParams.set('lang', bestLang);
                            setSearchParams(newSearchParams, { replace: true });
                        }
                    } else {
                        // No custom translations, use default locale
                        const defaultLoc = getDefaultLocale(survey);
                        survey.locale = defaultLoc;
                        setCurrentLocale(defaultLoc);
                    }

                    survey.onAfterRenderSurvey.add((sender) => {
                        sender.showCompleteButton = surveyJSON.showCompleteButton;
                        sender.showNavigationButtons = surveyJSON.showNavigationButtons;

                        // Set default values
                        const defaultValues = {
                            'start_time': new Date(),
                            'survey_date': new Date(),
                            'event_id': res.event.fordEventID || params.eventID,
                            'app_version': 'surveyjs_1.0',
                            'abandoned': 0,
                            '_utm': extractUTM(),
                            '_referrer': window.frames?.top?.document?.referrer,
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

                    survey.onServerValidateQuestions.add((sender, options) => {
                        // loop & look for Bookeo
                        survey.getAllQuestions().forEach(question => {
                            console.log('question', question.name, question.getType());
                            if (question.getType() === "bookeo" && options.data[question.name]) {
                                const bookeoData = {
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
                                }

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

                    survey.onCompleting.add(async (sender, options) => {
                        console.log('=== Survey onCompleting Started ===');
                        
                        // Check survey limit before allowing submission
                        if (res.event.survey_count_limit && res.event.survey_count_limit > 0) {
                            const bypass = searchParams.get('bp');
                            const validateSurveyLimit = httpsCallable(functions, 'validateSurveyLimit');
                            
                            try {
                                const result = await validateSurveyLimit({ 
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
                    
                    survey.onComplete.add(async (sender, options) => {
                        console.log('=== Survey onComplete Started ===');
                        console.log('onComplete options:', options);
                        const originalMesage = sender.completedHtml;
                        console.log('originalMesage', originalMesage);
                        sender.completedHtml = "<h3>Saving...</h3>";
                        options.showDataSaving('Saving...');

                        let surveyData = sender.data;
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

                            // If this is a Ford event, also save to Ford API
                            if (res.event.fordEventID) {
                                console.log('[Ford Event] Starting Ford API submission process');
                                console.log('[Ford Event] Event ID:', res.event.fordEventID);
                                
                                const fordSurvey = mapSurveyToFordSurvey(survey, surveyData, res.event);
                                console.log('[Ford Event] fordSurvey from mapSurveyToFordSurvey:', JSON.stringify(fordSurvey, null, 2));
                                
                                // Merge fordSurvey with surveyData to ensure all expected fields are present
                                const mergedSurveyData = { ...fordSurvey, ...surveyData };
                                console.log('[Ford Event] mergedSurveyData before final adjustments:', JSON.stringify(mergedSurveyData, null, 2));
                                
                                // Ensure microsite_email_template is present (even if null)
                                if (!mergedSurveyData.microsite_email_template) {
                                    mergedSurveyData.microsite_email_template = null;
                                }
                                
                                // Log signature fields for debugging
                                console.log('[Ford Event] Signature fields before API call:', {
                                    signature: mergedSurveyData.signature,
                                    minor_signature: mergedSurveyData.minor_signature,
                                    signature_type: typeof mergedSurveyData.signature,
                                    minor_signature_type: typeof mergedSurveyData.minor_signature
                                });
                                
                                const fordPayload = { surveyCollection: [mergedSurveyData] };

                                console.log('[Ford Event] Final payload being sent to Ford API:', fordPayload);

                                // Save to Ford API
                                const fordRes = await fetch(getApiUrl(ENDPOINTS.SURVEY_UPLOAD_V11), {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': '989ae554-08ca-4142-862c-0058407d2769',
                                    },
                                    body: JSON.stringify(fordPayload),
                                });

                                if (!fordRes.ok) {
                                    throw new Error(fordRes.statusText);
                                }

                                const fordData = await fordRes.json();
                                console.log('saved to ford api', fordData);

                                // If there are vehicles of interest, save those too
                                if (fordSurvey.voi && fordSurvey.voi.length) {
                                    const voiBody = fordSurvey.voi.map(vehicle_id => ({
                                        vehicle_id,
                                        device_survey_guid: surveyData.device_survey_guid,
                                        survey_vehicle_guid: uuidv4(),
                                    }));

                                    const voiRes = await fetch(getApiUrl(ENDPOINTS.VEHICLES_INSERT), {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': '989ae554-08ca-4142-862c-0058407d2769',
                                        },
                                        body: JSON.stringify(voiBody),
                                    });

                                    if (!voiRes.ok) {
                                        throw new Error(voiRes.statusText);
                                    }

                                    console.log('saved voi');
                                }
                            }

                            options.showDataSavingSuccess();
                            sender.completedHtml = originalMesage;
                            if (location.state?.preSurveyID) {
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
                    setThisError(res);
                }
            });
        }).catch(err => {
            Sentry.captureException(err);
            alert(err);
        });
    }, [user]);

    return (
        limitReached ?
            <div className="survey-limit-message" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                <div dangerouslySetInnerHTML={{ __html: converter.makeHtml(limitMessage) }} />
            </div>
            :
        thisSurvey ?
            <div className="gdux-ford">
                {
                    thisEvent.fordEventID && (
                        <div className="fds-logo-only-header" style={{ position: 'relative', justifyContent: 'space-between' }}>
                            <div style={{ flex: '1' }}></div>
                            <img src={logo} alt="Ford" className="fds-header-logo" />
                            <div style={{ 
                                flex: '1', 
                                display: 'flex', 
                                justifyContent: 'flex-end' 
                            }}>
                                {supportedLocales.length > 1 && (
                                    <FordLanguageSelector
                                        survey={thisSurvey}
                                        supportedLocales={supportedLocales}
                                        currentLocale={currentLocale}
                                        onChange={handleLanguageChange}
                                    />
                                )}
                            </div>
                        </div>
                    )
                }
                {/* Show standard language selector only for non-Ford surveys */}
                {supportedLocales.length > 1 && !thisEvent.fordEventID && (
                    <LanguageSelector 
                        survey={thisSurvey}
                        supportedLocales={supportedLocales}
                        currentLocale={currentLocale}
                        onChange={handleLanguageChange}
                    />
                )}
                <div id="fd-nxt">
                    <Survey model={thisSurvey} />
                </div>
                {
                    thisEvent.fordEventID && (
                        <FordFooter />
                    )
                }
            </div>
            :
            thisError ? <h2>{thisError.message}</h2> : <Loader type="converging-spinner" size="large" />
    )
}

export default SurveyComponent;
