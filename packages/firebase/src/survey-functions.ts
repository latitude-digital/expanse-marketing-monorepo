import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {getFunctions} from "firebase-admin/functions";
import cors from "cors";
import moment from "moment-timezone";
import {getFunctionUrl} from "./utils";

// Configure CORS
const corsHandler = cors({ origin: true });

// Helper to get Firestore instance with correct database
export const getFirestoreDb = (app: admin.app.App) => {
  // When using emulator, always use default database
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    logger.info(`Using Firestore emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    const { getFirestore } = require('firebase-admin/firestore');
    return getFirestore(app);
  }
  
  const database = process.env.DB_NAME || "(default)";
  logger.info(`Using database: ${database}, environment: ${process.env.LATITUDE_ENV || "production"}`);
  const { getFirestore } = require('firebase-admin/firestore');
  if (database === "(default)") {
    return getFirestore(app);
  } else {
    return getFirestore(app, database);
  }
};

/**
 * Get Survey Function
 * Fetches survey configuration and event data
 */
export const getSurveyImpl = (app: admin.app.App) => onRequest(
  { cors: true },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ success: false, error: 'Method not allowed' });
          return;
        }

        const { eventID, preSurveyID } = req.body;
        
        if (!eventID) {
          res.status(400).json({ success: false, error: 'Event ID is required' });
          return;
        }

        logger.info(`Getting survey for event: ${eventID}, preSurveyID: ${preSurveyID}`);
        
        const db = getFirestoreDb(app);
        
        // Fetch event data
        const eventRef = db.collection('events').doc(eventID);
        const eventDoc = await eventRef.get();
        
        if (!eventDoc.exists) {
          res.status(404).json({ success: false, error: 'Event not found' });
          return;
        }
        
        const eventData = eventDoc.data();
        
        // Convert Firestore timestamps to ISO strings
        const event = {
          ...eventData,
          id: eventDoc.id,
          startDate: eventData.startDate?.toDate?.()?.toISOString() || eventData.startDate,
          endDate: eventData.endDate?.toDate?.()?.toISOString() || eventData.endDate,
          preRegDate: eventData.preRegDate?.toDate?.()?.toISOString() || eventData.preRegDate,
          // Support both new map fields and legacy JSON string fields
          questions: typeof eventData.questions === 'string' ? eventData.questions : JSON.stringify(eventData.questions || {}),
          theme: typeof eventData.theme === 'string' ? eventData.theme : JSON.stringify(eventData.theme || {}),
          // Include new map fields if they exist
          surveyJSModel: eventData.surveyJSModel || undefined,
          surveyJSTheme: eventData.surveyJSTheme || undefined
        };
        
        // Prepare response
        const response: any = {
          success: true,
          event
        };
        
        // If preSurveyID is provided, fetch pre-survey data
        if (preSurveyID) {
          try {
            // For post-events, pre-surveys are stored in the pre-event's collection, not the post-event's
            const preEventID = eventData._preEventID || eventID;
            const preSurveyRef = db.collection('events').doc(preEventID).collection('surveys').doc(preSurveyID);
            const preSurveyDoc = await preSurveyRef.get();
            
            if (preSurveyDoc.exists) {
              const preSurveyData = preSurveyDoc.data();
              
              // Check if pre-survey is already used (post-survey already completed)
              if (preSurveyData._used) {
                res.status(400).json({
                  success: false,
                  error: 'This pre-survey has already been used for a post-survey. Only one post-survey per pre-survey is allowed.'
                });
                return;
              }
              
              response.preSurvey = {
                id: preSurveyDoc.id,
                ...preSurveyData
              };
              logger.info(`Found pre-survey: ${preSurveyID}`);
            } else {
              logger.warn(`Pre-survey not found: ${preSurveyID}`);
            }
          } catch (error) {
            logger.error('Error fetching pre-survey:', error);
            // Continue without pre-survey data
          }
        }
        
        res.status(200).json(response);
      } catch (error) {
        logger.error('Error in getSurvey:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        });
      }
    });
  }
);





/**
 * Save Survey Function - COMPLETE RESTORATION
 * This includes all the missing logic from the original implementation
 */
export const saveSurveyImpl = (app: admin.app.App) => onRequest(
  {
    cors: true,
    concurrency: 50,
  },
  async (req, res) => {
    const {eventID, survey} = req.body;

    try {
      const db = getFirestoreDb(app);
      const doc = await db
          .collection("events")
          .doc(eventID)
          .get();
      const thisEvent = doc.data();

      if (!thisEvent) {
        res.status(404).send({
          success: false,
          message: "Event not found",
        });
        return;
      }

      // if event/preReg hasn't started
      if (
        moment
            .tz(
                thisEvent.preRegDate?.toDate() || thisEvent.startDate.toDate(),
                thisEvent.timeZone || "America/New_York"
            )
            .startOf("day")
            .toDate() > new Date()
      ) {
        res.status(403).send({
          success: false,
          message: "Event has not started yet",
        });
        return;
      }

      // if event ended
      if (
        moment
            .tz(
                thisEvent.endDate.toDate(),
                thisEvent.timeZone || "America/Los_Angeles"
            )
            .endOf("day")
            .toDate() < new Date()
      ) {
        res.status(403).send({
          success: false,
          message: "Event has ended",
        });
        return;
      }

      // Check if this is a postTD event and has a linked pre-survey
      if (thisEvent.surveyType === "postTD" && survey._preSurveyID && thisEvent._preEventID) {
        // For postTD events, we need to get the pre-survey's device_survey_guid
        try {
          // Get the pre-survey data
          const preSurveyDoc = await db
              .doc(`events/${thisEvent._preEventID}/surveys/${survey._preSurveyID}`)
              .get();

          if (preSurveyDoc.exists) {
            const preSurveyData = preSurveyDoc.data();

            // Set the pre_drive_survey_guid to the pre-survey's device_survey_guid
            survey.pre_drive_survey_guid = preSurveyData.device_survey_guid || survey._preSurveyID;

            // Copy user information from pre-survey if they exist (only if not already provided)
            if (preSurveyData.first_name && !survey.first_name) survey.first_name = preSurveyData.first_name;
            if (preSurveyData.last_name && !survey.last_name) survey.last_name = preSurveyData.last_name;
            if (preSurveyData.email && !survey.email) survey.email = preSurveyData.email;
            if (preSurveyData.phone && !survey.phone) survey.phone = preSurveyData.phone;
          }
        } catch (err) {
          console.error("Error fetching pre-survey for postTD:", err);
          // Continue saving even if we couldn't get the pre-survey
        }
      }

      // Save the survey
      const savedSurvey = await doc.ref
          .collection("surveys")
          .add(survey);

      res.send({
        success: true,
        message: "Survey Saved",
        surveyID: savedSurvey.id,
      });
      return;
    } catch (err) {
      console.error("Error in saveSurvey:", err);
      res.status(500).send({
        success: false,
        message: "Error saving survey",
        error: err,
      });
      return;
    }
  }
);

/**
 * Check In/Out Survey Function - COMPLETE RESTORATION
 * This includes all the missing auto-checkout and email logic
 */
export const checkInOutSurveyImpl = (app: admin.app.App) => onRequest(
  {
    cors: true,
    concurrency: 50,
  },
  async (req, res) => {
    const {eventID, surveyID, data} = req.body;

    // Validate required parameters
    if (!eventID || !surveyID) {
      res.status(400).send({
        success: false,
        message: "Missing required parameters: eventID and surveyID",
      });
      return;
    }

    // Build update object from data
    const updateData: any = {};
    
    // convert strings to timestamps for check-in/out fields
    if (data?._checkedIn) {
      updateData._checkedIn = new Date(data._checkedIn);
    }
    
    if (data?._checkedOut) {
      updateData._checkedOut = new Date(data._checkedOut);
    }

    try {
      const db = getFirestoreDb(app);
      
      // Update the survey with the provided data
      await db
          .doc(`events/${eventID}/surveys/${surveyID}`)
          .update(updateData);

      // Get the event data to check for configurations
      const eventDoc = await db
          .doc(`events/${eventID}`)
          .get();

      const eventData = eventDoc.data();

      // If checking in and auto-check-out is configured, schedule the task
      if (updateData._checkedIn && eventData && eventData.autoCheckOut) {
        const {minutesAfter, postEventId} = eventData.autoCheckOut;

        if (minutesAfter && postEventId) {
          const autoCheckOutQueue = getFunctions().taskQueue("autoCheckOut");
          const autoCheckOutUri = await getFunctionUrl("autoCheckOut");

          // Schedule the auto-check-out task
          const scheduleTime = new Date(updateData._checkedIn.getTime() + minutesAfter * 60 * 1000);

          await autoCheckOutQueue.enqueue(
              {
                preEventID: eventID,
                surveyID: surveyID,
                postEventID: postEventId,
                checkOutEmailTemplate: eventData.checkOutEmail?.template || null,
              },
              {
                scheduleTime,
                uri: autoCheckOutUri,
              }
          );

          console.log(`Scheduled auto-checkout for survey ${surveyID} at ${scheduleTime}`);
        }
      }

      // If manually checking out, send email if configured
      if (updateData._checkedOut && eventData) {
        console.log("Manual checkout detected for survey:", surveyID);
        console.log("Event data checkOutEmail:", eventData.checkOutEmail);
        console.log("Event data autoCheckOut:", eventData.autoCheckOut);

        const checkOutEmailTemplate = eventData.checkOutEmail?.template;
        const postEventId = eventData.autoCheckOut?.postEventId;

        if (checkOutEmailTemplate && postEventId) {
          console.log("Email template and postEventId found, proceeding with email");
          // Get the full survey data
          const surveyDoc = await db
              .doc(`events/${eventID}/surveys/${surveyID}`)
              .get();

          const surveyData = surveyDoc.data();

          if (surveyData) {
            const postEventDoc = await db
                .doc(`events/${postEventId}`)
                .get();

            const postEventData = postEventDoc.data();

            if (postEventData) {
              const email = surveyData.email || surveyData._email;

              if (email) {
                const emailQueue = getFunctions().taskQueue("scheduledEmail");
                const emailUri = await getFunctionUrl("scheduledEmail");

                const surveyUrl = `https://survey.expansemarketing.com/s/${postEventId}?pid=${surveyID}`;

                await emailQueue.enqueue(
                    {
                      template: checkOutEmailTemplate,
                      email,
                      substitutionData: {
                        event: {
                          id: postEventId,
                          ...postEventData,
                          questions: JSON.parse(postEventData.questions || "{}"),
                          theme: JSON.parse(postEventData.theme || "{}"),
                        },
                        survey: {
                          id: surveyID,
                          ...surveyData,
                        },
                        survey_url: surveyUrl,
                      },
                    },
                    {
                      uri: emailUri,
                    }
                );

                console.log("Manual check-out email queued for", email);
              } else {
                console.log("No email address found for survey");
              }
            } else {
              console.log("No post event data found");
            }
          } else {
            console.log("No survey data found");
          }
        } else {
          console.log("Missing email template or postEventId:", {
            checkOutEmailTemplate,
            postEventId,
          });
        }
      }

      res.send({
        success: true,
        message: "Survey Checked In/Out",
      });
      return;
    } catch (err) {
      console.error("Error in checkInOutSurvey:", err);
      res.status(500).send({
        success: false,
        message: "Error checking in/out",
        error: err,
      });
      return;
    }
  }
);