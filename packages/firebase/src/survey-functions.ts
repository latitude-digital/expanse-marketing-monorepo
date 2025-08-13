import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import cors from "cors";

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
 * Save Survey Function
 * Saves survey responses to Firestore
 */
export const saveSurveyImpl = (app: admin.app.App) => onRequest(
  { cors: true },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== 'POST') {
          res.status(405).json({ success: false, error: 'Method not allowed' });
          return;
        }

        const { eventID, survey } = req.body;
        
        if (!eventID || !survey) {
          res.status(400).json({ success: false, error: 'Event ID and survey data are required' });
          return;
        }

        logger.info(`Saving survey for event: ${eventID}`);
        
        const db = getFirestoreDb(app);
        
        // Check if event exists
        const eventRef = db.collection('events').doc(eventID);
        const eventDoc = await eventRef.get();
        
        if (!eventDoc.exists) {
          res.status(404).json({ success: false, error: 'Event not found' });
          return;
        }
        
        // Add server timestamp
        const surveyData = {
          ...survey,
          submittedAt: FieldValue.serverTimestamp(),
          eventID
        };
        
        // Save survey response
        const surveysRef = db.collection('events').doc(eventID).collection('surveys');
        const docRef = await surveysRef.add(surveyData);
        
        logger.info(`Survey saved with ID: ${docRef.id}`);
        
        // If this is a post-survey (has _preSurveyID), mark the pre-survey as used
        if (surveyData._preSurveyID) {
          try {
            const preEventID = eventData._preEventID || eventID;
            const preSurveyRef = db.collection('events').doc(preEventID).collection('surveys').doc(surveyData._preSurveyID);
            await preSurveyRef.update({
              _used: FieldValue.serverTimestamp()
            });
            logger.info(`Pre-survey ${surveyData._preSurveyID} marked as used`);
          } catch (usedError) {
            logger.error('Error marking pre-survey as used:', usedError);
            // Continue - post-survey was saved successfully even if _used update failed
          }
        }
        
        // Update event results/statistics if needed
        try {
          // Get current results
          const eventData = eventDoc.data();
          const currentResults = eventData?.results || { __totalCount: 0, __questions: [] };
          
          // Increment total count
          currentResults.__totalCount = (currentResults.__totalCount || 0) + 1;
          
          // Update question statistics
          Object.keys(survey).forEach(questionKey => {
            if (questionKey.startsWith('_') || questionKey === 'submittedAt' || questionKey === 'eventID') {
              return; // Skip metadata fields
            }
            
            // Add question to tracked questions if not already there
            if (!currentResults.__questions.includes(questionKey)) {
              currentResults.__questions.push(questionKey);
            }
            
            // Initialize question results if needed
            if (!currentResults[questionKey]) {
              currentResults[questionKey] = {};
            }
            
            // Increment answer count
            const answer = String(survey[questionKey]);
            currentResults[questionKey][answer] = (currentResults[questionKey][answer] || 0) + 1;
          });
          
          // Update event with new results
          await eventRef.update({ results: currentResults });
          logger.info('Event statistics updated');
        } catch (statsError) {
          logger.error('Error updating event statistics:', statsError);
          // Continue - survey was saved successfully even if stats update failed
        }
        
        res.status(200).json({ 
          success: true, 
          surveyId: docRef.id,
          message: 'Survey saved successfully'
        });
      } catch (error) {
        logger.error('Error in saveSurvey:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        });
      }
    });
  }
);

/**
 * Validate Email Function
 * Validates email address format and optionally checks for duplicates
 */
export const validateEmailImpl = (app: admin.app.App) => onRequest(
  { cors: true },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { email, eventID } = req.body;
        
        if (!email) {
          res.status(400).json({ success: false, error: 'Email is required' });
          return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.status(200).json({ 
            success: false, 
            valid: false,
            message: 'Invalid email format' 
          });
          return;
        }

        // If eventID provided, check for duplicates
        if (eventID) {
          const db = getFirestoreDb(app);
          const surveysRef = db.collection('events').doc(eventID).collection('surveys');
          const existingEmail = await surveysRef.where('email', '==', email).limit(1).get();
          
          if (!existingEmail.empty) {
            res.status(200).json({ 
              success: true, 
              valid: false,
              message: 'Email already registered for this event' 
            });
            return;
          }
        }

        res.status(200).json({ 
          success: true, 
          valid: true,
          message: 'Email is valid' 
        });
      } catch (error) {
        logger.error('Error in validateEmail:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        });
      }
    });
  }
);

/**
 * Check In/Out Survey Function
 * Handles event check-in and check-out processes
 */
export const checkInOutSurveyImpl = (app: admin.app.App) => onRequest(
  { cors: true },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { eventID, surveyID, action, data } = req.body;
        
        if (!eventID || !action) {
          res.status(400).json({ success: false, error: 'Event ID and action are required' });
          return;
        }

        logger.info(`Check ${action} for event: ${eventID}, survey: ${surveyID}`);
        
        const db = getFirestoreDb(app);
        
        if (action === 'checkIn') {
          // Handle check-in
          const checkInData = {
            ...data,
            checkInTime: FieldValue.serverTimestamp(),
            status: 'checked-in'
          };
          
          if (surveyID) {
            // Update existing survey
            await db.collection('events').doc(eventID).collection('surveys').doc(surveyID).update(checkInData);
          } else {
            // Create new check-in record
            const docRef = await db.collection('events').doc(eventID).collection('surveys').add(checkInData);
            res.status(200).json({ success: true, surveyID: docRef.id });
            return;
          }
        } else if (action === 'checkOut') {
          // Handle check-out
          if (!surveyID) {
            res.status(400).json({ success: false, error: 'Survey ID required for check-out' });
            return;
          }
          
          const checkOutData = {
            ...data,
            checkOutTime: FieldValue.serverTimestamp(),
            status: 'checked-out'
          };
          
          await db.collection('events').doc(eventID).collection('surveys').doc(surveyID).update(checkOutData);
        } else {
          res.status(400).json({ success: false, error: 'Invalid action' });
          return;
        }

        res.status(200).json({ success: true, message: `${action} successful` });
      } catch (error) {
        logger.error('Error in checkInOutSurvey:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        });
      }
    });
  }
);

/**
 * Create New User Function
 * Creates a new user account
 */
export const createNewUserImpl = (app: admin.app.App) => onRequest(
  { cors: true },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { email, password, displayName, phoneNumber } = req.body;
        
        if (!email || !password) {
          res.status(400).json({ success: false, error: 'Email and password are required' });
          return;
        }

        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName,
          phoneNumber,
          emailVerified: false
        });

        logger.info(`User created: ${userRecord.uid}`);

        // Store additional user data in Firestore if needed
        const db = getFirestoreDb(app);
        await db.collection('users').doc(userRecord.uid).set({
          email,
          displayName,
          phoneNumber,
          createdAt: FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
          success: true, 
          uid: userRecord.uid,
          message: 'User created successfully' 
        });
      } catch (error) {
        logger.error('Error in createNewUser:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        });
      }
    });
  }
);