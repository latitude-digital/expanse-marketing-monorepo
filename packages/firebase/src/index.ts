import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// CloudFront Cookie Management Function
export const setCloudFrontCookies = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    // This is a placeholder implementation
    // In production, this would generate actual CloudFront signed cookies
    // using AWS SDK and proper CloudFront key pair
    
    functions.logger.info("Setting CloudFront cookies for user", { uid: context.auth.uid });
    
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
    functions.logger.error("Error setting CloudFront cookies", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to set CloudFront cookies"
    );
  }
});

// Survey Limit Check Function
export const checkSurveyLimit = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const { surveyId, deviceId } = data;
    
    if (!surveyId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Survey ID is required"
      );
    }

    functions.logger.info("Checking survey limit", { 
      uid: context.auth.uid, 
      surveyId, 
      deviceId 
    });

    // Query Firestore for survey responses count
    const db = admin.firestore();
    const responsesRef = db.collection("surveyResponses");
    
    let query = responsesRef.where("surveyId", "==", surveyId);
    
    if (deviceId) {
      query = query.where("deviceId", "==", deviceId);
    } else {
      query = query.where("userId", "==", context.auth.uid);
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
    functions.logger.error("Error checking survey limit", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to check survey limit"
    );
  }
});

// Survey Limit Validation Function
export const validateSurveyLimit = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  try {
    const { surveyId, deviceId, responseData } = data;
    
    if (!surveyId || !responseData) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Survey ID and response data are required"
      );
    }

    functions.logger.info("Validating survey limit before submission", { 
      uid: context.auth.uid, 
      surveyId, 
      deviceId 
    });

    // First check if user can still submit by implementing the same logic
    const db = admin.firestore();
    const responsesRef = db.collection("surveyResponses");
    
    let query = responsesRef.where("surveyId", "==", surveyId);
    
    if (deviceId) {
      query = query.where("deviceId", "==", deviceId);
    } else {
      query = query.where("userId", "==", context.auth.uid);
    }

    const snapshot = await query.get();
    const responseCount = snapshot.size;
    
    // Get survey configuration to check limits
    const surveyDoc = await db.collection("surveys").doc(surveyId).get();
    const surveyData = surveyDoc.data();
    
    const maxResponses = surveyData?.maxResponses || 1; // Default to 1 response per user
    const canSubmit = responseCount < maxResponses;
    
    if (!canSubmit) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Survey response limit exceeded"
      );
    }

    // If validation passes, store the response
    const responseDoc = {
      surveyId,
      userId: context.auth.uid,
      deviceId: deviceId || null,
      responseData,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      userEmail: context.auth.token.email || null
    };

    const docRef = await db.collection("surveyResponses").add(responseDoc);
    
    functions.logger.info("Survey response stored", { 
      uid: context.auth.uid, 
      surveyId, 
      responseId: docRef.id 
    });

    return {
      success: true,
      responseId: docRef.id,
      message: "Survey response submitted successfully"
    };
  } catch (error) {
    functions.logger.error("Error validating and storing survey response", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Unable to validate and store survey response"
    );
  }
});