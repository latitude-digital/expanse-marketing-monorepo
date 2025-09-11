import React, { useEffect, useState } from "react";
import { Model, FunctionFactory } from "survey-core";
import { Survey } from "survey-react-ui";
import * as SurveyCore from "survey-core";  
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { SurveySkeleton } from '../components/LoadingStates';
import * as Sentry from "@sentry/react";
// import { Button } from '../../../ford-ui/packages/@ui/ford-ui-components/src/components/button'; // Commented out for TypeScript migration testing
import { mapToFordPayload } from '@meridian-event-tech/shared';
import { baseSurvey, incentiveThanks, activationThanks } from "./ExperienceSurvey";
import { baseSurvey as derbyBaseSurvey, themeOverride as derbyThemeOverride } from './DerbySurvey';
import { prepareForSurvey, prepareSurveyOnQuestionAdded } from "../helpers/surveyTemplatesAll";
import { extractUTM } from '../utils/surveyUtilities';
import { getApiUrl, ENDPOINTS } from '../config/api';
import { validateEmailForSurveyJS, type EmailValidationResponse } from '../utils/surveyUtilities';
import type { MeridianSurveyData as SurveyData } from '@meridian-event-tech/shared/types';

// Import FDS custom SurveyJS renderers
import { CheckboxVOIQuestion } from "../surveysjs_renderers/FDSRenderers/CheckboxVOI";
import { CheckboxVehiclesDrivenQuestion } from "../surveysjs_renderers/FDSRenderers/CheckboxVehiclesDriven";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/FDSRenderers/RadioButtonButton";

// Force execution of renderer registration by referencing the class
console.log('Experiential.tsx: CheckboxVehiclesDrivenQuestion loaded:', CheckboxVehiclesDrivenQuestion);

// Import Ford components
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import { FordSurveyNavigation } from '../components/FordSurveyNavigation';

// Import FDS initializer
import { initializeFDSForBrand } from '../helpers/fdsInitializer';

// Import Ford UI Button
import { StyledButton } from '@ui/ford-ui-components';

import "survey-core/survey-core.min.css";

// TypeScript interfaces
interface RouteParams {
  eventID: string;
}

interface OptInData {
  optin_id: string;
  optin_name: string;
  microsite_image_url: string;
  prompt: string;
  small_print: string;
}

interface CustomData {
  activation_event_code?: string;
  tailgateURL?: string;
  [key: string]: any;
}

interface EventData {
  event_id: string;
  event_name: string;
  ffs_ford_campaign?: string;
  event_ended?: boolean;
  custom_data?: string;
  custom_questions?: string;
  opt_in_data?: OptInData[];
  optin_ids?: string;
  waiver?: string;
  custom_minor_waiver?: string;
  microsite_incentives?: boolean;
  check_in_qr?: boolean;
}

interface EventResponse {
  data: EventData;
  message?: string;
}

interface OptIn {
  optin_id: string;
  optin: string;
}

interface VOI {
  vehicle_id: string;
  device_survey_guid: string;
  survey_vehicle_guid: string;
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: any;
        };
      };
    };
  }
}

SurveyCore.setLicenseKey(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZGJkM2NlNjI3OzE9MjAyNS0wMS0wNA=="
);

// fix the phone format
const formatPhone = (value: string): string => {
    if (value?.length !== 10) {
        return value;
    }
    const areaCode = value.substring(0, 3);
    const centralOfficeCode = value.substring(3, 6);
    const lineNumber = value.substring(6, 10);
    return `${areaCode}-${centralOfficeCode}-${lineNumber}`;
};

function validateEmail(this: any, params: any[]): void {
    const [email] = params as [string];
    console.log('[validateEmail]', arguments);
    if (!email) {
        this.returnResult();
        return;
    }

    fetch(getApiUrl(ENDPOINTS.VALIDATE_EMAIL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }).then(response => {
        response.json().then((res: EmailValidationResponse) => {
            const { results } = res;

            let valid = true;
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
            if (results?.delivery_confidence !== undefined && results.delivery_confidence < 20) {
                valid = false;
            }

            // typos are rejected with correction
            if (results.did_you_mean) {
                valid = false;
            }
            this.returnResult(valid);
        });
    }).catch(err => {
        Sentry.captureException(err);
        alert(err);
    });
}

FunctionFactory.Instance.register("validateEmail", validateEmail, true);

const SurveyComponent: React.FC = () => {
    const params = useParams<{ eventID: string }>();
    const [thisEvent, setThisEvent] = useState<EventData | null>(null);
    const [thisSurvey, setThisSurvey] = useState<Model | null>(null);
    const [customData, setCustomData] = useState<CustomData>({});
    const [customQuestions, setCustomQuestions] = useState<any>({});
    const [thisError, setThisError] = useState<Error | null>(null);
    const [showActivationQRCode, setShowActivationQRCode] = useState<boolean>(false);
    const [deviceSurveyGuid, setDeviceSurveyGuid] = useState<string | undefined>();

    useEffect(() => {
        if (!params.eventID) return;

        fetch(getApiUrl(ENDPOINTS.EVENTS_CHECK), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '989ae554-08ca-4142-862c-0058407d2769',
            },
            body: JSON.stringify({ hashed_event_id: params.eventID }),
        }).then(response => {
            response.json().then(async (res: EventResponse) => {
                const retEvent = res.data;
                const retCustomData: CustomData = JSON.parse(retEvent.custom_data || '{}');
                // const retCustomQuestions = JSON.parse(retEvent.custom_questions || '{}');
                
                setThisEvent(res.data);
                setCustomData(JSON.parse(res.data.custom_data || '{}'));
                setCustomQuestions(JSON.parse(res.data.custom_questions || '{}'));

                if (res.data) {
                    document.title = res.data.event_name;

                    // Conditionally use DerbySurvey baseSurvey if ffs_ford_campaign is 700397
                    let surveyJSON: any;
                    
                    if (retCustomData.tailgateURL) {
                        surveyJSON = derbyBaseSurvey;
                    } else {
                        surveyJSON = baseSurvey;
                    }

                    surveyJSON.title = res.data.event_name;
                    
                    // Set responsive width mode
                    surveyJSON.widthMode = "responsive";

                    // if there are opt-ins, add them
                    if (res.data.opt_in_data?.length) {
                        for (const i in res.data.opt_in_data) {
                            const thisOptIn = res.data.opt_in_data[i];

                            surveyJSON.pages[0].elements.push({
                                "type": "panel",
                                "name": `panelOptins${i}`,
                                "elements": [
                                    {
                                        "type": "image",
                                        "imageLink": thisOptIn.microsite_image_url,
                                        "altText": thisOptIn.optin_name,
                                        "contentMode": "image",
                                        "imageFit": "contain"
                                    },
                                    {
                                        "type": "radiogroup",
                                        "renderAs": "radiobuttongroup",
                                        "buttonSize": "medium",
                                        "name": `opt_in_${thisOptIn.optin_id}`,
                                        "title": thisOptIn.prompt,
                                        "description": thisOptIn.small_print,
                                        "descriptionLocation": "underInput",
                                        "isRequired": true,
                                        "choices": [
                                            {
                                                "value": "yes",
                                                "text": "Yes"
                                            },
                                            {
                                                "value": "no",
                                                "text": "No"
                                            },
                                        ]
                                    }
                                ]
                            });
                        }
                    }

                    // TODO: use our real waiver / minor waiver SurveyJS question types
                    // if there's a waiver, add it
                    if (res.data.waiver) {
                        const waiverText = JSON.parse(res.data.waiver).english.body.replace(/(?:\r\n|\r|\n)/g, '<br/><br/>');

                        let waiverPage:any = {
                            "name": "pageWaiver",
                            "elements": [
                                {
                                    "type": "panel",
                                    "name": "panelWaiver",
                                    "elements": [
                                        {
                                            "type": "html",
                                            "html": `<p>Please read and sign the waiver below</p>
<br/>
<div style="border: 1px solid darkGray;font-size: 14px;height: 300px;padding: 10px;margin-bottom: 40px;overflow: scroll;@media(min-width: 768px) {height: 375px;}">
${waiverText}
</div>`
                                        },
                                        {
                                            "type": "text",
                                            "name": "signature",
                                            "title": "Signature",
                                            "isRequired": true,
                                            "placeholder": "Type to Sign"
                                        },
                                        {
                                            "type": "checkbox",
                                            "name": "waiver_agree",
                                            "titleLocation": "hidden",
                                            "isRequired": true,
                                            "choices": [
                                                {
                                                    "value": "Item 3",
                                                    "text": "By typing your name you indicate that you have read and agree to the waiver provided here."
                                                }
                                            ]
                                        }
                                    ]
                                },
                            ]
                        };

                        // if there is a waiver and a minor waiver, add the minor waiver
                        if (res.data.custom_minor_waiver) {
                            const minorWaiverText = JSON.parse(res.data.custom_minor_waiver).english.replace(/(?:\r\n|\r|\n)/g, '<br/><br/>');

                            waiverPage.elements.push({
                                "type": "panel",
                                "name": "minorWaiverPanel",
                                "elements": [
                                    {
                                        "type": "radiogroup",
                                        "name": "minorsYesNo",
                                        "title": "I have minors accompanying me",
                                        "isRequired": true,
                                        "choices": [
                                            {
                                                "value": "1",
                                                "text": "Yes"
                                            },
                                            {
                                                "value": "0",
                                                "text": "No"
                                            }
                                        ]
                                    },
                                    {
                                        "type": "html",
                                        "visibleIf": "{minorsYesNo} = '1'",
                                        "html": `<p>Please read and sign the waiver below</p>
<br/>
<div style="border: 1px solid darkGray;font-size: 14px;height: 200px;padding: 10px;margin-bottom: 40px;overflow: scroll;@media(min-width: 768px) {height: 375px;}">
${minorWaiverText}
</div>`
                                    },
                                    {
                                        "type": "text",
                                        "name": "minorName1",
                                        "visibleIf": "{minorsYesNo} = '1'",
                                        "title": "Full Name of Minor 1",
                                        "isRequired": true
                                    },
                                    {
                                        "type": "text",
                                        "name": "minorName2",
                                        "visibleIf": "{minorsYesNo} = '1'",
                                        "title": "Full Name of Minor 2"
                                    },
                                    {
                                        "type": "text",
                                        "name": "minorName3",
                                        "visibleIf": "{minorsYesNo} = '1'",
                                        "title": "Full Name of Minor 3"
                                    },
                                    {
                                        "type": "text",
                                        "name": "minor_signature",
                                        "visibleIf": "{minorsYesNo} = '1'",
                                        "title": "Parent / Guardian Signature",
                                        "isRequired": true,
                                        "placeholder": "Type to Sign"
                                    },
                                    {
                                        "type": "checkbox",
                                        "name": "minor_waiver_agree",
                                        "visibleIf": "{minorsYesNo} = '1'",
                                        "titleLocation": "hidden",
                                        "isRequired": true,
                                        "choices": [
                                            {
                                                "value": "Item 1",
                                                "text": "By typing your name you indicate that you have read and agree to the waiver provided here."
                                            }
                                        ]
                                    }
                                ]
                            });
                        }

                        surveyJSON.pages.push(waiverPage);
                    }

                    // Initialize FDS for Ford brand - MUST happen before new Model()
                    console.log('Initializing FDS for Ford brand');
                    try {
                        await initializeFDSForBrand('Ford');
                    } catch (error) {
                        console.error('Failed to initialize FDS:', error);
                        // Continue with survey creation even if FDS fails
                    }

                    const survey = new Model(surveyJSON);
                    
                    // Set Ford theme settings (panelless appearance)
                    survey.questionErrorLocation = "bottom";
                    survey.showNavigationButtons = false; // Hide built-in navigation for custom Ford navigation
                    
                    let themeOverride: SurveyCore.ITheme = {};
                    if (retCustomData.tailgateURL) {
                        console.log('[Experiential.tsx] Using Derby theme override for tailgate URL', derbyThemeOverride);
                        themeOverride = derbyThemeOverride;

                        survey.title = " ";
                        survey.description = " ";
                        survey.showTitle = true;
                    }

                    const fordTheme: SurveyCore.ITheme = {
                        isPanelless: true,
                        cssVariables: {
                            "--sjs-general-backcolor-dim": "#ffffff",
                            "--sjs-primary-backcolor": "#0562d2", // Ford blue
                            "--sjs-primary-backcolor-light": "rgba(5, 98, 210, 0.1)",
                            "--sjs-primary-backcolor-dark": "#044ea7",
                            "--sjs-primary-forecolor": "#ffffff",
                            "--sjs-primary-forecolor-light": "rgba(255, 255, 255, 0.25)",
                        },
                        ...themeOverride,
                    };
                    survey.applyTheme(fordTheme);
                    console.log('[Experiential.tsx] fordTheme', fordTheme);
                    
                    prepareForSurvey(survey, 'Ford');

                    survey.onAfterRenderSurvey.add((sender: Model) => {
                        const deviceSurveyGuid = uuidv4();
                        setDeviceSurveyGuid(deviceSurveyGuid);
                        
                        // Set default values matching Survey.tsx pattern
                        const defaultValues: SurveyData = {
                            'device_survey_guid': deviceSurveyGuid,
                            'start_time': new Date(),
                            'survey_date': new Date(),
                            'event_id': res.data?.event_id,
                            'app_version': 'surveyjs_2.0',
                            'abandoned': 0,
                            'custom_data': {},
                            // Add missing browser and environment data
                            '_utm': { ...extractUTM() },
                            '_referrer': (window as any).frames?.top?.document?.referrer,
                            '_language': window.navigator?.language,
                            'device_id': window.navigator?.userAgent,
                            '_screenWidth': window.screen?.width,
                            '_offset': (new Date()).getTimezoneOffset(),
                            '_timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                        };
                        
                        // Set all default values
                        Object.entries(defaultValues).forEach(([key, value]) => {
                            sender.setValue(key, value);
                        });
                        
                        console.log('survey started', sender.getValue('device_survey_guid'));
                        console.log('Default values set:', defaultValues);
                    });

                    survey.onComplete.add((sender: Model, options: any) => {
                        // Early exit: If "Under 18" is selected, end survey immediately and do NOT submit
                        if (survey.getValue('ageBracket') === 'Under 18') {
                            sender.completedHtml = sender.completedHtml || '<h3>Thank you for your participation.</h3>';
                            options.showDataSavingSuccess();
                            return;
                        }

                        let originalMessage = sender.completedHtml;
                        console.log('originalMessage', originalMessage);
                        sender.completedHtml = "<h3>Saving, please wait...</h3>";
                        options.showDataSaving('Saving, please wait...');
                        survey.setValue('end_time', new Date());

                        survey.setValue("phone", formatPhone(survey.getValue("phone")));

                        const optInArray = res.data.optin_ids?.split(',') || [];
                        console.log('res.data.optin_ids', res.data.optin_ids);
                        console.log('optInArray', optInArray);

                        // move opt-ins to array
                        let optins: OptIn[] = [];
                        for (const optInID of optInArray) {
                            optins.push({
                                optin_id: optInID,
                                optin: survey.getValue(`opt_in_${optInID}`),
                            });
                        }
                        survey.setValue("optins", optins || []);

                        let surveyData: SurveyData = sender.data;
                        console.log('[onComplete] Initial survey data:', JSON.stringify(surveyData, null, 2));
                        
                        // Set hidden tracking properties (matching Survey.tsx pattern)
                        surveyData['_preSurveyID'] = null;
                        surveyData['_checkedIn'] = null;
                        surveyData['_checkedOut'] = null;
                        surveyData['_claimed'] = null;
                        surveyData['_used'] = null;
                        surveyData['_email'] = null;
                        surveyData['_sms'] = null;
                        surveyData['_exported'] = null;
                        surveyData['end_time'] = new Date();
                        
                        // Ensure device_survey_guid is set (if not already set in onAfterRenderSurvey)
                        if (!surveyData['device_survey_guid']) {
                            surveyData['device_survey_guid'] = uuidv4();
                        }
                        
                        // Add specific fields
                        surveyData["optins"] = survey.getValue("optins") || null;
                        surveyData["signature"] = survey.getValue("signature") || null;
                        surveyData["minor_signature"] = survey.getValue("minor_signature") || null;

                        survey.getAllQuestions().forEach((question: any) => {
                            surveyData[question.valueName || question.name] = (typeof question.value === 'undefined' || question.value === null) ? null : question.value;
                        });

                        console.log('survey completed with all fields', JSON.stringify(surveyData));

                        // if this is a activation_event_code, add special properties to customData
                        if (retCustomData.activation_event_code) {
                            console.log(
                                '[DEBUG] activation_event_code detected',
                                {
                                    activation_event_code: retCustomData.activation_event_code,
                                    retEvent,
                                    retCustomData,
                                    customData: surveyData.customData,
                                }
                            );
                            surveyData.customData = {
                                ...(surveyData.customData || {}),
                                activation_event_code: retCustomData.activation_event_code,
                                source: retEvent.event_id,
                                used: [retEvent.event_id],
                                scans: [],
                            };
                        }

                        // save survey (v10 only, using FordSurvey)
                        const fordSurvey = mapToFordPayload(survey, surveyData, retEvent as any);
                        // IMPORTANT: fordSurvey should override surveyData to ensure _ffs mapped fields are included
                        const mergedSurveyData = { ...surveyData, ...fordSurvey };

                        fetch(getApiUrl(ENDPOINTS.SURVEY_UPLOAD_V10), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': '989ae554-08ca-4142-862c-0058407d2769',
                            },
                            body: JSON.stringify({
                                surveyCollection: [mergedSurveyData]
                            }),
                        }).then((res) => {
                            if (res.ok) {
                                return res.json();
                            }

                            Sentry.captureException(new Error(res.statusText));
                            throw new Error(res.statusText);
                        }).then(res => {
                            console.log('saved to latitude', res);

                            const showQRCode = retEvent.microsite_incentives || retEvent.check_in_qr;
                            if (showQRCode) {
                                // replace all {key} with surveyData[key]
                                originalMessage = incentiveThanks.replace(/{([^}]+)}/g, (match, key) => {
                                    return String(surveyData[key] !== undefined ? surveyData[key] : match);
                                });
                                console.log('originalMessage', originalMessage);
                            }

                            setShowActivationQRCode(!!retCustomData.activation_event_code);

                            const showActivationQRCode = retCustomData.activation_event_code;
                            if (showActivationQRCode) {
                                // replace all {key} with surveyData[key]
                                originalMessage = activationThanks.replace(/{([^}]+)}/g, (match, key) => {
                                    return String(surveyData[key] !== undefined ? surveyData[key] : match);
                                });
                                console.log('originalMessage', originalMessage);
                            }

                            if (surveyData.fordVOI) {
                                surveyData.voi = surveyData.fordVOI;
                            }

                            const showSuccess = () => {
                                sender.completedHtml = originalMessage;
                                options.showDataSavingSuccess();
                            };

                            // VOI and vehicles_driven are now embedded in the v10 payload (no separate calls)
                            if (showQRCode) {
                                setTimeout(showSuccess, 15000);
                            } else {
                                showSuccess();
                            }

                        }).catch(err => {
                            console.error('error', err);
                            Sentry.captureException(err);
                            options.showDataSavingError();
                        });
                    });

                    survey.onAfterRenderQuestionInput.add((sender: Model, options: any) => {
                        if (options.question.name === "address1") {
                            const autocomplete = new window.google.maps.places.Autocomplete(options.htmlElement, {
                                types: ['address'],
                                componentRestrictions: {
                                    country: ['us'],
                                },
                                fields: ['address_components', 'formatted_address'],
                                ...options.question.addressAutocompleteConfig,
                            });

                            autocomplete.addListener('place_changed', async function () {
                                const place = await autocomplete.getPlace();

                                const ParsedData: any = {
                                    formatted_address: place.formatted_address,
                                };

                                const postalData = place.address_components?.find((item: any) => item.types.includes("postal_code"));
                                const countryData = place.address_components?.find((item: any) => item.types.includes("country"));
                                const addressData = place.address_components?.find((item: any) => item.types.includes("administrative_area_level_1"));
                                const cityData = place.address_components?.find((item: any) => item.types.includes("locality"));
                                const routeData = place.address_components?.find((item: any) => item.types.includes("route"));
                                const streetNumberData = place.address_components?.find((item: any) => item.types.includes("street_number"));

                                ParsedData.address1 = ([streetNumberData?.long_name, routeData?.long_name].join(' ')).trim();
                                ParsedData.city = (cityData == null) ? "" : cityData.long_name;
                                ParsedData.state = (addressData == null) ? "" : addressData.short_name;
                                ParsedData.zip_code = (postalData == null) ? "" : postalData.long_name;
                                ParsedData.country = (countryData == null) ? "" : countryData.short_name;

                                ['address1', 'city', 'state', 'zip_code', 'country'].forEach(key => {
                                    try {
                                        survey.setValue(key, ParsedData[key], true, true);
                                    } catch (e) {
                                        console.log('error', e);
                                    }
                                });
                            });
                        }
                    });

                    // Creator not used here; pass a placeholder to satisfy types
                    prepareSurveyOnQuestionAdded({} as any, { survey } as any);
                    setThisSurvey(survey);
                } else {
                    const err = new Error(res.message || 'Unknown error');
                    Sentry.captureException(err);
                    setThisError(err);
                }
            });
        }).catch(err => {
            Sentry.captureException(err);
            alert(err);
        });
    }, []);

    if (thisError) {
        return <h2>{thisError.message}</h2>;
    }

    if (!thisSurvey) {
        return <SurveySkeleton />;
    }

    if (thisEvent?.event_ended) {
        return <h1>This event has already ended.</h1>;
    }

    return (
        <div className="gdux-ford">
            {/* Ford Header */}
            <GlobalHeader
                brand="Ford"
                showLanguageChooser={false}
                supportedLocales={[]}
                currentLocale="en"
                onLanguageChange={() => {}}
            />
            
            {showActivationQRCode && customData.activation_event_code === 'lions' && (
                <>
                    <img
                        src="https://cdn.latitudewebservices.com/expanse_marketing/2025/2025_DetroitLions_ThankYouHeader_1000x400.png"
                        alt="Ford Lions Tailgate Sweepstakes"
                        style={{ width: '100%', marginBottom: 16 }}
                    />
                    <div style={{
                        fontFamily: 'FordF1, arial, sans-serif',
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 2px 8px 0 rgba(60,72,88,.08)',
                        padding: 24,
                        textAlign: 'center',
                        maxWidth: 430,
                        margin: '0 auto -24px auto'
                    }}>
                        <h3 style={{ fontWeight: 700, fontSize: 32 }}>
                            Enter for a chance to win the Ford Tailgate Sweepstakes!
                        </h3>
                        <div style={{ marginBottom: 20 }}>
                            <p>Enter today for your chance to drive home the grand prize: a custom, Lions-wrapped 2025 Ford vehicle.</p>
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                                <StyledButton
                                    variant="primary"
                                    onClick={() => customData.tailgateURL && deviceSurveyGuid ? window.open(`${customData.tailgateURL}${deviceSurveyGuid}`, '_blank') : undefined}
                                >
                                    LET'S PLAY
                                </StyledButton>
                            </div>
                            <p>No duplicate entry required -- your information is saved.</p>
                            <p style={{ fontSize: 12 }}>NO PURCHASE NECESSARY. A purchase will not increase your chances of winning. Sweepstakes begins at 12:00 a.m. ET on 8/7/25 and ends at 11:59:59 p.m. ET on 1/31/26 and includes multiple entry periods. Open to legal residents of 50 U.S./D.C., 18 years of age who have a valid driver's license at the time of entry. <a href="https://fordtailgaterules.com/" target="_blank">Click here</a> for Official Rules, including how to enter, odds, prize details, and restrictions. Void where prohibited. Message and data rates may apply. Sponsor: Ford Motor Company, 16800 Executive Drive, Dearborn, MI 48126.</p>
                        </div>
                    </div>
                </>
            )}
            
            {/* Ford theme wrapper */}
            <div id="fd-nxt" className="ford_light">
                <Survey model={thisSurvey} />
                
                {/* Ford custom navigation */}
                <FordSurveyNavigation 
                    survey={thisSurvey} 
                    brand="Ford" 
                />
            </div>
            
            {/* Ford Footer */}
            <GlobalFooter
                brand="Ford"
                supportedLanguages={[]}
                currentLocale="en"
                onLanguageChange={() => {}}
                showLanguageSelector={false}
            />
        </div>
    );
};

export default SurveyComponent;
