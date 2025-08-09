import { onCall, HttpsError } from "firebase-functions/v2/https";
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
      // This is a placeholder implementation
      // In production, this would generate actual CloudFront signed cookies
      // using AWS SDK and proper CloudFront key pair
      
      logger.info("Setting CloudFront cookies for user", { 
        uid: request.auth.uid,
        environment: environment.value(),
        database: dbName.value()
      });
      
      // For now, return mock cookies structure
      // In production, you would:
      // 1. Use AWS SDK to generate CloudFront signed cookies
      // 2. Set proper expiry times
      // 3. Use actual CloudFront key pair and policy
      
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

// Survey Limit Check Function Implementation
export const checkSurveyLimitImpl = (app: admin.app.App) =>
  onCall(async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    try {
      const { surveyId, deviceId } = request.data;
      
      if (!surveyId) {
        throw new HttpsError(
          "invalid-argument",
          "Survey ID is required"
        );
      }

      logger.info("Checking survey limit", { 
        uid: request.auth.uid, 
        surveyId, 
        deviceId,
        environment: environment.value(),
        database: dbName.value()
      });

      // Get the correct database instance
      const db = getFirestore(app);
      const responsesRef = db.collection("surveyResponses");
      
      let query = responsesRef.where("surveyId", "==", surveyId);
      
      if (deviceId) {
        query = query.where("deviceId", "==", deviceId);
      } else {
        query = query.where("userId", "==", request.auth.uid);
      }

      const snapshot = await query.get();
      const responseCount = snapshot.size;
      
      // Get survey configuration to check limits
      const surveyDoc = await db.collection("surveys").doc(surveyId).get();
      const surveyData = surveyDoc.data();
      
      const maxResponses = surveyData?.maxResponses || 1; // Default to 1 response per user
      const canSubmit = responseCount < maxResponses;
      
      return {
        canSubmit,
        responseCount,
        maxResponses,
        remaining: Math.max(0, maxResponses - responseCount)
      };
    } catch (error) {
      logger.error("Error checking survey limit", error);
      Sentry.captureException(error, {
        tags: {
          function: "checkSurveyLimit",
          environment: process.env.LATITUDE_ENV || "production",
        },
      });
      throw new HttpsError(
        "internal",
        "Unable to check survey limit"
      );
    }
  });

// Survey Limit Validation Function Implementation
export const validateSurveyLimitImpl = (app: admin.app.App) =>
  onCall(async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    try {
      const { surveyId, deviceId, responseData } = request.data;
      
      if (!surveyId || !responseData) {
        throw new HttpsError(
          "invalid-argument",
          "Survey ID and response data are required"
        );
      }

      logger.info("Validating survey limit before submission", { 
        uid: request.auth.uid, 
        surveyId, 
        deviceId,
        environment: environment.value(),
        database: dbName.value()
      });

      // Get the correct database instance
      const db = getFirestore(app);
      const responsesRef = db.collection("surveyResponses");
      
      let query = responsesRef.where("surveyId", "==", surveyId);
      
      if (deviceId) {
        query = query.where("deviceId", "==", deviceId);
      } else {
        query = query.where("userId", "==", request.auth.uid);
      }

      const snapshot = await query.get();
      const responseCount = snapshot.size;
      
      // Get survey configuration to check limits
      const surveyDoc = await db.collection("surveys").doc(surveyId).get();
      const surveyData = surveyDoc.data();
      
      const maxResponses = surveyData?.maxResponses || 1; // Default to 1 response per user
      const canSubmit = responseCount < maxResponses;
      
      if (!canSubmit) {
        throw new HttpsError(
          "permission-denied",
          "Survey response limit exceeded"
        );
      }

      // If validation passes, store the response
      const responseDoc = {
        surveyId,
        userId: request.auth.uid,
        deviceId: deviceId || null,
        responseData,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        userEmail: request.auth.token?.email || null
      };

      const docRef = await db.collection("surveyResponses").add(responseDoc);
      
      logger.info("Survey response stored", { 
        uid: request.auth.uid, 
        surveyId, 
        responseId: docRef.id,
        environment: environment.value(),
        database: dbName.value()
      });

      return {
        success: true,
        responseId: docRef.id,
        message: "Survey response submitted successfully"
      };
    } catch (error) {
      logger.error("Error validating and storing survey response", error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      Sentry.captureException(error, {
        tags: {
          function: "validateSurveyLimit",
          environment: process.env.LATITUDE_ENV || "production",
        },
      });
      
      throw new HttpsError(
        "internal",
        "Unable to validate and store survey response"
      );
    }
  });