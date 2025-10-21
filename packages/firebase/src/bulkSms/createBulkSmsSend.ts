import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  normalizePhoneNumber,
  type CreateBulkSmsSendRequest,
  type CreateBulkSmsSendResponse,
  type BulkSmsSend,
  type SmsRecipient,
} from "@meridian-event-tech/shared";

/**
 * Create Bulk SMS Send Function
 *
 * Creates a new bulk SMS send operation with the following steps:
 * 1. Authenticate user
 * 2. Validate inputs (phone numbers, message)
 * 3. Normalize and deduplicate phone numbers
 * 4. Create parent document with send metadata
 * 5. Batch write recipient documents
 * 6. Trigger processing by updating status
 * 7. Return send ID for tracking
 *
 * @param app - Firebase admin app instance
 * @param database - Firestore database name ("staging" or "(default)")
 */
export const createBulkSmsSendImpl = (app: admin.app.App, database: string = "(default)") => {
  return onCall({ cors: true }, async (request) => {
    try {
      // ============================================================
      // STEP 1: AUTHENTICATION
      // ============================================================
      if (!request.auth) {
        logger.warn('[createBulkSmsSend] Unauthenticated request rejected');
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;
      const userEmail = request.auth.token.email || 'unknown@example.com';
      logger.info(`[createBulkSmsSend] Request from user: ${userId} (${userEmail})`);

      // ============================================================
      // RATE LIMITING CHECK
      // ============================================================
      const db = getFirestore(app, database);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      logger.info(`[createBulkSmsSend] Checking rate limit for user: ${userId}`);

      const recentSendsQuery = db.collection('bulkSmsSends')
        .where('createdBy', '==', userId)
        .where('createdAt', '>=', fiveMinutesAgo);

      const recentSendsSnapshot = await recentSendsQuery.count().get();
      const recentSendCount = recentSendsSnapshot.data().count;

      logger.info(`[createBulkSmsSend] Recent sends in last 5 minutes: ${recentSendCount}`);

      if (recentSendCount >= 5) {
        logger.warn(`[createBulkSmsSend] Rate limit exceeded for user ${userId}: ${recentSendCount} sends in last 5 minutes`);
        throw new HttpsError(
          'resource-exhausted',
          'Rate limit exceeded. Maximum 5 sends per 5 minutes. Please wait before sending again.'
        );
      }

      // ============================================================
      // STEP 2: INPUT VALIDATION
      // ============================================================
      const { phoneNumbers, message } = request.data as CreateBulkSmsSendRequest;

      // Validate phoneNumbers is array and not empty
      if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        logger.warn('[createBulkSmsSend] Invalid phoneNumbers: must be non-empty array');
        throw new HttpsError(
          'invalid-argument',
          'phoneNumbers must be a non-empty array'
        );
      }

      // Validate message is not empty
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        logger.warn('[createBulkSmsSend] Invalid message: must be non-empty string');
        throw new HttpsError(
          'invalid-argument',
          'message must be a non-empty string'
        );
      }

      // Validate message length (1600 chars = ~10 SMS segments)
      if (message.length > 1600) {
        logger.warn(`[createBulkSmsSend] Message too long: ${message.length} characters`);
        throw new HttpsError(
          'invalid-argument',
          'message must be 1600 characters or less'
        );
      }

      logger.info(`[createBulkSmsSend] Input validated: ${phoneNumbers.length} numbers, ${message.length} chars`);

      // ============================================================
      // STEP 3: PHONE NUMBER NORMALIZATION
      // ============================================================
      const normalizedPhones = new Set<string>();
      const invalidPhones: string[] = [];

      for (const phone of phoneNumbers) {
        const normalized = normalizePhoneNumber(phone);
        if (normalized) {
          normalizedPhones.add(normalized); // Set automatically deduplicates
        } else {
          invalidPhones.push(phone);
        }
      }

      logger.info(
        `[createBulkSmsSend] Normalized phones: ${normalizedPhones.size} valid, ${invalidPhones.length} invalid`
      );

      // Throw error if no valid numbers
      if (normalizedPhones.size === 0) {
        logger.error('[createBulkSmsSend] No valid phone numbers after normalization');
        throw new HttpsError(
          'invalid-argument',
          `No valid phone numbers found. Invalid numbers: ${invalidPhones.join(', ')}`
        );
      }

      // ============================================================
      // STEP 4: CREATE PARENT DOCUMENT
      // ============================================================
      logger.info(`[createBulkSmsSend] Using Firestore database: ${database}`);

      // Create document reference (auto-generate ID)
      const sendRef = db.collection('bulkSmsSends').doc();
      const sendId = sendRef.id;
      logger.info(`[createBulkSmsSend] Created send document: ${sendId}`);

      // Create sendData object with all fields
      const sendData: Omit<BulkSmsSend, 'id'> = {
        createdAt: FieldValue.serverTimestamp() as any,
        updatedAt: FieldValue.serverTimestamp() as any,
        createdBy: userId,
        createdByEmail: userEmail,
        message: message,
        totalRecipients: normalizedPhones.size,
        status: 'pending',
        processingLock: null,
        successCount: 0,
        failureCount: 0,
        pendingCount: normalizedPhones.size, // Initially all recipients are pending
        deliveredCount: 0,
        undeliveredCount: 0,
        invalidPhones: invalidPhones,
      };

      // Set parent document
      await sendRef.set(sendData);
      logger.info(`[createBulkSmsSend] Parent document created with ${normalizedPhones.size} recipients`);

      // ============================================================
      // STEP 5: BATCH WRITE RECIPIENTS
      // ============================================================
      const BATCH_SIZE = 500; // Firestore limit
      let batch = db.batch();
      let batchCount = 0;
      let totalWritten = 0;

      for (const phoneNumber of normalizedPhones) {
        const recipientRef = sendRef.collection('recipients').doc(phoneNumber);

        const recipientData: SmsRecipient = {
          phoneNumber: phoneNumber,
          status: 'pending',
          retryCount: 0,
          // Optional fields are undefined initially
          deliveryStatus: undefined,
          twilioSid: undefined,
          errorMessage: undefined,
          errorCode: undefined,
          sentAt: undefined,
          deliveredAt: undefined,
        };

        batch.set(recipientRef, recipientData);
        batchCount++;
        totalWritten++;

        // Commit batch every 500 documents
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          logger.info(`[createBulkSmsSend] Committed batch of ${batchCount} recipients (total: ${totalWritten})`);

          // Create new batch
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining documents
      if (batchCount > 0) {
        await batch.commit();
        logger.info(`[createBulkSmsSend] Committed final batch of ${batchCount} recipients (total: ${totalWritten})`);
      }

      logger.info(`[createBulkSmsSend] All ${totalWritten} recipient documents created`);

      // ============================================================
      // STEP 6: TRIGGER PROCESSING
      // ============================================================
      // Update parent status to 'processing' to trigger the processBulkSmsSend function
      await sendRef.update({
        status: 'processing',
        updatedAt: FieldValue.serverTimestamp(),
      });
      logger.info(`[createBulkSmsSend] Status updated to 'processing' - trigger sent`);

      // ============================================================
      // STEP 7: RETURN RESPONSE
      // ============================================================
      const response: CreateBulkSmsSendResponse = {
        success: true,
        sendId: sendId,
      };

      logger.info(`[createBulkSmsSend] Success! Send ID: ${sendId}`);
      return response;

    } catch (error: any) {
      logger.error('[createBulkSmsSend] Error:', error);

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new HttpsError(
        'internal',
        `Failed to create bulk SMS send: ${error.message}`
      );
    }
  });
};
