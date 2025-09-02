import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
  getBroncoRankImpl,
  checkSurveyLimitImpl,
  validateSurveyLimitImpl,
  getLionsFollowupsImpl
} from "./functions";
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
export { uploadSurveyToAPI, type UploadResult } from "@expanse/shared";

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

// Create function implementations
const getBroncoRank = getBroncoRankImpl(app);
const setCloudFrontCookies = realCloudFrontImpl;
const checkSurveyLimit = checkSurveyLimitImpl(app);
const validateSurveyLimit = validateSurveyLimitImpl(app);
const getLionsFollowups = getLionsFollowupsImpl(app);
const getSurvey = getSurveyImpl(app);
const saveSurvey = saveSurveyImpl(app);
const validateEmail = sparkpostValidateEmailImpl(app);
const checkInOutSurvey = checkInOutSurveyImpl(app);
const createNewUser = sparkpostCreateNewUserImpl(app);
const fetchSparkPostTemplates = fetchSparkPostTemplatesImpl(app);
const generateCreatorUploadUrl = generateCreatorUploadUrlImpl;
const generateRespondentUploadUrl = generateRespondentUploadUrlImpl;
const getFordLincolnEvents = getFordLincolnEventsImpl(app);
const getEventSurveys = getEventSurveysImpl(app);
const reuploadEventSurveys = reuploadEventSurveysImpl(app);

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
  getBroncoRank,
  setCloudFrontCookies,
  checkSurveyLimit,
  validateSurveyLimit,
  getLionsFollowups,
  getSurvey,
  saveSurvey,
  validateEmail,
  checkInOutSurvey,
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
  getFordLincolnEvents,
  getEventSurveys,
  reuploadEventSurveys,
  listUsers,
  setAdminClaim,
  deleteUser,
  updateUserTags
};

// Production environment
export const prod = {
  getBroncoRank,
  setCloudFrontCookies,
  checkSurveyLimit,
  validateSurveyLimit,
  getLionsFollowups,
  getSurvey,
  saveSurvey,
  validateEmail,
  checkInOutSurvey,
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
  getFordLincolnEvents,
  getEventSurveys,
  reuploadEventSurveys,
  listUsers,
  setAdminClaim,
  deleteUser,
  updateUserTags
};