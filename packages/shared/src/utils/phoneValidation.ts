/**
 * Phone Number Validation Utilities for Bulk SMS
 *
 * US-ONLY validation - international numbers are explicitly rejected
 * This ensures compliance with US-based SMS regulations and prevents
 * accidental international SMS charges.
 */

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX)
 *
 * US ONLY - International numbers are rejected
 *
 * Accepted formats:
 * - 10 digits: "5551234567" → "+15551234567"
 * - 11 digits starting with 1: "15551234567" → "+15551234567"
 * - Formatted: "(555) 123-4567" → "+15551234567"
 * - With country code: "+1 555-123-4567" → "+15551234567"
 *
 * Rejected formats:
 * - International numbers (country code other than +1)
 * - Invalid digit counts
 * - Empty strings
 *
 * @param phone - Phone number in any common US format
 * @returns Normalized phone number in E.164 format (+1XXXXXXXXXX) or null if invalid/international
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Strip all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Check for empty result
  if (!digitsOnly) {
    return null;
  }

  // CRITICAL: Detect international numbers
  // If the original string started with + and the country code isn't 1, reject it
  const startsWithPlus = phone.trim().startsWith('+');
  if (startsWithPlus) {
    // If it starts with + but digits don't start with 1, it's international
    if (!digitsOnly.startsWith('1')) {
      console.warn(`[Phone Validation] International number rejected: ${phone} (country code: +${digitsOnly.substring(0, 2)})`);
      return null;
    }
    // If it starts with +1 but has wrong length (not 11 digits), invalid
    if (digitsOnly.length !== 11) {
      console.warn(`[Phone Validation] Invalid US number length: ${phone} (${digitsOnly.length} digits)`);
      return null;
    }
  }

  // Handle different digit counts
  if (digitsOnly.length === 10) {
    // Standard US format: add +1
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11) {
    // Should start with 1 for US
    if (digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    } else {
      // 11 digits but doesn't start with 1 = likely international
      console.warn(`[Phone Validation] International number rejected: ${phone} (11 digits, doesn't start with 1)`);
      return null;
    }
  } else if (digitsOnly.length > 11 && digitsOnly.startsWith('1')) {
    // Sometimes people add extra digits - if it starts with 1, take first 11
    console.warn(`[Phone Validation] Truncating excess digits: ${phone} → +${digitsOnly.substring(0, 11)}`);
    return `+${digitsOnly.substring(0, 11)}`;
  } else {
    // Invalid length
    console.warn(`[Phone Validation] Invalid number format: ${phone} (${digitsOnly.length} digits)`);
    return null;
  }
}

/**
 * Validate a phone number
 *
 * US ONLY - International numbers will return false
 *
 * @param phone - Phone number to validate
 * @returns true if valid US number, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized !== null;
}

/**
 * Batch normalize phone numbers and track invalid/international entries
 *
 * @param phoneNumbers - Array of phone numbers to normalize
 * @returns Object with valid normalized numbers (Set for deduplication) and array of invalid numbers
 */
export function batchNormalizePhoneNumbers(phoneNumbers: string[]): {
  validNumbers: Set<string>;
  invalidNumbers: string[];
} {
  const validNumbers = new Set<string>();
  const invalidNumbers: string[] = [];

  for (const phone of phoneNumbers) {
    const normalized = normalizePhoneNumber(phone);
    if (normalized) {
      validNumbers.add(normalized);
    } else {
      invalidNumbers.push(phone);
    }
  }

  return { validNumbers, invalidNumbers };
}
