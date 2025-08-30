import { onCall } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { uploadSurveyToAPI, registerCustomQuestionTypes } from "@expanse/shared";
import { Model } from 'survey-core';

/**
 * Get Ford and Lincoln events with survey counts for re-upload
 */
export const getFordLincolnEventsImpl = (app: admin.app.App) => 
  onCall(async (request) => {
    try {
      const db = admin.firestore();
      
      // Query events that have either fordEventID or lincolnEventID
      const eventsRef = db.collection('events');
      const snapshot = await eventsRef
        .where('brand', 'in', ['Ford', 'Lincoln'])
        .limit(100)
        .get();

      const events = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get survey count for this event - check the surveys subcollection
        const surveysSnapshot = await db
          .collection('events')
          .doc(doc.id)
          .collection('surveys')
          .select() // Only get document IDs, not full data
          .get();
        
        return {
          id: doc.id,
          name: data.name,
          brand: data.brand,
          fordEventID: data.fordEventID,
          lincolnEventID: data.lincolnEventID,
          surveyType: data.surveyType || 'basic',
          surveyCount: surveysSnapshot.size,
          lastModified: data.lastModified?.toDate?.() || data.lastModified,
          surveyJSModel: data.surveyJSModel,
          questions: data.questions,
          surveyJSTheme: data.surveyJSTheme,
          theme: data.theme
        };
      }));

      return { success: true, events };
    } catch (error) {
      console.error('Error fetching Ford/Lincoln events:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch events');
    }
  });

/**
 * Get all surveys for a specific event
 */
export const getEventSurveysImpl = (app: admin.app.App) => 
  onCall(async (request) => {
    try {
      const { eventId } = request.data;
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const db = admin.firestore();
      
      // Get all surveys for this event from the subcollection
      const surveysSnapshot = await db
        .collection('events')
        .doc(eventId)
        .collection('surveys')
        .get();

      const surveys = surveysSnapshot.docs.map(doc => ({
        path: `events/${eventId}/surveys/${doc.id}`,
        id: doc.id,
        data: doc.data()
      }));

      return { 
        success: true, 
        surveys,
        count: surveys.length 
      };
    } catch (error) {
      console.error('Error fetching event surveys:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch surveys');
    }
  });

/**
 * Re-upload surveys for a specific event using server-side API calls
 */
export const reuploadEventSurveysImpl = (app: admin.app.App) => 
  onCall(async (request) => {
    try {
      const { eventId } = request.data;
      
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const db = admin.firestore();
      
      // Get event data
      const eventDoc = await db.collection('events').doc(eventId).get();
      
      if (!eventDoc.exists) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      const eventData = eventDoc.data()!;
      
      // Validate that this is a Ford or Lincoln event
      if (!((eventData.brand === 'Ford' && eventData.fordEventID) || 
            (eventData.brand === 'Lincoln' && eventData.lincolnEventID))) {
        throw new Error(`Event ${eventId} is not a valid Ford or Lincoln event for re-upload`);
      }

      // Get all surveys for this event
      const surveysSnapshot = await db
        .collection('events')
        .doc(eventId)
        .collection('surveys')
        .get();

      const results = {
        total: surveysSnapshot.size,
        successful: 0,
        failed: 0,
        errors: [] as Array<{
          documentPath: string;
          error: string;
          details?: unknown;
        }>
      };

      // Process surveys in batches to avoid overwhelming the API
      const batchSize = 5;
      const surveys = surveysSnapshot.docs;
      
      for (let i = 0; i < surveys.length; i += batchSize) {
        const batch = surveys.slice(i, i + batchSize);
        const promises = batch.map(async (surveyDoc) => {
          const documentPath = `events/${eventId}/surveys/${surveyDoc.id}`;
          try {
            const surveyData = surveyDoc.data();
            
            // Register custom question types based on event brand
            // This MUST happen before creating the Model, otherwise custom questions are ignored
            registerCustomQuestionTypes(eventData.brand);
            
            // Parse survey model exactly like the client-side Survey.tsx does
            const surveyJSON = eventData.surveyJSModel || 
                              (eventData.questions ? JSON.parse(eventData.questions) : {});
            console.log('[REUPLOAD DEBUG] eventData.surveyJSModel exists:', !!eventData.surveyJSModel);
            console.log('[REUPLOAD DEBUG] eventData.questions exists:', !!eventData.questions);
            console.log('[REUPLOAD DEBUG] Survey brand:', eventData.brand);
            console.log('[REUPLOAD DEBUG] surveyJSON structure:', JSON.stringify(surveyJSON, null, 2).substring(0, 500));
            const surveyModel = new Model(surveyJSON);
            console.log('[REUPLOAD DEBUG] Created surveyModel questions count:', surveyModel.getAllQuestions().length);
            
            // Log question details to verify registration worked
            surveyModel.getAllQuestions().forEach((q, idx) => {
              console.log(`[REUPLOAD DEBUG] Question ${idx + 1}:`, {
                name: q.name,
                type: q.getType(),
                ffs: q.getPropertyValue('_ffs')
              });
            });
            
            // DO NOT load survey data into model - it corrupts the model structure
            // The mapper will use surveyData directly to get values
            
            // The surveyData is the stored survey data from Firestore
            const fullSurveyData: Record<string, unknown> = {
              ...surveyData,
              // Ensure critical metadata fields are preserved
              device_survey_guid: surveyData.device_survey_guid,
              survey_source: surveyData.survey_source || 'expanse_2.0',
              survey_date: surveyData.survey_date,
              start_time: surveyData.start_time,
              complete_time: surveyData.complete_time,
              event_name: surveyData.event_name,
              eventName: surveyData.eventName,
            };
            
            console.log('[REUPLOAD DEBUG] Processing survey:', surveyDoc.id);
            console.log('[REUPLOAD DEBUG] Original surveyData keys:', Object.keys(surveyData));
            console.log('[REUPLOAD DEBUG] address_group in surveyData:', (surveyData as Record<string, unknown>).address_group);
            console.log('[REUPLOAD DEBUG] fordEmailOptIn in surveyData:', (surveyData as Record<string, unknown>).fordEmailOptIn);
            console.log('[REUPLOAD DEBUG] Final fullSurveyData structure sample:', {
              address_group: fullSurveyData.address_group,
              fordEmailOptIn: fullSurveyData.fordEmailOptIn,
              first_name: fullSurveyData.first_name,
              last_name: fullSurveyData.last_name,
              email: fullSurveyData.email
            });
            
            // Only include pre_drive_survey_guid if it has a real value
            const surveyDataRecord = surveyData as Record<string, unknown>;
            if (surveyDataRecord.pre_drive_survey_guid && 
                surveyDataRecord.pre_drive_survey_guid !== "undefined" && 
                surveyDataRecord.pre_drive_survey_guid !== "null") {
              fullSurveyData.pre_drive_survey_guid = surveyDataRecord.pre_drive_survey_guid;
            }
            
            // Same for preSurveyID
            if (surveyDataRecord.preSurveyID && 
                surveyDataRecord.preSurveyID !== "undefined" && 
                surveyDataRecord.preSurveyID !== "null") {
              fullSurveyData.preSurveyID = surveyDataRecord.preSurveyID;
            }
            
            // Use the shared upload utility - pass the surveyModel for proper _ffs field mapping
            const uploadResult = await uploadSurveyToAPI(
              {
                id: eventId,
                name: eventData.name,
                brand: eventData.brand,
                fordEventID: eventData.fordEventID,
                lincolnEventID: eventData.lincolnEventID,
                surveyType: eventData.surveyType || 'basic',
                surveyJSModel: eventData.surveyJSModel
              },
              fullSurveyData,
              surveyModel  // Pass the model with survey data loaded for proper _ffs mapping
            );

            if (uploadResult.success) {
              results.successful++;
              
              // Mark survey as re-uploaded
              await surveyDoc.ref.update({
                _reuploadedToAPI: true,
                _reuploadedAt: new Date(),
                _reuploadBrand: eventData.brand
              });
            } else {
              throw new Error(uploadResult.error || 'Upload failed');
            }
          } catch (error: unknown) {
            console.error('Server-side re-upload error for survey:', surveyDoc.id, error);
            results.failed++;
            results.errors.push({
              documentPath: documentPath,
              error: error instanceof Error ? error.message : 'Unknown error',
              details: error
            });
            
            // Mark upload attempt with error
            await surveyDoc.ref.update({
              _reuploadError: error instanceof Error ? error.message : 'Unknown error',
              _reuploadAttemptedAt: new Date()
            });
          }
        });

        await Promise.all(promises);
      }

      return { 
        success: true, 
        results
      };
    } catch (error) {
      console.error('Error in server-side re-upload:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to re-upload surveys');
    }
  });