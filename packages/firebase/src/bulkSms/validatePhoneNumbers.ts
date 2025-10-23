import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { twilioClient } from './twilioClient';
import { normalizePhoneNumber } from '@meridian-event-tech/shared';

/**
 * Phone Number Validation Request/Response Types
 */
export interface ValidatePhoneNumbersRequest {
  phoneNumbers: string[];
}

export interface PhoneValidationResult {
  original: string;
  normalized: string | null;
  isValid: boolean;
  carrier?: string;
  phoneType?: 'mobile' | 'landline' | 'voip';
  errorMessage?: string;
}

export interface ValidatePhoneNumbersResponse {
  success: boolean;
  results: PhoneValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    uniqueValid: number;
  };
  error?: string;
}

/**
 * Validate Phone Numbers Function
 *
 * Uses Twilio Lookup API to validate phone numbers and check if they can receive SMS.
 * Also normalizes and deduplicates phone numbers.
 *
 * @param app - Firebase admin app instance
 */
export const validatePhoneNumbersImpl = (app: admin.app.App) => {
  return onCall({
    cors: true,
    secrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_API_KEY_SID', 'TWILIO_API_KEY_SECRET', 'TWILIO_PHONE_NUMBER'],
  }, async (request): Promise<ValidatePhoneNumbersResponse> => {
    try {
      // ============================================================
      // STEP 1: AUTHENTICATION
      // ============================================================
      if (!request.auth) {
        logger.warn('[validatePhoneNumbers] Unauthenticated request rejected');
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;
      logger.info(`[validatePhoneNumbers] Request from user: ${userId}`);

      // ============================================================
      // STEP 2: INPUT VALIDATION
      // ============================================================
      const { phoneNumbers } = request.data as ValidatePhoneNumbersRequest;

      if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        throw new HttpsError('invalid-argument', 'phoneNumbers must be a non-empty array');
      }

      if (phoneNumbers.length > 1000) {
        throw new HttpsError('invalid-argument', 'Cannot validate more than 1000 phone numbers at once');
      }

      logger.info(`[validatePhoneNumbers] Validating ${phoneNumbers.length} phone numbers`);

      // ============================================================
      // STEP 3: NORMALIZE AND DEDUPLICATE
      // ============================================================
      const results: PhoneValidationResult[] = [];
      const normalizedSet = new Set<string>();
      let duplicateCount = 0;

      for (const original of phoneNumbers) {
        const normalized = normalizePhoneNumber(original);

        // Check if already seen (duplicate)
        if (normalized && normalizedSet.has(normalized)) {
          duplicateCount++;
          results.push({
            original,
            normalized,
            isValid: false,
            errorMessage: 'Duplicate phone number (already in list)',
          });
          continue;
        }

        // If normalization failed, mark as invalid
        if (!normalized) {
          results.push({
            original,
            normalized: null,
            isValid: false,
            errorMessage: 'Invalid phone number format',
          });
          continue;
        }

        // Add to set to track duplicates
        normalizedSet.add(normalized);

        // ============================================================
        // STEP 4: TWILIO LOOKUP API VALIDATION
        // ============================================================
        try {
          // Use Twilio Lookup API v2 to validate and get carrier info
          const lookupResult = await twilioClient.lookups.v2
            .phoneNumbers(normalized)
            .fetch({ fields: 'line_type_intelligence' });

          const lineTypeIntelligence = lookupResult.lineTypeIntelligence;
          const phoneType = lineTypeIntelligence?.type as 'mobile' | 'landline' | 'voip' | undefined;
          const carrier = lineTypeIntelligence?.carrierName;

          // Check if number can receive SMS
          // Mobile and VoIP can receive SMS, landlines cannot
          const canReceiveSms = phoneType === 'mobile' || phoneType === 'voip';

          results.push({
            original,
            normalized,
            isValid: canReceiveSms,
            carrier,
            phoneType,
            errorMessage: canReceiveSms ? undefined : `Cannot send SMS to ${phoneType || 'this'} number`,
          });

          logger.info(`[validatePhoneNumbers] ${normalized}: ${phoneType || 'unknown'}, carrier: ${carrier || 'unknown'}`);

        } catch (error: any) {
          // Twilio lookup failed - number is invalid
          logger.warn(`[validatePhoneNumbers] Lookup failed for ${normalized}: ${error.message}`);

          results.push({
            original,
            normalized,
            isValid: false,
            errorMessage: error.message || 'Phone number validation failed',
          });
        }

        // Add small delay to avoid rate limiting (10 requests/sec max for Lookup API)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // ============================================================
      // STEP 5: CALCULATE SUMMARY
      // ============================================================
      const validCount = results.filter(r => r.isValid).length;
      const invalidCount = results.filter(r => !r.isValid).length;
      const uniqueValidCount = new Set(
        results.filter(r => r.isValid).map(r => r.normalized)
      ).size;

      const summary = {
        total: phoneNumbers.length,
        valid: validCount,
        invalid: invalidCount,
        duplicates: duplicateCount,
        uniqueValid: uniqueValidCount,
      };

      logger.info(`[validatePhoneNumbers] Summary:`, summary);

      return {
        success: true,
        results,
        summary,
      };

    } catch (error: any) {
      logger.error('[validatePhoneNumbers] Error:', error);

      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new HttpsError(
        'internal',
        `Failed to validate phone numbers: ${error.message}`
      );
    }
  });
};
