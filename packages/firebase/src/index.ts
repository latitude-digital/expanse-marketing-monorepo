import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
  setCloudFrontCookiesImpl,
  checkSurveyLimitImpl,
  validateSurveyLimitImpl
} from "./functions";
import {
  getSurveyImpl,
  saveSurveyImpl,
  validateEmailImpl,
  checkInOutSurveyImpl,
  createNewUserImpl
} from "./survey-functions";

// Initialize Firebase Admin SDK with emulator support
const app = admin.initializeApp();

// Log emulator configuration
if (process.env.FIRESTORE_EMULATOR_HOST) {
  logger.info(`Firestore emulator detected at: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Create function implementations
const setCloudFrontCookies = setCloudFrontCookiesImpl(app);
const checkSurveyLimit = checkSurveyLimitImpl(app);
const validateSurveyLimit = validateSurveyLimitImpl(app);
const getSurvey = getSurveyImpl(app);
const saveSurvey = saveSurveyImpl(app);
const validateEmail = validateEmailImpl(app);
const checkInOutSurvey = checkInOutSurveyImpl(app);
const createNewUser = createNewUserImpl(app);

// Export functions with explicit namespaces
// Staging environment
export const staging = {
  setCloudFrontCookies,
  checkSurveyLimit,
  validateSurveyLimit,
  getSurvey,
  saveSurvey,
  validateEmail,
  checkInOutSurvey,
  createNewUser
};

// Production environment
export const prod = {
  setCloudFrontCookies,
  checkSurveyLimit,
  validateSurveyLimit,
  getSurvey,
  saveSurvey,
  validateEmail,
  checkInOutSurvey,
  createNewUser
};