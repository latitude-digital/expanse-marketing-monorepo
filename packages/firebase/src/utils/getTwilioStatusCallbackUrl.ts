import { logger } from 'firebase-functions/v2';

/**
 * Get the Twilio status callback URL based on the current environment.
 * This is determined at runtime by detecting the Firebase project.
 *
 * @param database - The database parameter (kept for backward compatibility but not used)
 * @returns The appropriate callback URL for the current environment
 */
export function getTwilioStatusCallbackUrl(database: string = "(default)"): string {
  // Check if running in emulator
  if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIREBASE_EMULATOR_HUB) {
    const url = 'https://7e9566995bd0.ngrok-free.app/latitude-leads-staging/us-central1/twilioStatusWebhook';
    logger.info(`Using ngrok Twilio callback URL: ${url}`);
    return url;
  }

  // Determine environment based on Firebase project ID
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;

  if (projectId === 'latitude-leads-staging') {
    const url = 'https://us-central1-latitude-leads-staging.cloudfunctions.net/twilioStatusWebhook';
    logger.info(`Using staging Twilio callback URL: ${url}`);
    return url;
  } else if (projectId === 'latitude-lead-system') {
    // Production
    const url = 'https://us-central1-latitude-lead-system.cloudfunctions.net/twilioStatusWebhook';
    logger.info(`Using production Twilio callback URL: ${url}`);
    return url;
  } else {
    // Fallback (shouldn't happen)
    logger.warn(`Unknown project ID: ${projectId}, defaulting to production URL`);
    const url = 'https://us-central1-latitude-lead-system.cloudfunctions.net/twilioStatusWebhook';
    return url;
  }
}
