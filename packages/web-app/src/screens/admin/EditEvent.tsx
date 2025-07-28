import { useEffect, useState } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { getFirestore, doc, getDoc, Timestamp, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, setDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

import auth from '../../services/auth';
import app from '../../services/firebase';

import { slk, SurveyModel } from "survey-core";

import 'survey-analytics/survey.analytics.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import "./admin.css";

import _ from 'lodash';
import { Survey } from 'survey-react-ui';
import moment from 'moment';
import Showdown from 'showdown';

slk(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNS0wNy0xOSwyPTIwMjUtMDctMTksND0yMDI1LTA3LTE5"
);

const EEventConverter: FirestoreDataConverter<ExpanseEvent> = {
    toFirestore(event: ExpanseEvent): DocumentData {
        return {
            ...event,
            questions: JSON.stringify(event.questions || {}),
            theme: JSON.stringify(event.theme || {}),
            preRegDate: event.preRegDate ? Timestamp.fromDate(moment(event.preRegDate).startOf('day').toDate()) : null,
            startDate: Timestamp.fromDate(moment(event.startDate).startOf('day').toDate()),
            endDate: Timestamp.fromDate(moment(event.endDate).endOf('day').toDate()),
            fordEventID: event.fordEventID || null,
            surveyType: event.surveyType || null,
            _preEventID: event._preEventID || null,
            thanks: event.thanks || null,
            confirmationEmail: event.confirmationEmail || null,
            reminderEmail: event.reminderEmail || null,
            thankYouEmail: event.thankYouEmail || null,
            autoCheckOut: event.autoCheckOut || null,
            checkOutEmail: event.checkOutEmail || null,
            survey_count_limit: event.survey_count_limit || null,
            limit_reached_message: event.limit_reached_message || null,
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): ExpanseEvent {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            name: data.name,
            _preEventID: data._preEventID,
            preRegDate: data.preRegDate?.toDate(),
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            confirmationEmail: data.confirmationEmail,
            reminderEmail: data.reminderEmail,
            thankYouEmail: data.thankYouEmail,
            autoCheckOut: data.autoCheckOut,
            checkOutEmail: data.checkOutEmail,
            checkInDisplay: data.checkInDisplay,
            disabled: data.disabled,
            questions: JSON.parse(data.questions),
            theme: JSON.parse(data.theme),
            thanks: data.thanks,
            fordEventID: data.fordEventID || undefined,
            surveyType: data.surveyType || null,
            survey_count_limit: data.survey_count_limit || undefined,
            limit_reached_message: data.limit_reached_message || undefined,
        };
    },
};

function DashboardScreen() {
    const navigate = useNavigate();
    const params = useParams();

    const [user, userLoading, userError] = useAuthState(auth);
    const [thisEvent, setThisEvent] = useState<ExpanseEvent>();
    const [thisSurvey, setThisSurvey] = useState<SurveyModel>();

    const db = getFirestore(app);
    const eventID: string = params.eventID!;

    useEffect(() => {
        console.error(userError);
    }, [userError]);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            navigate('./login');
        }

        if (eventID === 'new') {
            setThisEvent({
                id: 'new',
                name: 'New Event',
                questions: {},
                theme: {},
                startDate: moment().add(7, 'days').toDate(),
                endDate: moment().add(7, 'days').toDate(),
            });
        } else {
            // get the event
            const eventRef = doc(db, "events", eventID).withConverter(EEventConverter);

            getDoc(eventRef).then((event) => {
                const eventData = event.data();
                setThisEvent(eventData);
            });
        }
    }, [userLoading]);

    useEffect(() => {
        if (!thisEvent) {
            return;
        }

        const surveyBaseUrl = window.location.origin + "/s/";
        const eventIdDescription = `The Event ID also serves as the URL (${surveyBaseUrl}{id})`;

        const surveyData = {
            "title": thisEvent.id === 'new' ? 'New Event' : `Edit Event ${thisEvent.id}`,
            "finishButton": "Save",
            "completedHtml": "Event Saved",
            "navigateToUrlOnCondition": [
                {
                    "expression": "{editSurvey} = true",
                    "url": "/admin/event/{id}/survey"
                },
                {
                    "expression": "{editSurvey} != true",
                    "url": "/admin"
                }
            ],
            "showQuestionNumbers": "off",
            "clearInvisibleValues": false,
            "checkErrorsMode": "onValueChanged",
            "autoGrowComment": true,
            "completeText": "Save",
            "widthMode": "responsive",
            "pages": [
                {
                    "name": "eventPage",
                    "elements": [
                        {
                            "type": "text",
                            "name": "id",
                            "title": "Event ID",
                            "description": `The Event ID also serves as the URL ${window.location.origin}/s/{id}`,
                            "descriptionLocation": "underInput",
                            "isRequired": true,
                            "readOnly": thisEvent.id !== 'new'
                        },
                        {
                            "type": "text",
                            "name": "name",
                            "title": "Event Name",
                            "isRequired": true
                        },
                        {
                            "type": "text",
                            "inputType": "date",
                            "name": "startDate",
                            "title": "Event Start",
                            "isRequired": true
                        },
                        {
                            "type": "text",
                            "inputType": "date",
                            "name": "endDate",
                            "title": "Event End",
                            "isRequired": true,
                            "validators": [
                                {
                                    "type": "expression",
                                    "text": "Event End must not be before Event Start",
                                    "expression": "{startDate} <= {endDate}"
                                }
                            ],
                            "startWithNewLine": false
                        },
                        // Ford Event Panel
                        {
                            "type": "panel",
                            "name": "fordEventPanel",
                            "title": "Ford Event Configuration",
                            "elements": [
                                {
                                    "type": "text",
                                    "name": "fordEventID",
                                    "title": "Ford Event ID",
                                    "description": "The Ford Event ID is used for internal tracking",
                                    "descriptionLocation": "underInput"
                                },
                                {
                                    "type": "radiogroup",
                                    "name": "surveyType",
                                    "title": "Survey Type",
                                    "visibleIf": "{fordEventID} != ''",
                                    "defaultValue": "basic",
                                    "choices": [
                                        { "value": "basic", "text": "Basic" },
                                        { "value": "preTD", "text": "PreTD" },
                                        { "value": "postTD", "text": "PostTD" }
                                    ]
                                }
                            ]
                        },
                        // Pre-Event Panel
                        {
                            "type": "panel",
                            "name": "preEventPanel",
                            "title": "Pre/Post Event Configuration",
                            "elements": [
                                {
                                    "type": "text",
                                    "name": "_preEventID",
                                    "title": "Pre-Event Expanse ID",
                                    "description": "The Expanse ID of the pre-event",
                                    "descriptionLocation": "underInput"
                                },
                                {
                                    "type": "text",
                                    "name": "checkOutEmailTemplateId",
                                    "title": "Check-out Email Template ID",
                                    "description": "The ID of the email template to use for check-out notifications",
                                    "descriptionLocation": "underInput",
                                    "visibleIf": "{_preEventID} notempty or {surveyType} = 'preTD'"
                                }
                            ]
                        },
                        {
                            "type": "boolean",
                            "name": "enablePreRegistration",
                            "title": "Enable Pre-registration?",
                            "visibleIf": "{sendThankYouEmail} = false",
                            "defaultValue": false
                        },
                        // Panel for Pre-registration fields (Visible if enablePreRegistration is true)
                        {
                            "type": "panel",
                            "name": "preRegistrationPanel",
                            "visibleIf": "{enablePreRegistration} = true",
                            "elements": [
                                {
                                    "type": "text",
                                    "inputType": "date",
                                    "name": "preRegDate",
                                    "title": "Begin Pre-registration on"
                                },
                                {
                                    "type": "text",
                                    "name": "confirmationEmailTemplateId",
                                    "title": "Confirmation Email Template ID",
                                    "description": "The ID of the email template to use for pre-reg confirmation (before event start)",
                                    "descriptionLocation": "underInput",
                                    "isRequiredIf": "{enablePreRegistration} = true"
                                },
                                {
                                    "type": "text",
                                    "name": "reminderEmailTemplateId",
                                    "title": "Reminder Email Template ID",
                                    "description": "The ID of the email template to use for reminders",
                                    "descriptionLocation": "underInput",
                                    "isRequiredIf": "{enablePreRegistration} = true"
                                },
                                {
                                    "type": "text",
                                    "name": "reminderEmailDaysBefore",
                                    "title": "Days Before Event Start",
                                    "inputType": "number",
                                    "min": 0,
                                    "max": 7,
                                    "visibleIf": "{enablePreRegistration} = true and {reminderEmailTemplateId} != ''",
                                    "isRequiredIf": "{enablePreRegistration} = true and {reminderEmailTemplateId} != ''"
                                },
                                 {
                                    "type": "text",
                                    "name": "reminderEmailSendHour",
                                    "title": "Send Hour (24-hour format)",
                                    "inputType": "number",
                                    "min": 0,
                                    "max": 23,
                                    "visibleIf": "{enablePreRegistration} = true and {reminderEmailTemplateId} != ''",
                                    "isRequiredIf": "{enablePreRegistration} = true and {reminderEmailTemplateId} != ''"
                                }
                            ]
                        },
                        // Thank You Email Fields (Visible if enablePreRegistration is false)
                        {
                            "type": "boolean",
                            "name": "sendThankYouEmail",
                            "title": "Send Thank You Email?",
                            "defaultValue": false,
                            "visibleIf": "{enablePreRegistration} = false"
                        },
                        {
                            "type": "text",
                            "name": "thankYouEmailTemplateId",
                            "title": "Email Template ID",
                            "description": "The ID of the email template to use",
                            "descriptionLocation": "underInput",
                            "visibleIf": "{enablePreRegistration} = false and {sendThankYouEmail} = true",
                            "isRequiredIf": "{enablePreRegistration} = false and {sendThankYouEmail} = true"
                        },
                        {
                            "type": "radiogroup",
                            "name": "thankYouEmailTiming",
                            "title": "Email Timing",
                            "choices": [
                                { "value": "immediate", "text": "Immediate" },
                                { "value": "daysAfter", "text": "Days After Event End" }
                            ],
                            "defaultValue": "immediate",
                            "visibleIf": "{enablePreRegistration} = false and {sendThankYouEmail} = true",
                            "isRequiredIf": "{enablePreRegistration} = false and {sendThankYouEmail} = true"
                        },
                        {
                            "type": "text",
                            "name": "thankYouEmailDaysAfter",
                            "title": "Days After Event End",
                            "inputType": "number",
                            "min": 1,
                            "max": 14,
                            "visibleIf": "{enablePreRegistration} = false and {thankYouEmailTiming} = 'daysAfter'",
                            "isRequiredIf": "{enablePreRegistration} = false and {thankYouEmailTiming} = 'daysAfter'"
                        },
                        // Auto Check-out Fields
                        {
                            "type": "boolean",
                            "name": "enableAutoCheckOut",
                            "title": "Enable auto-check-out?",
                            "defaultValue": false
                        },
                        {
                            "type": "panel",
                            "name": "autoCheckOutPanel",
                            "visibleIf": "{enableAutoCheckOut} = true",
                            "elements": [
                                {
                                    "type": "text",
                                    "name": "autoCheckOutMinutesAfter",
                                    "title": "Minutes After Check-in",
                                    "inputType": "number",
                                    "min": 1,
                                    "max": 1440,
                                    "description": "Number of minutes after check-in to automatically check out the guest",
                                    "descriptionLocation": "underInput",
                                    "isRequiredIf": "{enableAutoCheckOut} = true"
                                },
                                {
                                    "type": "text",
                                    "name": "autoCheckOutPostEventId",
                                    "title": "Post-Event Expanse ID",
                                    "description": "The Expanse ID of the post-event",
                                    "descriptionLocation": "underInput",
                                    "isRequiredIf": "{enableAutoCheckOut} = true"
                                }
                            ]
                        },
                        // Check-In Display Configuration
                        {
                            "type": "panel",
                            "name": "checkInDisplayPanel",
                            "title": "Check-In Display Configuration",
                            "visibleIf": "{id} != 'new'",
                            "elements": [
                                {
                                    "type": "matrixdynamic",
                                    "name": "checkInDisplayMatrix",
                                    "title": "Select survey questions to display during check-in",
                                    "description": "Choose which survey questions appear when checking in attendees and customize their display names",
                                    "columns": [
                                        {
                                            "name": "questionId",
                                            "title": "Survey Question",
                                            "cellType": "dropdown",
                                            "isRequired": true,
                                            "showOptionsCaption": false,
                                            "choices": []
                                        },
                                        {
                                            "name": "displayName",
                                            "title": "Display Name",
                                            "cellType": "text",
                                            "isRequired": true
                                        }
                                    ],
                                    "confirmDelete": true,
                                    "confirmDeleteText": "Are you sure you want to remove this question from check-in display?",
                                    "addRowText": "Add Question",
                                    "removeRowText": "Remove"
                                }
                            ]
                        },
                        // Survey Count Limit Panel
                        {
                            "type": "panel",
                            "name": "surveyCountLimitPanel",
                            "title": "Survey Response Limit",
                            "elements": [
                                {
                                    "type": "text",
                                    "name": "survey_count_limit",
                                    "title": "Maximum Survey Responses",
                                    "inputType": "number",
                                    "min": 1,
                                    "description": "Optional. Leave empty for unlimited responses.",
                                    "descriptionLocation": "underInput"
                                },
                                {
                                    "type": "comment",
                                    "name": "limit_reached_message",
                                    "title": "Limit Reached Message",
                                    "description": "Message shown when survey limit is reached. Supports markdown formatting.",
                                    "descriptionLocation": "underTitle",
                                    "rows": 6,
                                    "visibleIf": "{survey_count_limit} > 0",
                                    "isRequiredIf": "{survey_count_limit} > 0",
                                    "defaultValue": "## Survey Closed\n\nThank you for your interest!\n\nThis survey has reached its response limit."
                                },
                                {
                                    "type": "html",
                                    "name": "markdownPreview",
                                    "visibleIf": "{survey_count_limit} > 0 and {limit_reached_message} notempty",
                                    "html": "<div id='markdown-preview' style='padding: 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #f9f9f9; margin-top: 10px;'><p style='color: #666;'>Markdown preview will appear here</p></div>"
                                }
                            ]
                        },
                        {
                            "type": "boolean",
                            "name": "editSurvey",
                            "defaultValue": false,
                            "visible": false,
                        }
                    ]
                }
            ]
        };

        // We'll populate the survey question choices after creating the model
        // Store a reference to where we need to add the choices
        let checkInPanelRef: any = null;
        let questionIdColumnRef: any = null;
        
        if (thisEvent.id !== 'new') {
            const checkInPanel = surveyData.pages[0].elements.find((el: any) => el.name === 'checkInDisplayPanel');
            if (checkInPanel && checkInPanel.elements) {
                const matrixQuestion = checkInPanel.elements.find((el: any) => el.name === 'checkInDisplayMatrix') as any;
                if (matrixQuestion && matrixQuestion.columns && matrixQuestion.columns.length > 0) {
                    questionIdColumnRef = matrixQuestion.columns.find((col: any) => col.name === 'questionId');
                }
            }
        }

        const survey = new SurveyModel(surveyData);
        
        // Initialize markdown converter for preview
        const markdownConverter = new Showdown.Converter({
            openLinksInNewWindow: true,
        });
        
        // Add handler for markdown preview
        survey.onValueChanged.add((sender, options) => {
            if (options.name === 'limit_reached_message' && options.value) {
                const previewElement = document.getElementById('markdown-preview');
                if (previewElement) {
                    const htmlContent = markdownConverter.makeHtml(options.value);
                    previewElement.innerHTML = htmlContent;
                }
            }
        });

        // Now populate survey question choices using the actual survey questions
        if (thisEvent.id !== 'new' && thisEvent.questions && questionIdColumnRef) {
            try {
                // Create a temporary survey model from the event's questions to extract actual questions
                const questionsObj = typeof thisEvent.questions === 'string' ? 
                    JSON.parse(thisEvent.questions) : thisEvent.questions;
                
                const tempSurvey = new SurveyModel(questionsObj);
                const questionChoices: Array<{value: string, text: string}> = [];
                
                // Get all questions from the survey (not panels or pages)
                const allQuestions = tempSurvey.getAllQuestions();
                console.log(`Found ${allQuestions.length} questions in the survey`);
                
                allQuestions.forEach((question: any) => {
                    // Only include actual input questions, not panels or other non-question elements
                    const questionType = question.getType();
                    console.log(`Question: ${question.name}, Type: ${questionType}, Title: ${question.title}`);
                    
                    // Skip panel and page elements
                    if (questionType !== 'panel' && questionType !== 'paneldynamic' && question.name) {
                        questionChoices.push({
                            value: question.name,
                            text: question.title || question.name
                        });
                    }
                });
                
                console.log('Question choices for dropdown:', questionChoices);
                
                // Now update the choices in the matrix question
                const matrixQuestion = survey.getQuestionByName("checkInDisplayMatrix") as any;
                if (matrixQuestion && matrixQuestion.columns && matrixQuestion.columns.length > 0) {
                    const questionIdColumn = matrixQuestion.columns.find((col: any) => col.name === 'questionId');
                    if (questionIdColumn) {
                        questionIdColumn.choices = questionChoices;
                        console.log('Successfully set choices on questionIdColumn');
                    }
                }
            } catch (error) {
                console.error("Error loading survey questions for checkInDisplay:", error);
            }
        }

        survey.data = {
            ...thisEvent,
            startDate: moment(thisEvent.startDate).format("YYYY-MM-DD"),
            endDate: moment(thisEvent.endDate).format("YYYY-MM-DD"),
            preRegDate: thisEvent.preRegDate ? moment(thisEvent.preRegDate).format("YYYY-MM-DD") : undefined,
            _preEventID: thisEvent._preEventID,
            thanks: thisEvent.thanks,
            surveyType: thisEvent.surveyType || null,
            // Map confirmation/reminder email data
            confirmationEmailTemplateId: thisEvent.confirmationEmail?.template,
            reminderEmailTemplateId: thisEvent.reminderEmail?.template,
            reminderEmailDaysBefore: thisEvent.reminderEmail?.daysBefore,
            reminderEmailSendHour: thisEvent.reminderEmail?.sendHour,
            // Map thank you email data
            sendThankYouEmail: !!thisEvent.thankYouEmail, // Map boolean based on existence of thankYouEmail object
            thankYouEmailTemplateId: thisEvent.thankYouEmail?.template,
            thankYouEmailTiming: thisEvent.thankYouEmail?.sendNow ? 'immediate' : (thisEvent.thankYouEmail?.sendNowAfterDays ? 'daysAfter' : 'immediate'), // Map timing
            thankYouEmailDaysAfter: thisEvent.thankYouEmail?.sendNowAfterDays,
            // Map enablePreRegistration based on existing data
            enablePreRegistration: !!thisEvent.preRegDate || !!thisEvent.confirmationEmail || !!thisEvent.reminderEmail,
            // Map auto check-out data
            enableAutoCheckOut: !!thisEvent.autoCheckOut,
            autoCheckOutMinutesAfter: thisEvent.autoCheckOut?.minutesAfter,
            autoCheckOutPostEventId: thisEvent.autoCheckOut?.postEventId,
            // Map check-out email data
            checkOutEmailTemplateId: thisEvent.checkOutEmail?.template,
            // Map checkInDisplay to matrix format
            checkInDisplayMatrix: thisEvent.checkInDisplay ? 
                Object.entries(thisEvent.checkInDisplay).map(([questionId, displayName]) => ({
                    questionId,
                    displayName
                })) : []
        };

        survey.addNavigationItem({
            id: "sv-save-and-edit-survey",
            // To set the button text, use the `title` property  if you don't use localization:
            title: "Save and Edit Survey",
            action: () => {
                survey.setValue("editSurvey", true);
                survey.completeLastPage();
            },
            css: "nav-button",
            innerCss: "sd-btn nav-input"
        });

        survey.onServerValidateQuestions.add((sender, { data, errors, complete }) => {
            if (thisEvent.id === 'new') {
                const eventRef = doc(db, "events", data.id);
                getDoc(eventRef).then((event) => {
                    if (event.exists()) {
                        errors["id"] = "Event ID \"{id}\" already exists";
                    }
                    complete();
                });
            } else {
                complete();
            }
        });

        survey.onComplete.add(function (sender, options) {
            // Omit all email-related fields from the initial data object
            const eventData = _.omit(sender.data, [
                "editSurvey",
                "questions",
                "theme",
                "confirmationEmailTemplateId",
                "reminderEmailTemplateId",
                "reminderEmailDaysBefore",
                "reminderEmailSendHour",
                "sendThankYouEmail",
                "thankYouEmailTemplateId",
                "thankYouEmailTiming",
                "thankYouEmailDaysAfter",
                "enableAutoCheckOut",
                "autoCheckOutMinutesAfter",
                "autoCheckOutPostEventId",
                "checkOutEmailTemplateId",
                "checkInDisplayMatrix",
                "enablePreRegistration"
            ]);
            // console.log("eventData before email mapping", eventData);

            // Map SurveyJS form data back to event data structure
            eventData._preEventID = sender.data._preEventID || null;
            eventData.thanks = sender.data.thanks || null;
            eventData.fordEventID = sender.data.fordEventID || null;
            // Clear surveyType if fordEventID is empty
            eventData.surveyType = (sender.data.fordEventID && sender.data.surveyType) ? sender.data.surveyType : null;

            // Handle email configurations based on enablePreRegistration toggle
            if (sender.data.enablePreRegistration) {
                // If pre-registration is enabled, clear thank you email data
                eventData.thankYouEmail = null;

                // Map pre-registration date
                if (sender.data.preRegDate) {
                     eventData.preRegDate = Timestamp.fromDate(moment(sender.data.preRegDate).startOf('day').toDate());
                } else {
                     eventData.preRegDate = null;
                }


                // Map confirmation email data
                if (sender.data.confirmationEmailTemplateId) {
                    const confirmationEmail: any = {
                        template: sender.data.confirmationEmailTemplateId,
                    };
                    // Only include customData if it exists
                    if (thisEvent.confirmationEmail?.customData !== undefined) {
                        confirmationEmail.customData = thisEvent.confirmationEmail.customData;
                    }
                    eventData.confirmationEmail = confirmationEmail;
                } else {
                    eventData.confirmationEmail = null;
                }

                // Map reminder email data
                if (sender.data.reminderEmailTemplateId) {
                     const reminderEmail: any = {
                        template: sender.data.reminderEmailTemplateId,
                        daysBefore: parseInt(sender.data.reminderEmailDaysBefore, 10),
                        sendHour: parseInt(sender.data.reminderEmailSendHour, 10),
                    };
                    // Only include customData if it exists
                    if (thisEvent.reminderEmail?.customData !== undefined) {
                        reminderEmail.customData = thisEvent.reminderEmail.customData;
                    }
                    eventData.reminderEmail = reminderEmail;
                } else {
                    eventData.reminderEmail = null;
                }

            } else {
                // If pre-registration is NOT enabled, clear pre-registration email data
                eventData.preRegDate = null;
                eventData.confirmationEmail = null;
                eventData.reminderEmail = null;

                // Handle Thank You Email
                if (sender.data.sendThankYouEmail) {
                    const thankYouEmail: any = {
                        template: sender.data.thankYouEmailTemplateId,
                        sendNow: sender.data.thankYouEmailTiming === 'immediate',
                        sendNowAfterDays: sender.data.thankYouEmailTiming === 'daysAfter' ? parseInt(sender.data.thankYouEmailDaysAfter, 10) : undefined,
                    };
                    // Only include customData if it exists
                    if (thisEvent.thankYouEmail?.customData !== undefined) {
                        thankYouEmail.customData = thisEvent.thankYouEmail.customData;
                    }
                    // Keep existing sendHour and daysAfter if not using sendNowAfterDays and they exist
                    if (thankYouEmail.sendNow) {
                        // If timing is 'immediate', ensure sendNowAfterDays and daysAfter are not set
                        delete thankYouEmail.sendNowAfterDays;
                        delete thankYouEmail.daysAfter;
                        delete thankYouEmail.sendHour; // Also remove sendHour if immediate
                    } else if (thankYouEmail.sendNowAfterDays !== undefined) {
                         // If timing is 'daysAfter', use the new value and remove old sendNow, daysAfter, and sendHour
                        delete thankYouEmail.sendNow;
                        delete thankYouEmail.daysAfter;
                        delete thankYouEmail.sendHour;
                    } else {
                         // Fallback/cleanup for old format or unexpected state
                         delete thankYouEmail.sendNow;
                         delete thankYouEmail.daysAfter;
                         delete thankYouEmail.sendHour;
                    }


                    eventData.thankYouEmail = thankYouEmail;

                } else {
                    eventData.thankYouEmail = null; // Set to null if thank you email is disabled
                }
            }

            // Handle Auto Check-out
            if (sender.data.enableAutoCheckOut) {
                eventData.autoCheckOut = {
                    minutesAfter: parseInt(sender.data.autoCheckOutMinutesAfter, 10),
                    postEventId: sender.data.autoCheckOutPostEventId,
                };
            } else {
                eventData.autoCheckOut = null;
            }

            // Handle Check-out Email
            if (sender.data.checkOutEmailTemplateId) {
                eventData.checkOutEmail = {
                    template: sender.data.checkOutEmailTemplateId,
                };
            } else {
                eventData.checkOutEmail = null;
            }

            // console.log("eventData after email mapping", eventData);

            // Handle Check-In Display Configuration
            if (sender.data.checkInDisplayMatrix && sender.data.checkInDisplayMatrix.length > 0) {
                const checkInDisplay: Record<string, string> = {};
                sender.data.checkInDisplayMatrix.forEach((item: any) => {
                    if (item.questionId && item.displayName) {
                        checkInDisplay[item.questionId] = item.displayName;
                    }
                });
                eventData.checkInDisplay = checkInDisplay;
            } else {
                eventData.checkInDisplay = null;
            }

            // Convert startDate and endDate to Firestore Timestamps
            eventData.startDate = Timestamp.fromDate(moment(sender.data.startDate).startOf('day').toDate());
            eventData.endDate = Timestamp.fromDate(moment(sender.data.endDate).endOf('day').toDate());


            if (thisEvent.id !== 'new') {
                // console.log("Updating Event...", thisEvent.id);
                options.showSaveInProgress("Updating Event...");
                const eventRef = doc(db, "events", thisEvent.id);
                updateDoc(eventRef, eventData).then(() => {
                    options.showSaveSuccess("Event Updated");
                }).catch(err => {
                    options.showSaveError(err.message);
                });
            } else {
                // console.log("Creating Event...", eventData.id);
                options.showSaveInProgress("Creating Event...");
                const eventRef = doc(db, "events", eventData.id);
                eventData.questions = "{}"; // default questions
                eventData.theme = "{}"; // default theme
                setDoc(eventRef, eventData).then(() => {
                    options.showSaveSuccess("Event Created");
                }).catch(err => {
                    options.showSaveError(err.message);
                });
            }
        });

        // Set initial markdown preview if limit message exists
        if (thisEvent.limit_reached_message && thisEvent.survey_count_limit) {
            setTimeout(() => {
                const previewElement = document.getElementById('markdown-preview');
                if (previewElement && thisEvent.limit_reached_message) {
                    const htmlContent = markdownConverter.makeHtml(thisEvent.limit_reached_message);
                    previewElement.innerHTML = htmlContent;
                }
            }, 100);
        }
        
        setThisSurvey(survey);
    }, [thisEvent]);

    return (
        thisEvent && thisSurvey ? (
            <div>
                <Survey model={thisSurvey} />
            </div>
        ) : (
            <div>Loading...</div>
        )
    );
}

export default DashboardScreen;
