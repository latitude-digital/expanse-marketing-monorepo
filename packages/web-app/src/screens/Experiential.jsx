import { useEffect, useState } from "react";
import { Model, FunctionFactory } from "survey-core";
import { Survey } from "survey-react-ui";
import * as SurveyCore from "survey-core";
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { Loader } from "@progress/kendo-react-indicators";
import * as Sentry from "@sentry/react";
import { Button } from '../../../ford-ui/packages/@ui/ford-ui-components/src/components/button';
import { mapSurveyToFordSurvey } from '../helpers/mapSurveyToFord';
import { baseSurvey, incentiveThanks, activationThanks } from "./ExperienceSurvey";
import { baseSurvey as derbyBaseSurvey } from './DerbySurvey';
import { themeJSON as fordThemeJSON } from "../themes/surveyJS/ford";
import { prepareForSurvey, prepareSurveyOnQuestionAdded } from "../helpers/surveyTemplatesAll";
import { getApiUrl, ENDPOINTS } from '../config/api';

import { CheckboxVOIQuestion } from "../surveysjs_renderers/CheckboxVOI";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/RadioButtonButton";

import "survey-core/defaultV2.min.css";

import "./Surveys.css";

SurveyCore.setLicenseKey(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNS0wMS0wNA=="
);

// fix the phone format
const formatPhone = (value) => {
    if (value?.length !== 10) {
        return value;
    }
    const areaCode = value.substring(0, 3);
    const centralOfficeCode = value.substring(3, 6);
    const lineNumber = value.substring(6, 10);
    return `${areaCode}-${centralOfficeCode}-${lineNumber}`;
};

function validateEmail([email]) {
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
        response.json().then((res) => {
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
            if (results?.delivery_confidence < 20) {
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

function SurveyComponent() {
    const params = useParams();
    const [thisEvent, setThisEvent] = useState();
    const [thisSurvey, setThisSurvey] = useState();
    const [customData, setCustomData] = useState({}); 
    const [customQuestions, setCustomQuestions] = useState({});
    const [thisError, setThisError] = useState();
    const [showActivationQRCode, setShowActivationQRCode] = useState(false);
    const [deviceSurveyGuid, setDeviceSurveyGuid] = useState();

    useEffect(() => {
        fetch(getApiUrl(ENDPOINTS.EVENTS_CHECK), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '989ae554-08ca-4142-862c-0058407d2769',
            },
            body: JSON.stringify({ hashed_event_id: params.eventID }),
        }).then(response => {
            response.json().then((res) => {
                const retEvent = res.data;
                const retCustomData = JSON.parse(retEvent.custom_data || '{}');
                const retCustomQuestions = JSON.parse(retEvent.custom_questions || '{}');
                
                setThisEvent(res.data);
                setCustomData(JSON.parse(res.data.custom_data || '{}'));
                setCustomQuestions(JSON.parse(res.data.custom_questions || '{}'));

                if (res.data) {
                    document.title = res.data.event_name;
                    // if the favicon is defined
                    if (fordThemeJSON.favicon) {
                        var link = document.querySelector("link[rel~='icon']");
                        link.href = fordThemeJSON.favicon;
                    }

                    // Conditionally use DerbySurvey baseSurvey if ffs_ford_campaign is 700397
                    let surveyJSON;
                    if (res.data.ffs_ford_campaign === "700397") {
                        surveyJSON = derbyBaseSurvey;
                    } else {
                        surveyJSON = baseSurvey;
                    }
                    surveyJSON.title = res.data.event_name;

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
                                        "imageLink": thisOptIn.microsite_image_url, //https://cdn.latitudewebservices.com/optins/images/ford_performance_microsite.png
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
                            })
                        }
                    }

                    // if there's a waiver, add it
                    if (res.data.waiver) {
                        const waiverText = JSON.parse(res.data.waiver).english.body.replace(/(?:\r\n|\r|\n)/g, '<br/><br/>');

                        let waiverPage =
                        {
                            "name": "pageWaiver",
                            "elements": [
                                {
                                    "type": "panel",
                                    "name": "panelWaiver",
                                    "elements": [
                                        {
                                            "type": "html",
                                            "html": `<p>Please read and sign the waiver below</p>\n<br/>\n<div style=\"border: 1px solid darkGray;font-size: 14px;height: 300px;padding: 10px;margin-bottom: 40px;overflow: scroll;@media(min-width: 768px) {height: 375px;}\">\n${waiverText}\n</div>`
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
                        }

                        // if there is a waiver and a minor waiver, add the minor waiver
                        if (res.data.custom_minor_waiver) {
                            const minorWaiverText = JSON.parse(res.data.custom_minor_waiver).english.replace(/(?:\r\n|\r|\n)/g, '<br/><br/>');

                            waiverPage.elements.push(
                                {
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
                                            "html": `<p>Please read and sign the waiver below</p>\n<br/>\n<div style=\"border: 1px solid darkGray;font-size: 14px;height: 200px;padding: 10px;margin-bottom: 40px;overflow: scroll;@media(min-width: 768px) {height: 375px;}\">\n${minorWaiverText}\n</div>`
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
                                            "title": "Parent/Guardian Signature",
                                            "isRequired": true,
                                            "placeholder": "Type to Sign"
                                        }
                                    ]
                                }
                            )
                        }

                        surveyJSON.pages.push(waiverPage);
                    }

                    const survey = new Model(surveyJSON);
                    prepareForSurvey(survey);
                    survey.applyTheme(fordThemeJSON);

                    survey.onUpdateQuestionCssClasses.add((sender, options) => {
                        if (options.question.name === "signature") {
                            options.cssClasses.root += " signatureInput";
                        }
                        if (options.question.name === "minor_signature") {
                            options.cssClasses.root += " signatureInput";
                        }
                    })

                    survey.onAfterRenderSurvey.add((sender) => {
                        sender.setValue('start_time', new Date());
                        sender.setValue("address2", '');
                        sender.setValue("device_survey_guid", uuidv4());
                        setDeviceSurveyGuid(sender.getValue('device_survey_guid'));
                        sender.setValue("device_id", window.navigator.userAgent);
                        sender.setValue('survey_date', new Date());
                        sender.setValue("event_id", res.data.event_id);
                        sender.setValue("app_version", 'surveyjs_0.1');
                        sender.setValue("abandoned", 0);
                        sender.setValue("custom_data", {});
                        console.log('survey started', sender.getValue('device_survey_guid'));
                    });

                    survey.onComplete.add((sender, options) => {
                        // Early exit: If "Under 18" is selected, end survey immediately and do NOT submit
                        if (survey.getValue('ageBracket') === 'Under 18') {
                            sender.completedHtml = sender.completedHtml || '<h3>Thank you for your participation.</h3>';
                            options.showDataSavingSuccess();
                            return;
                        }

                        let originalMesage = sender.completedHtml;
                        console.log('originalMesage', originalMesage);
                        sender.completedHtml = "<h3>Saving, please wait...</h3>";
                        options.showDataSaving('Saving, please wait...');
                        survey.setValue('end_time', new Date());

                        survey.setValue("phone", formatPhone(survey.getValue("phone")));

                        const optInArray = res.data.optin_ids?.split(',') || [];
                        console.log('res.data.optin_ids', res.data.optin_ids);
                        console.log('optInArray', optInArray);

                        // move opt-ins to array
                        let optins = [];
                        for (const optInID of optInArray) {
                            optins.push({
                                optin_id: optInID,
                                optin: survey.getValue(`opt_in_${optInID}`),
                            });
                        }
                        survey.setValue("optins", optins || []);

                        let surveyData = sender.data;
                        surveyData["optins"] = survey.getValue("optins") || null;
                        surveyData["signature"] = survey.getValue("signature") || null;
                        surveyData["minor_signature"] = survey.getValue("minor_signature") || null;

                        survey.getAllQuestions().forEach(question => {
                            surveyData[question.valueName || question.name] = (typeof question.value === 'undefined' || question.value === null) ? null : question.value;
                        });

                        console.log('survey completed', JSON.stringify(surveyData));

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
                                ...surveyData.customData,
                                activation_event_code: retCustomData.activation_event_code,
                                source: retEvent.event_id,
                                used: [retEvent.event_id],
                                scans: [],
                            };
                        }

                        // save survey (v10 only, using FordSurvey)
                        const fordSurvey = mapSurveyToFordSurvey(survey, surveyData, retEvent);
                        const mergedSurveyData = { ...fordSurvey, ...surveyData };
                        

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
                                originalMesage = incentiveThanks.replace(/{([^}]+)}/g, (match, key) => {
                                    return surveyData[key] !== undefined ? surveyData[key] : match;
                                });
                                console.log('originalMesage', originalMesage);
                            }

                            setShowActivationQRCode(retCustomData.activation_event_code);
                            const showActivationQRCode = retCustomData.activation_event_code;
                            if (showActivationQRCode) {
                                // replace all {key} with surveyData[key]
                                originalMesage = activationThanks.replace(/{([^}]+)}/g, (match, key) => {
                                    return surveyData[key] !== undefined ? surveyData[key] : match;
                                });
                                console.log('originalMesage', originalMesage);
                            }    

                            if (surveyData.fordVOI) {
                                surveyData.voi = surveyData.fordVOI;
                            }
                            const voiBody = surveyData.voi.map(vehicle_id => {
                                return {
                                    vehicle_id,
                                    device_survey_guid: surveyData.device_survey_guid,
                                    survey_vehicle_guid: uuidv4(),
                                }
                            });

                            const showSuccess = () => {
                                sender.completedHtml = originalMesage;
                                options.showDataSavingSuccess();
                            };

                            if (voiBody && voiBody.length) {
                                fetch(getApiUrl(ENDPOINTS.VEHICLES_INSERT), {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': '989ae554-08ca-4142-862c-0058407d2769',
                                    },
                                    body: JSON.stringify(voiBody),
                                }).then((res) => {
                                    if (res.ok) {
                                        return res.json();
                                    }

                                    Sentry.captureException(new Error(res.statusText));

                                    throw new Error(res.statusText);
                                }).then(res => {
                                    console.log('saved voi');
                                    if (showQRCode) {
                                        setTimeout(showSuccess, 15000);
                                    } else {
                                        showSuccess()
                                    }
                                });
                            } else {
                                console.log('no voi');
                                if (showQRCode) {
                                    setTimeout(showSuccess, 15000);
                                } else {
                                    showSuccess()
                                }
                            }

                        }).catch(err => {
                            console.error('error', err);
                            Sentry.captureException(err);
                            options.showDataSavingError();
                        });
                    });

                    survey.onAfterRenderQuestionInput.add((sender, options) => {
                        if (options.question.name === "address1") {
                            const autocomplete = new google.maps.places.Autocomplete(options.htmlElement, {
                                types: ['address'],
                                componentRestrictions: {
                                    country: ['us'],
                                },
                                fields: ['address_components', 'formatted_address'],
                                ...options.question.addressAutocompleteConfig,
                            });

                            autocomplete.addListener('place_changed', async function () {
                                const place = await autocomplete.getPlace();

                                const ParsedData = {
                                    formatted_address: place.formatted_address,
                                };

                                const postalData = place.address_components?.find(item => item.types.includes("postal_code"));
                                const countryData = place.address_components?.find(item => item.types.includes("country"));
                                const addressData = place.address_components?.find(item => item.types.includes("administrative_area_level_1"));
                                const cityData = place.address_components?.find(item => item.types.includes("locality"));
                                const routeData = place.address_components?.find(item => item.types.includes("route"));
                                const streetNumberData = place.address_components?.find(item => item.types.includes("street_number"));

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

                    prepareSurveyOnQuestionAdded(null, { survey });
                    setThisSurvey(survey);
                } else {
                    Sentry.captureException(err);
                    setThisError(res);
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
        return <Loader type="converging-spinner" size="large" />;
    }

    if (thisEvent.event_ended) {
        return <h1>This event has already ended.</h1>;
    }

    return (
        <>
            {showActivationQRCode && customData.activation_event_code === 'derby' && (
                <div style={{
                    fontFamily: 'FordF1, arial, sans-serif',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px 0 rgba(60,72,88,.08)',
                    marginBottom: 24,
                    padding: 24,
                    textAlign: 'center',
                    maxWidth: 430,
                    margin: '0 auto 24px auto'
                }}>
                    <h3 style={{ fontWeight: 700, fontSize: 32 }}>
                        Enter for a chance to win the <span style={{ whiteSpace: 'nowrap' }}>Ford Stable Contest!</span>
                    </h3>
                    <div style={{ marginBottom: 20 }}>
                        <p>Pick the winning order of the top 10 horses competing in the Kentucky Derby for your chance to win the Ford Stable: F-150® Truck, Bronco® SUV, and a Mustang® Coupe.</p>
                        <Button
                            style={{ margin: '12px auto', display: 'block', fontWeight: 700 }}
                            onClick={() => customData.derbyURL && deviceSurveyGuid ? window.open(`${customData.derbyURL}${deviceSurveyGuid}`, '_blank') : undefined}
                            variant="primary"
                            background="onLight"
                        >
                            LET'S PLAY
                        </Button>
                        <p>No duplicate entry required -- your information is saved.</p>
                        <p style={{ fontSize: 12 }}>NO PURCH. NEC. 50 US/DC 21+ with valid driver's license. Begins 4/26/25; ends 5/3/25. Visit www.fordstable.com for rules.</p>
                    </div>
                </div>
            )}
            <Survey model={thisSurvey} />
        </>
    );
}

export default SurveyComponent;