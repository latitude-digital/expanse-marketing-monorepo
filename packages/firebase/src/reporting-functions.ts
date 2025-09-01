import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onTaskDispatched} from "firebase-functions/v2/tasks";
import {onSchedule, ScheduleOptions} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import {getFunctions} from "firebase-admin/functions";
import {
  DocumentReference,
  QueryDocumentSnapshot,
  getFirestore,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import axios, {AxiosError} from "axios";
import moment from "moment-timezone";
import {Model} from "survey-core";
import {formatPhoneNumber, createMD5Hash, getFunctionUrl} from "./utils";
import {uploadSurveyToAPI} from "@expanse/shared";

const fordEventsCronKey = defineSecret("FORD_EVENTS_CRON_KEY");

// Survey trigger - the heart of the email/reporting system
export const surveyTriggerImpl = (database = "(default)") => onDocumentCreated(
    {
      document: "events/{eventID}/surveys/{surveyID}",
      database: database
    },
    async (event) => {
      if (!event?.data) {
        console.error("no survey");
        return null;
      }

      const {surveyID, eventID} = event.params;
      console.log("surveyTrigger", eventID, surveyID);
      const snapshot = event.data as QueryDocumentSnapshot;

      const survey = snapshot.data();
      let email: string = survey.email;

      // EMAILS
      const emailQueue = getFunctions().taskQueue("scheduledEmail");
      const emailUri = await getFunctionUrl("scheduledEmail");

      // Get the correct database based on the trigger configuration
      const db = database === "staging" 
        ? getFirestore(admin.app(), "staging")
        : getFirestore(admin.app());

      db
          .collection("events")
          .doc(eventID)
          .get()
          .then(async (doc) => {
            const thisEvent = doc.data();

            if (!thisEvent) {
              console.error("no event data");
              return null;
            }

            let preSurvey: any = {};

            // if this is a post-event, we need to grab the pre-event survey too
            if (thisEvent._preEventID && survey._preSurveyID) {
              console.log(
                  "POST EVENT SURVEY",
                  thisEvent._preEventID,
                  survey._preSurveyID
              );
              preSurvey = await db
                  .doc(
                      `events/${thisEvent._preEventID}/surveys/${survey._preSurveyID}`
                  )
                  .get()
                  .then((pre) => {
                    console.log(
                        "pre",
                        pre.id,
                        `events/${thisEvent._preEventID}/surveys/${survey._preSurveyID}`
                    );
                    return pre.data();
                  });
              email = preSurvey?.email || survey.email;
              console.log("got pre event survey", email);
            }

            const {results, surveyJSModel} = thisEvent;

            const preRegDate = thisEvent.preRegDate?.toDate();
            const startDate = moment
                .tz(
                    thisEvent.startDate.toDate(),
                    thisEvent.timeZone || "America/New_York"
                )
                .startOf("day")
                .toDate();

            const endDate = moment
                .tz(
                    thisEvent.endDate.toDate(),
                    thisEvent.timeZone || "America/Los_Angeles"
                )
                .endOf("day")
                .toDate();

            const emailData = {
              event: {
                id: eventID,
                ...thisEvent,
                questions: JSON.parse(thisEvent.questions),
                theme: JSON.parse(thisEvent.theme),
              },
              survey: {
                id: surveyID,
                ...preSurvey,
                ...survey,
              },
            };

            const isPreReg = preRegDate && new Date() < startDate;
            console.log("isPreReg", isPreReg);

            // can't have an event that has both pre-reg and thank-you emails
            if (isPreReg) {
              // confirmation email?
              console.log(
                  "confirmation email",
                  thisEvent.confirmationEmail?.template
              );
              if (thisEvent.confirmationEmail?.template) {
                emailQueue.enqueue(
                    {
                      template: thisEvent.confirmationEmail.template,
                      email,
                      substitutionData: {
                        ...emailData,
                        customData: thisEvent.confirmationEmail.customData,
                      },
                    },
                    {
                      uri: emailUri,
                    }
                );
                console.log("confirmation email queued");
              }

              // reminder email?
              console.log("reminder email", thisEvent.reminderEmail?.template);
              if (thisEvent.reminderEmail?.template) {
                const reminderTime = moment
                    .tz(startDate, thisEvent.timeZone || "America/New_York")
                    .hour(thisEvent.reminderEmail.sendHour || 7)
                    .subtract(thisEvent.reminderEmail.daysBefore || 0, "days")
                    .toDate();
                console.log("reminderTime", reminderTime);
                // Don't send reminders at the same time as the confirmation
                if (reminderTime > new Date()) {
                  emailQueue.enqueue(
                      {
                        template: thisEvent.reminderEmail.template,
                        email,
                        substitutionData: {
                          ...emailData,
                          customData: thisEvent.reminderEmail.customData,
                        },
                      },
                      {
                        scheduleTime: reminderTime,
                        uri: emailUri,
                      }
                  );
                  console.log("reminder email queued");
                }
              }
            }

            // thank-you email?
            console.log("thank you email", thisEvent.thankYouEmail?.template);
            if (thisEvent.thankYouEmail?.template) {
              const thanksTime = thisEvent.thankYouEmail?.sendNow ?
                  moment()
                      .add(3, "minutes")
                      .toDate() :
                  thisEvent.thankYouEmail?.sendNowAfterDays ?
                      moment()
                          .add(thisEvent.thankYouEmail.sendNowAfterDays, "days")
                          .toDate() :
                      moment
                          .tz(endDate, thisEvent.timeZone || "America/New_York")
                          .hour(thisEvent.thankYouEmail.sendHour || 7)
                          .add(thisEvent.thankYouEmail.daysAfter || 0, "days")
                          .toDate();
              emailQueue.enqueue(
                  {
                    template: thisEvent.thankYouEmail.template,
                    email,
                    substitutionData: {
                      ...emailData,
                      customData: thisEvent.thankYouEmail.customData,
                    },
                  },
                  {
                    scheduleTime: thanksTime,
                    uri: emailUri,
                  }
              );
              console.log("thank you email queued");
            }

            // update the pre-event survey to be used
            if (survey._preSurveyID) {
              db
                  .doc(
                      `events/${thisEvent._preEventID}/surveys/${survey._preSurveyID}`
                  )
                  .update({
                    _used: new Date(),
                  });
            }

            // Upload to Ford/Lincoln APIs if applicable
            if ((thisEvent.brand === 'Ford' && thisEvent.fordEventID) || 
                (thisEvent.brand === 'Lincoln' && thisEvent.lincolnEventID)) {
              console.log('Attempting to upload survey to', thisEvent.brand, 'API');
              
              try {
                const uploadResult = await uploadSurveyToAPI(
                  {
                    id: eventID,
                    name: thisEvent.name,
                    brand: thisEvent.brand,
                    fordEventID: thisEvent.fordEventID,
                    lincolnEventID: thisEvent.lincolnEventID,
                    surveyType: thisEvent.surveyType || 'basic',
                    surveyJSModel: surveyJSModel
                  },
                  survey
                );
                
                if (uploadResult.success) {
                  console.log('Survey successfully uploaded to', thisEvent.brand, 'API');
                  
                  // Mark survey as uploaded
                  await snapshot.ref.update({
                    _uploadedToAPI: true,
                    _uploadedAt: new Date(),
                    _uploadBrand: thisEvent.brand
                  });
                } else {
                  console.error('Failed to upload survey to', thisEvent.brand, 'API:', uploadResult.error);
                  
                  // Mark upload attempt with error
                  await snapshot.ref.update({
                    _uploadError: uploadResult.error,
                    _uploadAttemptedAt: new Date()
                  });
                }
              } catch (error) {
                console.error('Error uploading survey to API:', error);
                
                // Mark upload attempt with error
                await snapshot.ref.update({
                  _uploadError: error instanceof Error ? error.message : 'Unknown error',
                  _uploadAttemptedAt: new Date()
                });
              }
            }

            // REPORTING
            if (!surveyJSModel) {
              console.error("no questions");
              return null;
            }

            const questionKeys: string[] = [];
            let resultsUpdate: any = {};

            // get questions to tabulate
            console.log("surveyresults", JSON.stringify(results));
            if (!results) {
              console.log("FIRST SURVEY");
              const surveyModel = new Model(surveyJSModel);

              const allQuestions = surveyModel.getAllQuestions(false, true, true);
              console.log("survey questions", allQuestions.length);

              for (const q of allQuestions) {
                if (
                  ![
                    "input",
                    "email",
                    "phone",
                    "zip",
                    "masked",
                    "html",
                    "waiver",
                    "text",
                    "imagepicker",
                    "signaturepad",
                    "comment",
                    "image",
                    "file",
                    "file",
                    "expression",
                    "bookeo",
                    "matrix",
                    "matrixdropdown",
                    "matrixdynamic",
                    "multipletext",
                    "panel",
                    "paneldynamic",
                  ].includes(q.getType())
                ) {
                  questionKeys.push(q.name);
                }
              }

              resultsUpdate = {
                __questions: questionKeys,
                __totalCount: 1,
              };

              // increment answers selected
              for (const q of questionKeys) {
                resultsUpdate[q] = {};

                console.log(
                    "answer exists?",
                    q,
                    Object.prototype.hasOwnProperty.call(survey, q)
                );

                if (
                  Object.prototype.hasOwnProperty.call(survey, q) &&
              survey[q] !== null
                ) {
                  const answer = survey[q];

                  if (Array.isArray(answer)) {
                    // loop over array answers
                    for (const v of answer) {
                      // TODO: allow dashes and underscores
                      const resultKey = String(v).replace(/[^\w\s-_]/g, "");
                      resultsUpdate[q][resultKey] = 1;
                    }
                  } else {
                    // TODO: allow dashes and underscores
                    const resultKey = String(answer).replace(/[^\w\s-_]/g, "");
                    resultsUpdate[q][resultKey] = 1;
                  }
                }
              }

              console.log(
                  "resultsUpdate first save",
                  JSON.stringify(resultsUpdate),
                  JSON.stringify(survey)
              );

              await doc.ref.update({
                results: resultsUpdate,
              });
            } else {
              const reportingQueue = getFunctions().taskQueue("queuedReporting");
              const reportingUri = await getFunctionUrl("queuedReporting");

              // delay the reporting math by up to 60 seconds
              reportingQueue.enqueue(
                  {
                    eventID,
                    survey,
                  },
                  {
                    scheduleDelaySeconds: Math.random() * 60,
                    uri: reportingUri,
                  }
              );
            }

            return null;
          });

      return null;
    }
);

// Queued reporting task
export const queuedReportingImpl = () => onTaskDispatched(
    {
      retryConfig: {
        maxAttempts: 30,
        minBackoffSeconds: 37,
      },
      rateLimits: {
        maxConcurrentDispatches: 2,
      },
    },
    async (req) => {
      const {queueName} = req;
      console.log(`Received task with name: ${queueName}`);

      const {eventID, survey} = req.data;

      // Get the correct database based on environment
      const database = process.env.DB_NAME || "(default)";
      const db = database === "staging" 
        ? getFirestore(admin.app(), "staging")
        : getFirestore(admin.app());

      db
          .collection("events")
          .doc(eventID)
          .get()
          .then(async (doc) => {
            console.log("got event doc");
            const thisEvent = doc.data();

            if (!thisEvent) {
              console.error("no event data");
              return null;
            }

            const {results, surveyJSModel} = thisEvent;
            if (!surveyJSModel) {
              console.error("no questions");
              return null;
            }

            let questionKeys: string[] = [];

            // get questions to tabulate
            if (results) {
              console.log("existing reporting", JSON.stringify(results));
              questionKeys = results.__questions;

              const answerIncrements: any = {
                "results.__totalCount": admin.firestore.FieldValue.increment(1),
              };
              // increment answers selected
              for (const q of questionKeys) {
                console.log(
                    "answer exists?",
                    q,
                    Object.prototype.hasOwnProperty.call(survey, q)
                );

                if (
                  Object.prototype.hasOwnProperty.call(survey, q) &&
              survey[q] !== null
                ) {
                  const answer = survey[q];

                  if (Array.isArray(answer)) {
                    // loop over array answers
                    for (const v of answer) {
                      const resultKey = String(v).replace(/[^\w\s-_]/g, "");
                      answerIncrements[`results.${q}.${resultKey}`] =
                    admin.firestore.FieldValue.increment(1);
                    }
                  } else {
                    const resultKey = String(answer).replace(/[^\w\s-_]/g, "");
                    // just increment the single answer
                    answerIncrements[`results.${q}.${resultKey}`] =
                  admin.firestore.FieldValue.increment(1);
                  }
                }
              }
              doc.ref.update(answerIncrements);
            }

            console.log("all done");
            return null;
          });

      return;
    }
);

// Send Ford surveys - daily scheduled function
export const sendFordSurveysImpl = () => onSchedule(
  {
    schedule: "every day 3:03",
    timeZone: "America/Chicago",
    secrets: ["FORD_EVENTS_CRON_KEY"],
  } as ScheduleOptions,
  async () => {
    const cronKey = fordEventsCronKey.value();

    // Get the correct database based on environment
    const database = process.env.DB_NAME || "(default)";
    const db = database === "staging" 
      ? getFirestore(admin.app(), "staging")
      : getFirestore(admin.app());

    const events = await db
        .collection("events")
        .where("startDate", "<=", new Date())
        .where("endDate", ">", new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
        .where("ford_event_id", ">", 0)
        .get();
    console.log("events", events.docs.length);

    const docsToUpdate: DocumentReference[] = [];
    const surveysToSend: any[] = [];
    const voiToSend: any[] = [];

    // get the surveys collection from each event where _exported is null
    for (const event of events.docs) {
      const eventData = event.data();
      const thisEventID = eventData.ford_event_id;
      console.log("event_id", eventData.ford_event_id);
      const eventId = eventData.id;
      const surveys = await db
          .collection(`events/${eventId}/surveys`)
          .where("_exported", "==", null)
          .get();
      console.log("surveys", surveys.docs.length);

      const eventFFSQuestions: Record<string, any> = {};

      const survey = new Model(eventData.questions);
      const surveyQuestions = survey.getAllQuestions(false, true, true);

      for (const question of surveyQuestions) {
        if (question.getPropertyValue("_ffs")) {
          eventFFSQuestions[question.getPropertyValue("_ffs")] = question.name;
        }
      }

      for (const answers of surveys.docs) {
        const surveyData = answers.data();
        console.log("survey_id", answers.id);
        const rightNow = new Date();

        surveysToSend.push({
          event_id: thisEventID,
          survey_date: moment(surveyData.survey_date).toDate() || rightNow,
          survey_type: eventData.surveyType || null,
          device_survey_guid: answers.id,
          pre_drive_survey_guid: surveyData.pre_drive_survey_guid || null,
          device_id: "meridian 0.1",
          app_version: "0.1",
          abandoned: false,
          start_time: moment(surveyData.start_time).toDate() || rightNow,
          end_time: moment(surveyData.end_time).toDate() || rightNow,
          first_name: surveyData[eventFFSQuestions["first_name"]] || null,
          last_name: surveyData[eventFFSQuestions["last_name"]] || null,
          address1: surveyData[eventFFSQuestions["address1"]] || null,
          address2: surveyData[eventFFSQuestions["address2"]] || null,
          city: surveyData[eventFFSQuestions["city"]] || null,
          state: surveyData[eventFFSQuestions["state"]] || null,
          country_code: "USA",
          zip_code: surveyData[eventFFSQuestions["zip_code"]] ?
            String(surveyData[eventFFSQuestions["zip_code"]])
                .trim()
                .substring(0, 5) :
            null,
          phone: surveyData[eventFFSQuestions["phone"]] ?
            formatPhoneNumber(surveyData[eventFFSQuestions["phone"]]) :
            null,
          email: surveyData[eventFFSQuestions["email"]] || null,
          email_opt_in: surveyData[eventFFSQuestions["email_opt_in"]] || null,
          vehicle_driven_most_model_id:
            surveyData[eventFFSQuestions["vehicle_driven_most_model_id"]] ||
            null,
          in_market_timing:
            surveyData[eventFFSQuestions["in_market_timing"]] || null,
          accepts_sms: surveyData[eventFFSQuestions["accepts_sms"]] || false,
          how_likely_acquire:
            surveyData[eventFFSQuestions["how_likely_acquire"]] || null,
          how_likely_purchasing:
            surveyData[eventFFSQuestions["how_likely_purchasing"]] || null,
          how_likely_recommend:
            surveyData[eventFFSQuestions["how_likely_recommend"]] || null,
          how_likely_recommend_post:
            surveyData[eventFFSQuestions["how_likely_recommend_post"]] || null,
          followup_survey_opt_in:
            surveyData[eventFFSQuestions["followup_survey_opt_in"]] || null,
          signature: surveyData[eventFFSQuestions["signature"]] || null,
          minor_signature:
            surveyData[eventFFSQuestions["minor_signature"]] || null,
          custom_data: JSON.stringify(surveyData),
          birth_year: surveyData[eventFFSQuestions["birth_year"]] || null,
          gender: surveyData[eventFFSQuestions["gender"]] || null,
          age_bracket: surveyData[eventFFSQuestions["age_bracket"]] || null,
          vehicle_driven_most_year:
            surveyData[eventFFSQuestions["vehicle_driven_most_year"]] || null,
          impression_pre:
            surveyData[eventFFSQuestions["impression_pre"]] || null,
          impression_ev: surveyData[eventFFSQuestions["impression_ev"]] || null,
          can_trust: surveyData[eventFFSQuestions["can_trust"]] || null,
          impact_overall_opinion:
            surveyData[eventFFSQuestions["impact_overall_opinion"]] || null,
          optins: [], // TODO: add optins
        });

        docsToUpdate.push(answers.ref);

        if (eventFFSQuestions["voi"] && surveyData[eventFFSQuestions["voi"]]) {
          for (const vehicleID of surveyData[eventFFSQuestions["voi"]] || []) {
            voiToSend.push({
              vehicle_id: vehicleID,
              device_survey_guid: answers.id,
              survey_vehicle_guid: createMD5Hash(`${answers.id}-${vehicleID}`),
            });
          }
        }
      }
    }

    if (surveysToSend.length > 0) {
      await axios
          .post(
              "https://pfg.latitudewebservices.com/microsite/v1/survey/upload/v9",
              {
                surveyCollection: surveysToSend,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": `Bearer ${cronKey}`,
                },
              }
          )
          .catch((err: AxiosError) => {
          // Sentry.captureException(err);
            console.error("Error uploading Ford surveys", err);
          });
    }

    docsToUpdate.forEach((doc) => {
      doc.update({
        _exported: {
          ford: new Date(),
        },
      });
    });

    if (voiToSend.length > 0) {
      await axios
          .post(
              "https://pfg.latitudewebservices.com/microsite/v1/survey/insert/vehicles",
              voiToSend,
              {
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": `Bearer ${cronKey}`,
                },
              }
          )
          .catch((err: AxiosError) => {
          // Sentry.captureException(err);
            console.error("Error uploading Ford Street Team VOI", err);
          });
    }
  }
);