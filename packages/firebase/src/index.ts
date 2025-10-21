import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import {
  getBroncoRankImpl,
  checkSurveyLimitImpl,
  validateSurveyLimitImpl,
  getLionsFollowupsImpl
} from "./functions";
import { getLincolnCharityEventsImpl } from "./functions/getLincolnCharityEvents";
import { getRandomSweepstakesWinnersImpl } from "./functions/getRandomSweepstakesWinners";
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
import {
  createBulkSmsSendImpl,
  processBulkSmsSendImpl,
  twilioStatusWebhookImpl
} from "./bulkSms";

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

// Export functions directly without namespaces
// Since we have separate projects for staging and prod, we don't need database parameters
export const getBroncoRank = getBroncoRankImpl(app, "(default)");
export const setCloudFrontCookies = realCloudFrontImpl;
export const checkSurveyLimit = checkSurveyLimitImpl(app, "(default)");
export const validateSurveyLimit = validateSurveyLimitImpl(app, "(default)");
export const getLionsFollowups = getLionsFollowupsImpl(app, "(default)");
export const getLincolnCharityEvents = getLincolnCharityEventsImpl(app, "(default)");
export const getRandomSweepstakesWinners = getRandomSweepstakesWinnersImpl(app, "(default)");
export const getSurvey = getSurveyImpl(app, "(default)");
export const saveSurvey = saveSurveyImpl(app, "(default)");
export const validateEmail = sparkpostValidateEmailImpl(app);
export const checkInOutSurvey = checkInOutSurveyImpl(app, "(default)");
export const createNewUser = sparkpostCreateNewUserImpl(app);
export const fetchSparkPostTemplates = fetchSparkPostTemplatesImpl(app);
export const generateCreatorUploadUrl = generateCreatorUploadUrlImpl;
export const generateRespondentUploadUrl = generateRespondentUploadUrlImpl;
export const surveyTrigger = surveyTriggerImpl("(default)");
export const queuedReporting = queuedReportingImpl();
export const autoCheckOut = autoCheckOutImpl();
export const scheduledEmail = scheduledEmailImpl();
export const getBookeoProducts = getBookeoProductsImpl(app);
export const getBookeoSlotsByProduct = getBookeoSlotsByProductImpl(app);
export const holdBookeoBooking = holdBookeoBookingImpl(app);
export const makeBookeoBooking = makeBookeoBookingImpl(app);
export const getFordLincolnEvents = getFordLincolnEventsImpl(app, "(default)");
export const getEventSurveys = getEventSurveysImpl(app, "(default)");
export const reuploadEventSurveys = reuploadEventSurveysImpl(app, "(default)");
export const listUsers = listUsersImpl(app);
export const setAdminClaim = setAdminClaimImpl(app);
export const deleteUser = deleteUserImpl(app);
export const updateUserTags = updateUserTagsImpl(app);
export const createBulkSmsSend = createBulkSmsSendImpl(app, "(default)");
export const processBulkSmsSend = processBulkSmsSendImpl(app, "(default)");
export const twilioStatusWebhook = twilioStatusWebhookImpl(app, "(default)");
