import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry
Sentry.init({
  dsn: "https://6cb92ce976bb381de2b0423d9f688102@o4506238718967808.ingest.us.sentry.io/4509814513926144",
  environment: process.env.LATITUDE_ENV || "production",
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

// Define environment parameters
const dbName = defineString("DB_NAME", { default: "(default)" });
const environment = defineString("LATITUDE_ENV", { default: "production" });

// Get the appropriate Firestore instance based on environment
export const getFirestore = (app: admin.app.App) => {
  const database = process.env.DB_NAME || "(default)";
  logger.info(`Using database: ${database}, environment: ${process.env.LATITUDE_ENV || "production"}`);
  
  // For Firebase Admin SDK v11+, use the getFirestore method with database parameter
  const { getFirestore: getFirestoreDb } = require('firebase-admin/firestore');
  
  if (database === "(default)") {
    return getFirestoreDb(app);
  } else {
    // Use the named database for non-default databases
    return getFirestoreDb(app, database);
  }
};

// Bronco Rank Function Implementation
export const getBroncoRankImpl = (app: admin.app.App) => 
  onRequest(
    {
      cors: true,
      concurrency: 50,
    },
    async (req, res) => {
      try {
        const db = getFirestore(app);
        const query = await db
            .collection("events/BroncoQuizDraft/surveys")
            .orderBy("start_time", "desc")
            .limit(100)
            .get();

        const currentCount: Record<string, number> = {};

        for (const doc of query.docs) {
          const survey = doc.data();
          currentCount[survey._correct_answers] = (currentCount[survey._correct_answers] || 0) + 1;
        }

        res.send({
          success: true,
          currentCount,
        });
      } catch (error) {
        logger.error("Error getting Bronco rank", error);
        Sentry.captureException(error, {
          tags: {
            function: "getBroncoRank",
            environment: process.env.LATITUDE_ENV || "production",
          },
        });
        res.status(500).send({
          success: false,
          message: "Error getting Bronco rank",
          error,
        });
      }
    }
  );

// CloudFront Cookie Management Function Implementation  
export const setCloudFrontCookiesImpl = (app: admin.app.App) => 
  onCall(async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    try {
      logger.info("Setting CloudFront cookies for user", { 
        uid: request.auth.uid,
        environment: environment.value(),
        database: dbName.value()
      });
      
      // NOTE: This is now handled by the real implementation in setCloudFrontCookies.ts
      // This function should delegate to that implementation or be replaced
      
      const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      return {
        cookies: {
          "CloudFront-Policy": "mock-policy-base64",
          "CloudFront-Signature": "mock-signature-base64", 
          "CloudFront-Key-Pair-Id": "mock-key-pair-id"
        },
        expires
      };
    } catch (error) {
      logger.error("Error setting CloudFront cookies", error);
      Sentry.captureException(error, {
        tags: {
          function: "setCloudFrontCookies",
          environment: process.env.LATITUDE_ENV || "production",
        },
      });
      throw new HttpsError(
        "internal",
        "Unable to set CloudFront cookies"
      );
    }
  });

// Survey Limit Check Function Implementation (from original index.ts)
export const checkSurveyLimitImpl = (app: admin.app.App) =>
  onCall(
    {
      cors: true,
    },
    async (request) => {
      const {eventId, bypass} = request.data;

      if (!eventId) {
        throw new Error("Event ID is required");
      }

      // Get event document
      const db = getFirestore(app);
      const eventDoc = await db
          .collection("events")
          .doc(eventId)
          .get();

      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data();

      // Fast path: no limit set
      if (!event?.survey_count_limit) {
        return {limitReached: false};
      }

      // Check bypass parameter
      if (bypass === "1" || bypass === true) {
        return {limitReached: false};
      }

      // Get survey count
      const surveysSnapshot = await db
          .collection(`events/${eventId}/surveys`)
          .count()
          .get();

      const currentCount = surveysSnapshot.data().count;

      if (currentCount >= event.survey_count_limit) {
        return {
          limitReached: true,
          message: event.limit_reached_message || "Survey limit reached",
        };
      }

      return {limitReached: false};
    }
  );

// Survey Limit Validation Function Implementation (from original index.ts)
export const validateSurveyLimitImpl = (app: admin.app.App) =>
  onCall(
    {
      cors: true,
    },
    async (request) => {
      const {eventId, bypass} = request.data;

      if (!eventId) {
        throw new Error("Event ID is required");
      }

      // Get event document
      const db = getFirestore(app);
      const eventDoc = await db
          .collection("events")
          .doc(eventId)
          .get();

      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      const event = eventDoc.data();

      // Fast path: no limit set
      if (!event?.survey_count_limit) {
        return {canSave: true};
      }

      // Check bypass parameter
      if (bypass === "1" || bypass === true) {
        return {canSave: true};
      }

      // Get survey count
      const surveysSnapshot = await db
          .collection(`events/${eventId}/surveys`)
          .count()
          .get();

      const currentCount = surveysSnapshot.data().count;

      if (currentCount >= event.survey_count_limit) {
        throw new Error(event.limit_reached_message || "Survey limit reached");
      }

      return {canSave: true};
    }
  );

// Lions Followups Function Implementation
export const getLionsFollowupsImpl = (app: admin.app.App) =>
  onRequest(
    {
      cors: true,
      concurrency: 50,
    },
    async (req, res) => {
      try {
        // Get query parameters
        const dataSince = req.query.dataSince as string;
        const source = req.query.source as string;

        // Validate required parameters
        if (!dataSince) {
          res.status(400).send({
            success: false,
            message: "dataSince parameter is required",
          });
          return;
        }

        if (!source || (source !== "gate" && source !== "plaza")) {
          res.status(400).send({
            success: false,
            message: "source parameter is required and must be 'gate' or 'plaza'",
          });
          return;
        }

        // Determine collection path based on source
        const collectionPath = source === "gate" 
          ? "events/2025_Lions_Gate_G_Follow_Up/surveys"
          : "events/2025_Lions_Pride_Plaza_Follow_Up/surveys";

        // Parse the date string and create an ISO string for midnight of that date
        // survey_date is stored as a string in ISO format, not as a Firestore Timestamp
        const sinceDate = new Date(dataSince);
        sinceDate.setHours(0, 0, 0, 0);
        const sinceDateString = sinceDate.toISOString();

        // Query the collection for surveys on or after the specified date
        // Using string comparison since survey_date is stored as an ISO string
        const db = getFirestore(app);
        const surveysQuery = await db
          .collection(collectionPath)
          .where("survey_date", ">=", sinceDateString)
          .get();

        // Map the results to include only the required fields
        const surveys = surveysQuery.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          survey_date: doc.data().survey_date,
          start_time: doc.data().start_time,
          end_time: doc.data().end_time,
          device_survey_guid: doc.data().device_survey_guid,
          device_id: doc.data().device_id,
          capability: doc.data().capability,
          passion: doc.data().passion,
        }));

        res.send({
          success: true,
          count: surveys.length,
          surveys,
        });
      } catch (error) {
        logger.error("Error getting Lions followups", error);
        Sentry.captureException(error, {
          tags: {
            function: "getLionsFollowups",
            environment: process.env.LATITUDE_ENV || "production",
          },
        });
        res.status(500).send({
          success: false,
          message: "Error getting Lions followups",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );