/**
 * Bulk SMS Implementation Types
 *
 * These types support the Bulk SMS feature for sending mass text messages
 * via Twilio with delivery tracking and webhook integration.
 *
 * For Twilio SDK type reference, see:
 * import type { MessageInstance, MessageListInstanceCreateOptions }
 * from 'twilio/lib/rest/api/v2010/account/message';
 *
 * Note: Timestamps are represented as Date | string to work across
 * both frontend and backend. Firestore handles conversion automatically.
 */

/**
 * Complete Twilio MessageStatus values from official Twilio API
 *
 * Status flow for outbound messages:
 * accepted → queued → sending → sent → delivered (success)
 *                                  ↘ failed/undelivered (failure)
 *
 * Reference: https://www.twilio.com/docs/messaging/api/message-resource
 */
export type TwilioMessageStatus =
  | 'accepted'      // API request accepted
  | 'scheduled'     // Message scheduled for future delivery
  | 'canceled'      // Scheduled message was canceled
  | 'queued'        // Message in Twilio's queue
  | 'sending'       // Being sent to carrier
  | 'sent'          // Sent to carrier (not yet delivered)
  | 'failed'        // Failed to send
  | 'delivered'     // ✅ Carrier confirmed delivery
  | 'undelivered'   // ❌ Carrier failed to deliver
  | 'receiving'     // Incoming message being received
  | 'received'      // Incoming message received
  | 'read';         // WhatsApp only - message read

/**
 * Parent document representing a bulk SMS send operation
 *
 * Stored in Firestore: bulkSmsSends/{sendId}
 * Contains aggregated stats and metadata for the entire send
 */
export interface BulkSmsSend {
  /** Document ID */
  id: string;

  /** When the send was created */
  createdAt: Date | string;

  /** Last update timestamp (for stalled send detection) */
  updatedAt: Date | string;

  /** User ID who created the send */
  createdBy: string;

  /** Email of user who created the send (for history display) */
  createdByEmail: string;

  /** SMS message content */
  message: string;

  /** Total number of recipients */
  totalRecipients: number;

  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /** Processing lock timestamp (prevents concurrent processing) */
  processingLock: Date | string | null;

  /** Count of messages accepted by Twilio */
  successCount: number;

  /** Count of messages rejected by Twilio */
  failureCount: number;

  /** Count of messages not yet processed */
  pendingCount: number;

  /** Count of messages confirmed delivered by carrier */
  deliveredCount: number;

  /** Count of messages that failed delivery */
  undeliveredCount: number;

  /** List of invalid phone numbers that were rejected */
  invalidPhones: string[];
}

/**
 * Individual SMS recipient record
 *
 * Stored in Firestore: bulkSmsSends/{sendId}/recipients/{phoneNumber}
 * Tracks per-recipient status and delivery information
 */
export interface SmsRecipient {
  /** Normalized phone number (+1XXXXXXXXXX format) */
  phoneNumber: string;

  /** Our processing status */
  status: 'pending' | 'sent' | 'failed';

  /** Delivery status from Twilio webhook (optional, null initially) */
  deliveryStatus?: TwilioMessageStatus | null;

  /** Twilio message SID for webhook correlation (optional, null initially) */
  twilioSid?: string | null;

  /** Error message if send/delivery failed (nullable per Twilio SDK) */
  errorMessage?: string | null;

  /** Twilio error code if send/delivery failed (nullable per Twilio SDK) */
  errorCode?: number | null;

  /** Timestamp when message was sent to Twilio (optional, null initially) */
  sentAt?: Date | string | null;

  /** Timestamp when Twilio confirmed delivery (optional, null initially) */
  deliveredAt?: Date | string | null;

  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Request payload for creating a new bulk SMS send
 *
 * Used by the createBulkSmsSend Firebase function
 */
export interface CreateBulkSmsSendRequest {
  /** Array of phone numbers (various formats accepted) */
  phoneNumbers: string[];

  /** SMS message content (max 1600 characters) */
  message: string;
}

/**
 * Response from creating a bulk SMS send
 *
 * Returned by the createBulkSmsSend Firebase function
 */
export interface CreateBulkSmsSendResponse {
  /** Whether the operation succeeded */
  success: boolean;

  /** Send ID if successful (for tracking/navigation) */
  sendId?: string;

  /** Error message if failed */
  error?: string;
}
