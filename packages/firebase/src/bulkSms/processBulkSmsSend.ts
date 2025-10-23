/**
 * Process Bulk SMS Send - Firestore Trigger
 *
 * This function is triggered when a bulkSmsSends document status changes to 'processing'.
 * It processes recipients in batches, sends SMS via Twilio, and updates status in real-time.
 *
 * Key features:
 * - Processing lock to prevent concurrent execution (15-minute timeout)
 * - Batch processing with pagination (50 recipients at a time)
 * - Rate limiting (100ms delay between sends = 10 SMS/sec)
 * - Recipient status tracking prevents duplicate sends on retry
 * - Atomic counter updates using FieldValue.increment()
 * - Comprehensive error handling with lock cleanup
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { twilioClient } from './twilioClient';
import type { MessageInstance } from './twilioClient';
import { getTwilioStatusCallbackUrl } from '../utils/getTwilioStatusCallbackUrl';

// Constants
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY = 100; // milliseconds between sends = 10 SMS/sec
const PROCESSING_LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process Bulk SMS Send Implementation
 *
 * @param app - Firebase admin app instance
 * @param database - Firestore database name ("staging" or "(default)")
 * @returns Firestore trigger function
 */
export const processBulkSmsSendImpl = (app: admin.app.App, database: string = "(default)") =>
  onDocumentUpdated(
    {
      document: 'bulkSmsSends/{sendId}',
      database: database,
      timeoutSeconds: 540,
      memory: '512MiB',
      secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_API_KEY_SID', 'TWILIO_API_KEY_SECRET', 'TWILIO_PHONE_NUMBER'],
    },
    async (event) => {
      if (!event?.data) {
        console.error('[processBulkSmsSend] No event data');
        return null;
      }

      const { sendId } = event.params;
      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();

      // Only trigger if status changed to 'processing'
      if (beforeData?.status === 'processing' || afterData?.status !== 'processing') {
        console.log(`[processBulkSmsSend] ${sendId}: Skipping - status not changed to 'processing'`);
        return null;
      }

      console.log(`[processBulkSmsSend] ${sendId}: Starting processing`);

      // Get Firestore instance
      const db = database === "staging"
        ? getFirestore(app, "staging")
        : getFirestore(app);

      const sendRef = db.collection('bulkSmsSends').doc(sendId);

      try {
        // Check and set processing lock using transaction
        const lockAcquired = await db.runTransaction(async (transaction) => {
          const sendDoc = await transaction.get(sendRef);
          const sendData = sendDoc.data();

          if (!sendData) {
            throw new Error('Send document not found');
          }

          // Check if already locked
          if (sendData.processingLock) {
            const lockTime = sendData.processingLock.toDate?.() || new Date(sendData.processingLock);
            const lockAge = Date.now() - lockTime.getTime();

            if (lockAge < PROCESSING_LOCK_TIMEOUT_MS) {
              console.log(`[processBulkSmsSend] ${sendId}: Already processing (locked ${Math.round(lockAge / 1000)}s ago)`);
              return false;
            }

            console.log(`[processBulkSmsSend] ${sendId}: Lock expired (${Math.round(lockAge / 1000)}s old), acquiring new lock`);
          }

          // Acquire lock
          transaction.update(sendRef, {
            processingLock: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          return true;
        });

        if (!lockAcquired) {
          console.log(`[processBulkSmsSend] ${sendId}: Could not acquire lock, exiting`);
          return null;
        }

        // Get send document data
        const sendDoc = await sendRef.get();
        const sendData = sendDoc.data();

        if (!sendData) {
          throw new Error('Send document not found after acquiring lock');
        }

        const message = sendData.message;
        const statusCallbackUrl = getTwilioStatusCallbackUrl(database);

        if (!TWILIO_PHONE_NUMBER) {
          throw new Error('TWILIO_PHONE_NUMBER not configured');
        }

        console.log(`[processBulkSmsSend] ${sendId}: Processing message: "${message.substring(0, 50)}..."`);
        console.log(`[processBulkSmsSend] ${sendId}: Status callback URL: ${statusCallbackUrl}`);

        // Processing loop with pagination
        let hasMore = true;
        let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        let processedCount = 0;

        while (hasMore) {
          // Query pending recipients
          let query = sendRef
            .collection('recipients')
            .where('status', '==', 'pending')
            .limit(BATCH_SIZE);

          if (lastDoc) {
            query = query.startAfter(lastDoc);
          }

          const snapshot = await query.get();

          if (snapshot.empty) {
            console.log(`[processBulkSmsSend] ${sendId}: No more pending recipients`);
            break;
          }

          console.log(`[processBulkSmsSend] ${sendId}: Processing batch of ${snapshot.size} recipients`);

          // Process each recipient in the batch
          for (const recipientDoc of snapshot.docs) {
            const recipient = recipientDoc.data();
            const phoneNumber = recipient.phoneNumber;

            try {
              console.log(`[processBulkSmsSend] ${sendId}: Sending to ${phoneNumber}`);

              // Send SMS via Twilio
              // Note: Twilio doesn't support idempotency keys for SMS messages
              // We rely on the processing lock and recipient status to prevent duplicates
              const result: MessageInstance = await twilioClient.messages.create({
                body: message,
                to: phoneNumber,
                from: TWILIO_PHONE_NUMBER,
                statusCallback: statusCallbackUrl,
              });

              console.log(`[processBulkSmsSend] ${sendId}: Success for ${phoneNumber}, SID: ${result.sid}`);

              // Update recipient document - success
              await recipientDoc.ref.update({
                status: 'sent',
                sentAt: FieldValue.serverTimestamp(),
                twilioSid: result.sid,
                deliveryStatus: result.status,
              });

              // Update parent counters atomically
              await sendRef.update({
                successCount: FieldValue.increment(1),
                pendingCount: FieldValue.increment(-1),
              });

            } catch (error: any) {
              console.error(`[processBulkSmsSend] ${sendId}: Error sending to ${phoneNumber}:`, error.message);

              // Update recipient document - failure
              await recipientDoc.ref.update({
                status: 'failed',
                errorMessage: error.message || 'Unknown error',
                errorCode: error.code || null,
                retryCount: FieldValue.increment(1),
              });

              // Update parent counters atomically
              await sendRef.update({
                failureCount: FieldValue.increment(1),
                pendingCount: FieldValue.increment(-1),
              });
            }

            processedCount++;

            // Apply rate limit delay (10 SMS/sec)
            await sleep(RATE_LIMIT_DELAY);
          }

          // Update last document for pagination
          lastDoc = snapshot.docs[snapshot.docs.length - 1];

          // Update parent updatedAt timestamp after each batch
          await sendRef.update({
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Check if there are more pending recipients
          const remainingQuery = sendRef
            .collection('recipients')
            .where('status', '==', 'pending')
            .limit(1);

          const remainingSnapshot = await remainingQuery.get();
          hasMore = !remainingSnapshot.empty;
        }

        console.log(`[processBulkSmsSend] ${sendId}: Processing complete. Processed ${processedCount} recipients`);

        // Update parent status to 'completed' and clear processing lock
        await sendRef.update({
          status: 'completed',
          processingLock: null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`[processBulkSmsSend] ${sendId}: Successfully completed`);
        return null;

      } catch (error: any) {
        console.error(`[processBulkSmsSend] ${sendId}: Fatal error:`, error);
        console.error(`[processBulkSmsSend] ${sendId}: Stack trace:`, error.stack);

        // Update parent status to 'failed' and clear processing lock
        try {
          await sendRef.update({
            status: 'failed',
            processingLock: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (updateError) {
          console.error(`[processBulkSmsSend] ${sendId}: Error updating failed status:`, updateError);
        }

        // Re-throw to let Cloud Functions log the error
        throw error;
      }
    }
  );
