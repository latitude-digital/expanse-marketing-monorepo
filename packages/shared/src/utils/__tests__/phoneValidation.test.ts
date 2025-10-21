/**
 * Unit tests for Phone Validation Utilities
 *
 * Tests cover US-only phone number validation with international number rejection
 */

import { normalizePhoneNumber, validatePhoneNumber, batchNormalizePhoneNumbers } from '../phoneValidation';

describe('normalizePhoneNumber', () => {
  describe('Valid US phone numbers', () => {
    test('should normalize 10-digit number', () => {
      expect(normalizePhoneNumber('5551234567')).toBe('+15551234567');
    });

    test('should normalize 11-digit number starting with 1', () => {
      expect(normalizePhoneNumber('15551234567')).toBe('+15551234567');
    });

    test('should normalize formatted number with parentheses and hyphens', () => {
      expect(normalizePhoneNumber('(555) 123-4567')).toBe('+15551234567');
    });

    test('should normalize number with +1 prefix', () => {
      expect(normalizePhoneNumber('+1 555-123-4567')).toBe('+15551234567');
    });

    test('should normalize number with spaces', () => {
      expect(normalizePhoneNumber('555 123 4567')).toBe('+15551234567');
    });

    test('should normalize number with dots', () => {
      expect(normalizePhoneNumber('555.123.4567')).toBe('+15551234567');
    });

    test('should normalize number with mixed formatting', () => {
      expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
    });
  });

  describe('Invalid phone numbers', () => {
    test('should return null for too short number', () => {
      expect(normalizePhoneNumber('123')).toBeNull();
    });

    test('should return null for empty string', () => {
      expect(normalizePhoneNumber('')).toBeNull();
    });

    test('should return null for null input', () => {
      expect(normalizePhoneNumber(null as any)).toBeNull();
    });

    test('should return null for undefined input', () => {
      expect(normalizePhoneNumber(undefined as any)).toBeNull();
    });

    test('should return null for non-string input', () => {
      expect(normalizePhoneNumber(123456789 as any)).toBeNull();
    });

    test('should return null for 11 digits not starting with 1', () => {
      expect(normalizePhoneNumber('25551234567')).toBeNull();
    });

    test('should return null for 9 digits', () => {
      expect(normalizePhoneNumber('555123456')).toBeNull();
    });
  });

  describe('International numbers (should be rejected)', () => {
    test('should reject UK number (+44)', () => {
      expect(normalizePhoneNumber('+44 20 7946 0958')).toBeNull();
    });

    test('should reject France number (+33)', () => {
      expect(normalizePhoneNumber('+33 1 42 86 82 00')).toBeNull();
    });

    test('should reject Mexico number (+52)', () => {
      expect(normalizePhoneNumber('+52 55 1234 5678')).toBeNull();
    });

    test('should reject Canada number that looks like it might be international', () => {
      // Note: Canada actually uses +1, so valid Canadian numbers will pass
      // This tests that we properly handle the +1 prefix
      expect(normalizePhoneNumber('+1 416 123 4567')).toBe('+14161234567');
    });

    test('should reject number with wrong international format', () => {
      expect(normalizePhoneNumber('+86 10 1234 5678')).toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('should handle number with lots of extra formatting', () => {
      expect(normalizePhoneNumber('(+1) 555-123-4567')).toBe('+15551234567');
    });

    test('should handle number with extension (truncate to 11 digits)', () => {
      const result = normalizePhoneNumber('1555123456789');
      // Should truncate to first 11 digits
      expect(result).toBe('+15551234567');
    });

    test('should handle whitespace-only input', () => {
      expect(normalizePhoneNumber('   ')).toBeNull();
    });

    test('should handle number with letters (common typo)', () => {
      expect(normalizePhoneNumber('555-CALL-NOW')).toBeNull();
    });
  });
});

describe('validatePhoneNumber', () => {
  test('should return true for valid 10-digit number', () => {
    expect(validatePhoneNumber('5551234567')).toBe(true);
  });

  test('should return true for valid 11-digit number', () => {
    expect(validatePhoneNumber('15551234567')).toBe(true);
  });

  test('should return true for valid formatted number', () => {
    expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
  });

  test('should return false for invalid short number', () => {
    expect(validatePhoneNumber('123')).toBe(false);
  });

  test('should return false for empty string', () => {
    expect(validatePhoneNumber('')).toBe(false);
  });

  test('should return false for international number', () => {
    expect(validatePhoneNumber('+44 20 7946 0958')).toBe(false);
  });

  test('should return false for null', () => {
    expect(validatePhoneNumber(null as any)).toBe(false);
  });
});

describe('batchNormalizePhoneNumbers', () => {
  test('should normalize multiple valid numbers', () => {
    const input = ['5551234567', '(555) 987-6543', '+1 555-111-2222'];
    const result = batchNormalizePhoneNumbers(input);

    expect(result.validNumbers.size).toBe(3);
    expect(result.validNumbers.has('+15551234567')).toBe(true);
    expect(result.validNumbers.has('+15559876543')).toBe(true);
    expect(result.validNumbers.has('+15551112222')).toBe(true);
    expect(result.invalidNumbers.length).toBe(0);
  });

  test('should deduplicate identical numbers', () => {
    const input = ['5551234567', '(555) 123-4567', '+1 555-123-4567'];
    const result = batchNormalizePhoneNumbers(input);

    expect(result.validNumbers.size).toBe(1);
    expect(result.validNumbers.has('+15551234567')).toBe(true);
    expect(result.invalidNumbers.length).toBe(0);
  });

  test('should separate invalid numbers', () => {
    const input = ['5551234567', '123', '', '+44 20 7946 0958'];
    const result = batchNormalizePhoneNumbers(input);

    expect(result.validNumbers.size).toBe(1);
    expect(result.validNumbers.has('+15551234567')).toBe(true);
    expect(result.invalidNumbers.length).toBe(3);
    expect(result.invalidNumbers).toContain('123');
    expect(result.invalidNumbers).toContain('');
    expect(result.invalidNumbers).toContain('+44 20 7946 0958');
  });

  test('should handle mixed valid and invalid numbers', () => {
    const input = [
      '5551234567',      // valid
      '(555) 987-6543',  // valid
      '123',             // invalid (too short)
      '+44 20 7946 0958', // invalid (international)
      '+1 555-111-2222', // valid
      '',                // invalid (empty)
    ];
    const result = batchNormalizePhoneNumbers(input);

    expect(result.validNumbers.size).toBe(3);
    expect(result.invalidNumbers.length).toBe(3);
  });

  test('should handle empty input array', () => {
    const result = batchNormalizePhoneNumbers([]);

    expect(result.validNumbers.size).toBe(0);
    expect(result.invalidNumbers.length).toBe(0);
  });

  test('should handle all invalid numbers', () => {
    const input = ['123', '', '+44 20 7946 0958'];
    const result = batchNormalizePhoneNumbers(input);

    expect(result.validNumbers.size).toBe(0);
    expect(result.invalidNumbers.length).toBe(3);
  });
});
