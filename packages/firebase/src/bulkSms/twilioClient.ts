/**
 * Twilio SDK Integration
 *
 * SDK Version: v5.10.3+
 * Documentation: https://www.twilio.com/docs/libraries/reference/twilio-node/
 * GitHub: https://github.com/twilio/twilio-node
 * OpenAPI Spec: https://github.com/twilio/twilio-oai
 *   - Messages API: spec/json/twilio_api_v2010.json
 *
 * Important: SDK has built-in TypeScript types. Do NOT use @types/twilio.
 */

// Import Twilio SDK (v5 uses default export)
import Twilio from 'twilio';
import type { MessageInstance, MessageListInstanceCreateOptions }
  from 'twilio/lib/rest/api/v2010/account/message';

// Initialize Twilio client
export const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Export types for use in functions
export type { MessageInstance, MessageListInstanceCreateOptions };

// Webhook validation helper
export { validateRequest } from 'twilio';
