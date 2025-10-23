/**
 * Twilio Status Webhook Function
 *
 * This function receives delivery status updates from Twilio and updates
 * the corresponding recipient documents in Firestore.
 *
 * Security: Validates Twilio signature to prevent unauthorized requests
 * Performance: Uses collectionGroup query with index for fast lookups
 * Reliability: Always returns 200 to prevent Twilio retries
 */

import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { validateRequest } from './twilioClient';
import { getTwilioStatusCallbackUrl } from '../utils/getTwilioStatusCallbackUrl';
import type { TwilioMessageStatus } from '@meridian-event-tech/shared';

/**
 * Twilio Status Webhook Implementation
 *
 * @param app - Firebase Admin app instance
 * @param database - Firestore database name ("staging" or "(default)")
 * @returns Cloud Function handler for Twilio status webhooks
 */
export const twilioStatusWebhookImpl = (
  app: any,
  database: string = "(default)"
) => {
  return onRequest(
    {
      // CORS disabled - only accept requests from Twilio
      cors: false,
      timeoutSeconds: 60,
      memory: '256MiB',
      secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_API_KEY_SID', 'TWILIO_API_KEY_SECRET', 'TWILIO_PHONE_NUMBER'],
    },
    async (request, response) => {
      try {
        console.log('[Twilio Webhook] Received status update', {
          method: request.method,
          url: request.url,
          originalUrl: request.originalUrl,
          path: request.path,
          headers: request.headers,
          body: request.body,
        });

        // Step 1: Validate Twilio Signature (CRITICAL for security)
        const twilioSignature = request.headers['x-twilio-signature'] as string;

        if (!twilioSignature) {
          console.error('[Twilio Webhook] Missing X-Twilio-Signature header');
          response.status(403).send('Forbidden: Missing signature');
          return;
        }

        // Get auth token from environment (it's a secret, so must be accessed at runtime)
        const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
        if (!authToken) {
          console.error('[Twilio Webhook] TWILIO_AUTH_TOKEN not available');
          response.status(500).send('Configuration error');
          return;
        }

        // Construct full webhook URL for signature validation
        const webhookUrl = getTwilioStatusCallbackUrl(database);

        // Comprehensive debug logging for signature validation
        console.log('[Twilio Webhook] ===== SIGNATURE VALIDATION DEBUG =====');
        console.log('[Twilio Webhook] Received signature:', twilioSignature);
        console.log('[Twilio Webhook] Webhook URL for validation:', webhookUrl);
        console.log('[Twilio Webhook] Auth token (first 4 chars):', authToken.substring(0, 4));
        console.log('[Twilio Webhook] Auth token (last 4 chars):', authToken.substring(authToken.length - 4));
        console.log('[Twilio Webhook] Auth token length:', authToken.length);
        console.log('[Twilio Webhook] Request Content-Type:', request.headers['content-type']);
        console.log('[Twilio Webhook] Body keys (sorted):', Object.keys(request.body).sort());
        console.log('[Twilio Webhook] Body values:');
        for (const [key, value] of Object.entries(request.body)) {
          console.log(`  ${key}: "${value}" (type: ${typeof value}, length: ${String(value).length})`);
        }

        // Manually construct what Twilio would use for signature
        // Twilio constructs: URL + sorted params as "key=value&key=value"
        const sortedKeys = Object.keys(request.body).sort();
        const paramsString = sortedKeys.map(key => `${key}=${request.body[key]}`).join('&');
        console.log('[Twilio Webhook] Params string for signature:', paramsString);
        console.log('[Twilio Webhook] Full string to sign:', webhookUrl + paramsString);

        // Validate the request is from Twilio
        const isValid = validateRequest(
          authToken,
          twilioSignature,
          webhookUrl,
          request.body
        );

        console.log('[Twilio Webhook] Validation result:', isValid);
        console.log('[Twilio Webhook] ===== END SIGNATURE VALIDATION DEBUG =====');

        if (!isValid) {
          console.error('[Twilio Webhook] SIGNATURE VALIDATION FAILED!');
          response.status(403).send('Forbidden: Invalid signature');
          return;
        }

        console.log('[Twilio Webhook] Signature validated successfully');

        // Step 2: Parse Webhook Data
        const {
          MessageSid,
          MessageStatus,
          To,
          ErrorCode,
          ErrorMessage,
        } = request.body;

        console.log('[Twilio Webhook] Processing status update', {
          MessageSid,
          MessageStatus,
          To,
          ErrorCode,
          ErrorMessage,
        });

        if (!MessageSid || !MessageStatus) {
          console.error('[Twilio Webhook] Missing required fields', {
            MessageSid,
            MessageStatus,
          });
          // Still return 200 to prevent Twilio retries
          response.status(200).send('OK: Missing required fields');
          return;
        }

        // Step 3: Find Recipient Document
        const db = getFirestore(app, database);

        // Use collectionGroup query to find recipient across all bulkSmsSends
        const recipientsQuery = db
          .collectionGroup('recipients')
          .where('twilioSid', '==', MessageSid)
          .limit(1);

        const recipientsSnapshot = await recipientsQuery.get();

        if (recipientsSnapshot.empty) {
          console.warn('[Twilio Webhook] Recipient not found for MessageSid:', MessageSid);
          // Still return 200 to prevent Twilio retries
          response.status(200).send('OK: Recipient not found');
          return;
        }

        const recipientDoc = recipientsSnapshot.docs[0];
        const recipientRef = recipientDoc.ref;

        // Get parent document reference (bulkSmsSends/{sendId})
        const sendRef = recipientRef.parent.parent;
        if (!sendRef) {
          console.error('[Twilio Webhook] Could not get parent send document');
          response.status(200).send('OK: Invalid document structure');
          return;
        }

        console.log('[Twilio Webhook] Found recipient document', {
          sendId: sendRef.id,
          phoneNumber: recipientDoc.data()?.phoneNumber,
        });

        // Step 4: Update Recipient Document
        const recipientUpdate: any = {
          deliveryStatus: MessageStatus as TwilioMessageStatus,
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Set deliveredAt timestamp for delivered messages
        if (MessageStatus === 'delivered') {
          recipientUpdate.deliveredAt = FieldValue.serverTimestamp();
        }

        // Update error information for failed messages
        if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
          recipientUpdate.errorCode = ErrorCode ? parseInt(ErrorCode, 10) : null;
          recipientUpdate.errorMessage = ErrorMessage || null;
        }

        await recipientRef.update(recipientUpdate);
        console.log('[Twilio Webhook] Updated recipient document');

        // Step 5: Update Parent Document Counts (ATOMIC)
        // Use FieldValue.increment() to prevent race conditions
        const parentUpdate: any = {
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (MessageStatus === 'delivered') {
          parentUpdate.deliveredCount = FieldValue.increment(1);
          console.log('[Twilio Webhook] Incrementing deliveredCount');
        } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
          parentUpdate.undeliveredCount = FieldValue.increment(1);
          console.log('[Twilio Webhook] Incrementing undeliveredCount');
        }

        await sendRef.update(parentUpdate);
        console.log('[Twilio Webhook] Updated parent document counts');

        // Step 6: Return Success
        response.status(200).send('OK');
        console.log('[Twilio Webhook] Processing complete');

      } catch (error) {
        // Log error but ALWAYS return 200 to prevent Twilio retries
        console.error('[Twilio Webhook] Error processing webhook:', error);
        console.error('[Twilio Webhook] Error stack:', (error as Error).stack);

        // Return 200 even on error to prevent Twilio from retrying
        // The error is logged for debugging but won't cause repeated webhook calls
        response.status(200).send('OK: Error logged');
      }
    }
  );
};
