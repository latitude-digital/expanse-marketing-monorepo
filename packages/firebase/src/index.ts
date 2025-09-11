import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
  getBroncoRankImpl,
  checkSurveyLimitImpl,
  validateSurveyLimitImpl,
  getLionsFollowupsImpl
} from "./functions";
import { getLincolnCharityEventsImpl } from "./functions/getLincolnCharityEvents";
import {
  getSurveyImpl,
  saveSurveyImpl,
  checkInOutSurveyImpl
} from "./survey-functions";
import {
  validateEmailImpl as sparkpostValidateEmailImpl,
  createNewUserImpl as sparkpostCreateNewUserImpl,
  autoCheckOutImpl,
  scheduledEmailImpl,
  fetchSparkPostTemplatesImpl
} from "./email-functions";
import {
  surveyTriggerImpl,
  queuedReportingImpl,
  // sendFordSurveysImpl
} from "./reporting-functions";
import {
  getBookeoProductsImpl,
  getBookeoSlotsByProductImpl,
  holdBookeoBookingImpl,
  makeBookeoBookingImpl
} from "./bookeo-functions";
import { setCloudFrontCookies as realCloudFrontImpl } from "./setCloudFrontCookies";
import { generateCreatorUploadUrl as generateCreatorUploadUrlImpl } from "./generateCreatorUploadUrl";
import { generateRespondentUploadUrl as generateRespondentUploadUrlImpl } from "./generateRespondentUploadUrl";
import { 
  getFordLincolnEventsImpl,
  getEventSurveysImpl,
  reuploadEventSurveysImpl
} from "./getEventsForReupload";
import {
  listUsersImpl,
  setAdminClaimImpl,
  deleteUserImpl,
  updateUserTagsImpl
} from "./user-management-functions";

// Re-export shared utilities from shared package
export { uploadSurveyToAPI, type UploadResult } from "@meridian-event-tech/shared";

// Initialize Firebase Admin SDK with emulator support
let app: admin.app.App;
if (!admin.apps || admin.apps.length === 0) {
  app = admin.initializeApp();
} else {
  app = admin.app();
}

// Log emulator configuration
if (process.env.FIRESTORE_EMULATOR_HOST) {
  logger.info(`Firestore emulator detected at: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Create function implementations with proper database parameter
// Functions that don't use Firestore
const setCloudFrontCookies = realCloudFrontImpl;
const generateCreatorUploadUrl = generateCreatorUploadUrlImpl;
const generateRespondentUploadUrl = generateRespondentUploadUrlImpl;

// Create separate instances for staging and production for functions that use Firestore
// Functions from functions.ts
const getBroncoRankStaging = getBroncoRankImpl(app, "staging");
const getBroncoRankProd = getBroncoRankImpl(app, "(default)");

const checkSurveyLimitStaging = checkSurveyLimitImpl(app, "staging");
const checkSurveyLimitProd = checkSurveyLimitImpl(app, "(default)");

const validateSurveyLimitStaging = validateSurveyLimitImpl(app, "staging");
const validateSurveyLimitProd = validateSurveyLimitImpl(app, "(default)");

const getLionsFollowupsStaging = getLionsFollowupsImpl(app, "staging");
const getLionsFollowupsProd = getLionsFollowupsImpl(app, "(default)");

const getLincolnCharityEventsStaging = getLincolnCharityEventsImpl(app, "staging");
const getLincolnCharityEventsProd = getLincolnCharityEventsImpl(app, "(default)");

// Functions from survey-functions.ts
const getSurveyStaging = getSurveyImpl(app, "staging");
const getSurveyProd = getSurveyImpl(app, "(default)");

const saveSurveyStaging = saveSurveyImpl(app, "staging");
const saveSurveyProd = saveSurveyImpl(app, "(default)");

const checkInOutSurveyStaging = checkInOutSurveyImpl(app, "staging");
const checkInOutSurveyProd = checkInOutSurveyImpl(app, "(default)");

// Email functions - need to check if they use Firestore
const validateEmail = sparkpostValidateEmailImpl(app);
const createNewUser = sparkpostCreateNewUserImpl(app);
const fetchSparkPostTemplates = fetchSparkPostTemplatesImpl(app);

// Create separate instances for staging and production
const getFordLincolnEventsStaging = getFordLincolnEventsImpl(app, "staging");
const getEventSurveysStaging = getEventSurveysImpl(app, "staging");
const reuploadEventSurveysStaging = reuploadEventSurveysImpl(app, "staging");

const getFordLincolnEventsProd = getFordLincolnEventsImpl(app, "(default)");
const getEventSurveysProd = getEventSurveysImpl(app, "(default)");
const reuploadEventSurveysProd = reuploadEventSurveysImpl(app, "(default)");

// User management functions
const listUsers = listUsersImpl(app);
const setAdminClaim = setAdminClaimImpl(app);
const deleteUser = deleteUserImpl(app);
const updateUserTags = updateUserTagsImpl(app);

// Task-based functions (these don't need app parameter)
// Create different trigger instances for staging and production
const stagingSurveyTrigger = surveyTriggerImpl("staging");
const productionSurveyTrigger = surveyTriggerImpl("(default)");
const queuedReporting = queuedReportingImpl();
// const sendFordSurveys = sendFordSurveysImpl();
const autoCheckOut = autoCheckOutImpl();
const scheduledEmail = scheduledEmailImpl();

// Bookeo functions
const getBookeoProducts = getBookeoProductsImpl(app);
const getBookeoSlotsByProduct = getBookeoSlotsByProductImpl(app);
const holdBookeoBooking = holdBookeoBookingImpl(app);
const makeBookeoBooking = makeBookeoBookingImpl(app);

// Export functions with explicit namespaces
// Staging environment
export const staging = {
  getBroncoRank: getBroncoRankStaging,
  setCloudFrontCookies,
  checkSurveyLimit: checkSurveyLimitStaging,
  validateSurveyLimit: validateSurveyLimitStaging,
  getLionsFollowups: getLionsFollowupsStaging,
  getLincolnCharityEvents: getLincolnCharityEventsStaging,
  getSurvey: getSurveyStaging,
  saveSurvey: saveSurveyStaging,
  validateEmail,
  checkInOutSurvey: checkInOutSurveyStaging,
  createNewUser,
  fetchSparkPostTemplates,
  generateCreatorUploadUrl,
  generateRespondentUploadUrl,
  surveyTrigger: stagingSurveyTrigger,
  queuedReporting,
  // sendFordSurveys,
  autoCheckOut,
  scheduledEmail,
  getBookeoProducts,
  getBookeoSlotsByProduct,
  holdBookeoBooking,
  makeBookeoBooking,
  getFordLincolnEvents: getFordLincolnEventsStaging,
  getEventSurveys: getEventSurveysStaging,
  reuploadEventSurveys: reuploadEventSurveysStaging,
  listUsers,
  setAdminClaim,
  deleteUser,
  updateUserTags
};

// Production environment
export const prod = {
  getBroncoRank: getBroncoRankProd,
  setCloudFrontCookies,
  checkSurveyLimit: checkSurveyLimitProd,
  validateSurveyLimit: validateSurveyLimitProd,
  getLionsFollowups: getLionsFollowupsProd,
  getLincolnCharityEvents: getLincolnCharityEventsProd,
  getSurvey: getSurveyProd,
  saveSurvey: saveSurveyProd,
  validateEmail,
  checkInOutSurvey: checkInOutSurveyProd,
  createNewUser,
  fetchSparkPostTemplates,
  generateCreatorUploadUrl,
  generateRespondentUploadUrl,
  surveyTrigger: productionSurveyTrigger,
  queuedReporting,
  // sendFordSurveys,
  autoCheckOut,
  scheduledEmail,
  getBookeoProducts,
  getBookeoSlotsByProduct,
  holdBookeoBooking,
  makeBookeoBooking,
  getFordLincolnEvents: getFordLincolnEventsProd,
  getEventSurveys: getEventSurveysProd,
  reuploadEventSurveys: reuploadEventSurveysProd,
  listUsers,
  setAdminClaim,
  deleteUser,
  updateUserTags
};
