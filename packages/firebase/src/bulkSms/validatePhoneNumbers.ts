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

      /**
       * Check if a phone number is obviously invalid (before hitting Twilio API)
       *
       * US Phone Number Rules:
       * - Format: +1-NPA-NXX-XXXX (11 digits with country code, or 10 digits)
       * - NPA (Area Code): First digit cannot be 0 or 1
       * - NXX (Exchange): First digit cannot be 0 or 1
       * - 555-01XX reserved for fictional use (movies/TV)
       * - 1-800, 1-888, 1-877, 1-866, 1-855, 1-844, 1-833 are toll-free (cannot receive SMS)
       * - N11 codes (211, 311, 411, 511, 611, 711, 811, 911) are special services
       */
      const isObviouslyInvalid = (phone: string): string | null => {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');

        // Check length (E.164 format: 10-15 digits)
        if (digits.length < 10) {
          return 'Phone number too short (minimum 10 digits)';
        }
        if (digits.length > 15) {
          return 'Phone number too long (maximum 15 digits)';
        }

        // Check if all digits are the same (e.g., 5555555555, 1111111111)
        const uniqueDigits = new Set(digits).size;
        if (uniqueDigits === 1) {
          return 'Invalid phone number (all same digit)';
        }

        // Check for sequential patterns
        if (digits === '1234567890' || digits === '0123456789' || digits === '9876543210') {
          return 'Invalid phone number (sequential pattern)';
        }

        // For US numbers (10 or 11 digits), apply US-specific rules
        let npa: string;  // Area code (NPA)
        let nxx: string;  // Exchange (NXX)

        if (digits.length === 10) {
          npa = digits.substring(0, 3);
          nxx = digits.substring(3, 6);
        } else if (digits.length === 11 && digits[0] === '1') {
          npa = digits.substring(1, 4);
          nxx = digits.substring(4, 7);
        } else {
          // Non-US number or invalid format, let Twilio validate
          return null;
        }

        // US Area Code (NPA) Rules
        // First digit cannot be 0 or 1
        if (npa[0] === '0' || npa[0] === '1') {
          return 'Invalid area code (cannot start with 0 or 1)';
        }

        // Second digit was restricted to 0 or 1 until 1995, now allows 2-9
        // Third digit can be any digit 0-9

        // Check for N11 service codes (211, 311, 411, 511, 611, 711, 811, 911)
        if (npa[1] === '1' && npa[2] === '1') {
          return 'Invalid phone number (N11 service code)';
        }

        // US Exchange (NXX) Rules
        // First digit cannot be 0 or 1
        if (nxx[0] === '0' || nxx[0] === '1') {
          return 'Invalid exchange code (cannot start with 0 or 1)';
        }

        // Check for 555-01XX fictional numbers
        if (nxx === '555') {
          const lastFour = digits.length === 10 ? digits.substring(6) : digits.substring(7);
          if (lastFour.startsWith('01')) {
            return 'Invalid phone number (555-01XX reserved for fictional use)';
          }
        }

        // Check for toll-free numbers (cannot receive SMS)
        const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833'];
        if (tollFreeAreaCodes.includes(npa)) {
          return 'Cannot send SMS to toll-free numbers';
        }

        // Check for reserved/special area codes
        const reservedAreaCodes = [
          '900',  // Premium rate
          '976',  // Premium rate (legacy)
          '456',  // Reserved
          '710',  // US Government
        ];
        if (reservedAreaCodes.includes(npa)) {
          return `Invalid area code (${npa} is reserved/special use)`;
        }

        return null; // Passes basic validation
      };

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

        // Check for obviously invalid patterns (before Twilio API call)
        const obviouslyInvalidReason = isObviouslyInvalid(normalized);
        if (obviouslyInvalidReason) {
          results.push({
            original,
            normalized,
            isValid: false,
            errorMessage: obviouslyInvalidReason,
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
