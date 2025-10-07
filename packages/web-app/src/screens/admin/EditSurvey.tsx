import React, { useEffect, useState } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, Timestamp, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, updateDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

import auth from '../../services/auth';
import app from '../../services/firebase';
import db from '../../services/firestore';

import { QuestionRadiogroupModel, Serializer } from "survey-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import { registerCreatorTheme, registerSurveyTheme } from "survey-creator-core";
import { ReactQuestionFactory } from "survey-react-ui";
import SurveyTheme from "survey-core/themes";
import SurveyCreatorTheme from "survey-creator-core/themes";

import _ from 'lodash';
import { ICreatorOptions } from 'survey-creator-core';

import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';
import "./admin.css";
import './EditSurvey.css';

import { initCreator, initSurvey, prepareCreatorOnQuestionAdded, prepareForSurvey, prepareSurveyOnQuestionAdded } from '../../helpers/surveyTemplatesAll';
import { initCreatorFord, prepareCreatorOnQuestionAddedFord } from '../../helpers/surveyTemplatesFord';
import { initCreatorLincoln, prepareCreatorOnQuestionAddedLincoln } from '../../helpers/surveyTemplatesLincoln';
import { shouldLoadFDS, getBrandTheme, normalizeBrand } from '../../utils/brandUtils';
import { initializeFDSForBrand } from '../../helpers/fdsInitializer';
import { AllSurveys, FMCSurveys } from '../../surveyjs_questions';
import FordSurveysNew from '../../surveyjs_questions/FordSurveysNew';
import LincolnSurveys from '../../surveyjs_questions/LincolnSurveys';

// Register SurveyJS themes for theme editor functionality
registerSurveyTheme(SurveyTheme); // Add predefined Form Library UI themes
registerCreatorTheme(SurveyCreatorTheme); // Add predefined Survey Creator UI themes

const EEventConverter: FirestoreDataConverter<ExpanseEvent> = {
    toFirestore(event: ExpanseEvent): DocumentData {
        const surveyModel = event.surveyJSModel || event.questions;
        const themeModel = event.surveyJSTheme || event.theme;
        
        return {
            ...event,
            brand: event.brand || null,
            // Write to both old and new fields for backward compatibility
            questions: typeof surveyModel === 'string' ? surveyModel : JSON.stringify(surveyModel),
            surveyJSModel: typeof surveyModel === 'string' ? JSON.parse(surveyModel) : surveyModel,
            theme: typeof themeModel === 'string' ? themeModel : JSON.stringify(themeModel),
            surveyJSTheme: typeof themeModel === 'string' ? JSON.parse(themeModel) : themeModel,
            preRegDate: event.preRegDate ? Timestamp.fromDate(event.preRegDate) : undefined,
            startDate: Timestamp.fromDate(event.startDate),
            endDate: Timestamp.fromDate(event.endDate),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): ExpanseEvent {
        const data = snapshot.data(options);
        
        // Use new map fields if available, otherwise fall back to parsing JSON strings
        const surveyModel = data.surveyJSModel || (data.questions ? JSON.parse(data.questions) : {});
        const themeModel = data.surveyJSTheme || (data.theme ? JSON.parse(data.theme) : {});
        
        return {
            id: snapshot.id,
            name: data.name,
            brand: data.brand || undefined,
            _preEventID: data._preEventID,
            preRegDate: data.preRegDate?.toDate(),
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            confirmationEmail: data.confirmationEmail,
            reminderEmail: data.reminderEmail,
            thankYouEmail: data.thankYouEmail,
            checkInDisplay: data.checkInDisplay,
            disabled: data.disabled,
            questions: surveyModel,  // For backward compatibility
            surveyJSModel: surveyModel,  // New field
            theme: themeModel,  // For backward compatibility
            surveyJSTheme: themeModel,  // New field
            thanks: data.thanks,
        };
    },
};

function DashboardScreen() {
    const navigate = useNavigate();
    const params = useParams();

    const [user, userLoading, userError] = useAuthState(auth);
    const [thisEvent, setThisEvent] = useState<ExpanseEvent>();
    const [creator, setCreator] = useState<SurveyCreator>();
    const [initializationComplete, setInitializationComplete] = useState(false);

    const eventID: string = params.eventID!;

    useEffect(() => {
        userError && console.error(userError);
    }, [userError]);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            return navigate('./login');
        }

        // get the event
        const eventRef = doc(db, "events", eventID).withConverter(EEventConverter);

        getDoc(eventRef).then(async (event) => {
            const eventData = event.data();
            setThisEvent(eventData);

            // Initialize FDS conditionally based on event brand
            const eventBrand = normalizeBrand(eventData?.brand);
            console.log(`Survey Creator - Event brand detected: ${eventBrand}`);
            
            try {
                // Always initialize basic SurveyJS and universal questions
                initSurvey();
                AllSurveys.globalInit();
                
                // Initialize brand-specific components
                if (eventBrand === 'Ford') {
                    await initializeFDSForBrand(eventBrand);
                    // The FDS initializer already calls FMCSurveys.fmcInit() and FordSurveysNew.fordInit()
                    console.log(`FDS and Ford-specific questions initialized for ${eventBrand} event`);
                } else if (eventBrand === 'Lincoln') {
                    await initializeFDSForBrand(eventBrand);
                    // The FDS initializer already calls FMCSurveys.fmcInit() and LincolnSurveys.lincolnInit()
                    console.log(`FDS and Lincoln-specific questions initialized for ${eventBrand} event`);
                } else {
                    // For non-branded events, only universal questions are initialized
                    console.log('Basic SurveyJS with universal questions initialized for non-branded event');
                }
            } catch (error) {
                console.error('Failed to initialize survey system:', error);
                // Fallback to basic initialization with universal questions
                initSurvey();
                try {
                    AllSurveys.globalInit();
                } catch (fallbackError) {
                    console.error('Failed to initialize universal questions in fallback:', fallbackError);
                }
            }
            
            setInitializationComplete(true);
        });
    }, [userLoading, eventID]);

    // Separate useEffect for creator initialization that depends on FDS initialization
    useEffect(() => {
        if (!initializationComplete || !thisEvent) return;

        const createSurveyCreator = async () => {
            const creatorOptions: ICreatorOptions = {
                showHeaderInEmptySurvey: true,
                
                previewOrientation: "portrait",
                // Enable file uploads for image handling
                questionTypes: ["boolean", "checkbox", "comment", "dropdown", "tagbox", "expression", "html", "image", "imagepicker", "matrix", "matrixdropdown", "matrixdynamic", "multipletext", "panel", "paneldynamic", "radiogroup", "rating", "ranking", "text", "markdown", "file"],
                showLogicTab: true,
                isAutoSave: false,
                showSaveButton: true,
                showThemeTab: true,
                showTranslationTab: true,
            };

            const newCreator = new SurveyCreator(creatorOptions);

            // Initialize theme if it exists in the event data
            const eventTheme = thisEvent?.surveyJSTheme || thisEvent?.theme;
            if (eventTheme) {
                try {
                    newCreator.theme = eventTheme;
                    console.log('Loaded existing theme from event data');
                } catch (error) {
                    console.warn('Failed to load existing theme:', error);
                }
            }

            // Add theme saving functionality
            newCreator.saveThemeFunc = (saveNo: number, callback: (saveNo: number, success: boolean) => void) => {
                console.log("Saving theme...");
                const eventRef = doc(db, "events", eventID).withConverter(EEventConverter);
                updateDoc(eventRef, {
                    // Write to both old and new fields
                    theme: JSON.stringify(newCreator.theme),
                    surveyJSTheme: newCreator.theme,
                }).then(() => {
                    console.log("Theme saved!");
                    callback(saveNo, true);
                }).catch((error) => {
                    console.error("Failed to save theme:", error);
                    callback(saveNo, false);
                });
            };

            // Initialize creator with base settings
            initCreator(newCreator);
            
            // Apply brand-specific creator settings and hide irrelevant categories
            const eventBrand = normalizeBrand(thisEvent?.brand);
            if (eventBrand === 'Ford') {
                initCreatorFord(newCreator);
                // Hide Lincoln category for Ford events
                const lincolnCategory = newCreator.toolbox.categories.find((c: any) => c.name === '__02lincolnCategory');
                if (lincolnCategory) {
                    (lincolnCategory as any).visible = false;
                }
                console.log('Ford creator settings applied, Lincoln category hidden');
            } else if (eventBrand === 'Lincoln') {
                initCreatorLincoln(newCreator);
                // Hide Ford category for Lincoln events
                const fordCategory = newCreator.toolbox.categories.find((c: any) => c.name === '__02fordCategory');
                if (fordCategory) {
                    (fordCategory as any).visible = false;
                }
                console.log('Lincoln creator settings applied, Ford category hidden');
            } else {
                // For non-branded events, hide both Ford and Lincoln categories AND FMC category
                const fordCategory = newCreator.toolbox.categories.find((c: any) => c.name === '__02fordCategory');
                const lincolnCategory = newCreator.toolbox.categories.find((c: any) => c.name === '__02lincolnCategory');
                const fmcCategory = newCreator.toolbox.categories.find((c: any) => c.name === '__01fmc');
                if (fordCategory) (fordCategory as any).visible = false;
                if (lincolnCategory) (lincolnCategory as any).visible = false;
                if (fmcCategory) (fmcCategory as any).visible = false;
                console.log('Non-branded event: Ford, Lincoln, and FMC categories hidden');
                
                // Also hide individual FMC question items from the toolbox
                const fmcQuestions = ['gender', 'agebracket', 'howlikelyacquire', 'inmarkettiming', 'vehicledrivenmostmake'];
                fmcQuestions.forEach(questionName => {
                    const item = newCreator.toolbox.getItemByName(questionName) as any;
                    if (item) item.visible = false;
                });
                console.log('FMC question items hidden from toolbox');
            }

            newCreator.onSurveyInstanceCreated.add((creator, options) => {
                prepareForSurvey(options.survey, eventBrand);

                // hide options for radiobuttongroup
                if (options.area == "designer-tab") {
                    options.survey.onShowingChoiceItem.add((sender, options) => {
                        if (options.item.locOwner instanceof QuestionRadiogroupModel) {
                            if (options.item.locOwner.renderAs === "radiobuttongroup") {
                                switch (options.item) {
                                    case options.question.newItem:
                                        options.visible = false;
                                        break;
                                    case options.question.noneItem:
                                        options.visible = false;
                                        break;
                                    case options.question.otherItem:
                                        options.visible = false;
                                        break;
                                }
                            }
                        }
                        return;

                        if (options.item == options.question.newItem) {
                            options.visible = false;
                        }
                    });
                }

                if (options.area == "preview-tab") {
                    prepareSurveyOnQuestionAdded(creator, options);
                }
            });

            newCreator.onQuestionAdded.add((sender, options) => {
                // Call base question handler
                prepareCreatorOnQuestionAdded(sender, options);
                
                // Call brand-specific question handler
                if (eventBrand === 'Ford') {
                    prepareCreatorOnQuestionAddedFord(sender, options);
                } else if (eventBrand === 'Lincoln') {
                    prepareCreatorOnQuestionAddedLincoln(sender, options);
                }
            });

            // radioGroup
            const radioRenderAsProp: any = Serializer.getProperty('radiogroup', 'renderAs');
            radioRenderAsProp.visible = true;
            radioRenderAsProp.category = "general";
            radioRenderAsProp.setChoices(["default", "radiobuttongroup"]);

            // Add a custom subitem to the Long Text toolbox item
            const radioGroupItem = newCreator.toolbox.getItemByName("radiogroup");
            radioGroupItem.addSubitem({
                name: "default",
                title: "Radio Group",
                json: {
                    type: "radiogroup",
                }
            });
            radioGroupItem.addSubitem({
                name: "radioButtonGroup",
                title: "Radio Button Group",
                json: {
                    type: "radiogroup",
                    renderAs: "radiobuttongroup",
                }
            });

            // Ensure survey has required properties for header rendering
            const surveyJSON = thisEvent?.surveyJSModel || thisEvent?.questions || {};
            
            // Set default headerView and description if missing (prevents header display issues)
            if (!surveyJSON.headerView) {
                surveyJSON.headerView = "advanced";
                console.log('[Admin] Setting default headerView: advanced');
            }
            if (!surveyJSON.description) {
                surveyJSON.description = " ";
                console.log('[Admin] Setting default description for header compatibility');
            }
            // Remove any persisted choices that should come from choicesByUrl
            const sanitizedForEditing = (function sanitize(json: any) {
                if (!json) return json;
                const cloned = JSON.parse(JSON.stringify(json));
                const stripChoices = (elements?: any[]) => {
                    if (!elements) return;
                    elements.forEach((el) => {
                        if (!el) return;
                        const typesToStrip = new Set(['fordvoi','fordvehiclesdriven','lincolnvehiclesdriven','vehicledrivenmostmake']);
                        if (typeof el.type === 'string' && typesToStrip.has(el.type)) {
                            if (el.choices) delete el.choices;
                        }
                        if (el.elements) stripChoices(el.elements);
                        if (el.questions) stripChoices(el.questions);
                        if (el.panels) stripChoices(el.panels);
                    });
                };
                if (cloned.pages) cloned.pages.forEach((p: any) => stripChoices(p.elements));
                else if (cloned.elements) stripChoices(cloned.elements);
                return cloned;
            })(surveyJSON);

            newCreator.JSON = sanitizedForEditing;

            // Remove transient/editor-populated data before saving
            const sanitizeSurveyJSON = (json: any) => {
                if (!json) return json;
                const cloned = JSON.parse(JSON.stringify(json));

                const stripChoices = (elements?: any[]) => {
                    if (!elements) return;
                    elements.forEach((el) => {
                        if (!el) return;
                        // Custom types that must rely on choicesByUrl and should not persist choices
                        const typesToStrip = new Set([
                            'fordvoi',
                            'fordvehiclesdriven',
                            'lincolnvehiclesdriven',
                            'vehicledrivenmostmake',
                        ]);
                        if (typeof el.type === 'string' && typesToStrip.has(el.type)) {
                            if (el.choices) delete el.choices;
                        }
                        // Recurse into containers
                        if (el.elements) stripChoices(el.elements);
                        if (el.questions) stripChoices(el.questions);
                        if (el.panels) stripChoices(el.panels);
                    });
                };

                if (cloned.pages) cloned.pages.forEach((p: any) => stripChoices(p.elements));
                else if (cloned.elements) stripChoices(cloned.elements);

                return cloned;
            };

            newCreator.saveSurveyFunc = (saveNo: number, callback: (saveNo: number, success: boolean) => void) => {
                console.log("saving questions...")
                const eventRef = doc(db, "events", eventID).withConverter(EEventConverter);

                const sanitized = sanitizeSurveyJSON(newCreator.JSON);

                updateDoc(eventRef, {
                    // Write to both old and new fields
                    questions: JSON.stringify(sanitized),
                    surveyJSModel: sanitized,
                }).then(() => {
                    console.log("saved!")
                    callback(saveNo, true);
                }).catch((error) => {
                    console.error(error);
                    callback(saveNo, false);
                });
            };


            // Image upload handler
            newCreator.onUploadFile.add(async (sender, options) => {
                try {
                    console.log("Starting image upload...");
                    
                    const file = options.files[0];
                    if (!file) {
                        console.error("No file provided");
                        options.callback("error");
                        return;
                    }

                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        console.error("File must be an image");
                        options.callback("error");
                        return;
                    }

                    // Validate file size (10MB limit)
                    if (file.size > 10 * 1024 * 1024) {
                        console.error("File size must be less than 10MB");
                        options.callback("error");
                        return;
                    }

                    // Get upload URL from Firebase function
                    const idToken = await user?.getIdToken();
                    if (!idToken) {
                        console.error("No authentication token");
                        options.callback("error");
                        return;
                    }

                    // Determine the correct Cloud Run URL based on the Firebase project
                    const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'latitude-lead-system';
                    const isStaging = firebaseProjectId === 'latitude-leads-staging';
                    const uploadFunctionUrl = isStaging
                        ? 'https://generatecreatoruploadurl-dm2b2pxfcq-uc.a.run.app'
                        : 'https://generatecreatoruploadurl-erqibiidsa-uc.a.run.app';

                    const uploadResponse = await fetch(uploadFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            eventId: eventID,
                            filename: file.name,
                            contentType: file.type
                        })
                    });

                    if (!uploadResponse.ok) {
                        console.error("Failed to get upload URL");
                        options.callback("error");
                        return;
                    }

                    const { uploadUrl, fields, finalImageUrl } = await uploadResponse.json();

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
                    
                    // Set up progress tracking
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = (event.loaded / event.total) * 100;
                            console.log(`Upload progress: ${percentComplete.toFixed(1)}%`);
                            
                            // Call SurveyJS progress callback if available
                            if ((options as any).uploadProgress) {
                                (options as any).uploadProgress(event.loaded, event.total);
                            }
                        }
                    });

                    // Promise wrapper for XMLHttpRequest
                    const uploadPromise = new Promise<void>((resolve, reject) => {
                        xhr.addEventListener('load', () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                resolve();
                            } else {
                                reject(new Error(`Upload failed with status ${xhr.status}`));
                            }
                        });
                        
                        xhr.addEventListener('error', () => {
                            reject(new Error('Upload failed'));
                        });
                        
                        xhr.open('POST', uploadUrl);
                        xhr.send(formData);
                    });

                    await uploadPromise;

                    console.log("Upload successful:", finalImageUrl);
                    
                    // Return the CDN URL to SurveyJS
                    options.callback("success", finalImageUrl);

                } catch (error) {
                    console.error("Upload error:", error);
                    options.callback("error");
                }
            });

            setCreator(newCreator);
        };

        createSurveyCreator();
    }, [initializationComplete, thisEvent, eventID]);

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-4">Edit Event {thisEvent?.id}</h1>

            {!initializationComplete ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    Loading survey editor...
                </div>
            ) : creator ? (
                <div id="fd-nxt" className={`${getBrandTheme(thisEvent?.brand)} flex-1 flex flex-col`}>
                    <SurveyCreatorComponent creator={creator} />
                </div>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    Initializing creator...
                </div>
            )}
        </div>
    );
}

export default DashboardScreen;
