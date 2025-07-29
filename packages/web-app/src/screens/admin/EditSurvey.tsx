import { useEffect, useState } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { getFirestore, doc, getDoc, Timestamp, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, updateDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

import auth from '../../services/auth';
import app from '../../services/firebase';

import { QuestionRadiogroupModel, Serializer } from "survey-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";

import _ from 'lodash';
import { ICreatorOptions } from 'survey-creator-core';

import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';
import "../Surveys.css";
import "./admin.css";
import './EditSurvey.css';

import { initCreator, initSurvey, prepareCreatorOnQuestionAdded, prepareForSurvey, prepareSurveyOnQuestionAdded } from '../../helpers/surveyTemplatesAll';

const EEventConverter: FirestoreDataConverter<ExpanseEvent> = {
    toFirestore(event: ExpanseEvent): DocumentData {
        return {
            ...event,
            questions: JSON.stringify(event.questions),
            theme: JSON.stringify(event.theme),
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
            checkInDisplay: data.checkInDisplay,
            disabled: data.disabled,
            questions: JSON.parse(data.questions),
            theme: JSON.parse(data.theme),
            thanks: data.thanks,
        };
    },
};

initSurvey();

function DashboardScreen() {
    const navigate = useNavigate();
    const params = useParams();

    const [user, userLoading, userError] = useAuthState(auth);
    const [thisEvent, setThisEvent] = useState<ExpanseEvent>();
    const [creator, setCreator] = useState<SurveyCreator>();

    const db = getFirestore(app);
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

        getDoc(eventRef).then((event) => {
            const eventData = event.data();
            setThisEvent(eventData);

            const creatorOptions: ICreatorOptions = {
                previewOrientation: "portrait",
                // Enable file uploads for image handling
                questionTypes: ["boolean", "checkbox", "comment", "dropdown", "tagbox", "expression", "html", "image", "imagepicker", "matrix", "matrixdropdown", "matrixdynamic", "multipletext", "panel", "paneldynamic", "radiogroup", "rating", "ranking", "text", "markdown", "file"],
                showLogicTab: true,
                isAutoSave: false,
                showSaveButton: true,
                showThemeTab: false,
                showTranslationTab: true,
            };

            const newCreator = new SurveyCreator(creatorOptions);

            initCreator(newCreator);

            newCreator.onSurveyInstanceCreated.add((creator, options) => {
                prepareForSurvey(options.survey);

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
                prepareCreatorOnQuestionAdded(sender, options);
            });

            // radioGroup
            const radioRenderAsProp = Serializer.getProperty('radiogroup', 'renderAs');
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

            newCreator.JSON = eventData?.questions;

            newCreator.saveSurveyFunc = (saveNo: number, callback: (saveNo: number, success: boolean) => void) => {
                console.log("saving questions...")
                updateDoc(eventRef, {
                    questions: JSON.stringify(newCreator.JSON),
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

                    const uploadResponse = await fetch('https://generatecreatoruploadurl-erqibiidsa-uc.a.run.app', {
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
        });
    }, [userLoading]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="ford_light">
            <h1>Edit Event {thisEvent?.id}</h1>

            {creator && <SurveyCreatorComponent creator={creator} style={{ flex: 1 }} />}
        </div>
    );
}

export default DashboardScreen;
