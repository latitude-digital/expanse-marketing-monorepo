/**
 * Shared validation utilities for the Expanse platform
 */

import { EmailValidationResult, EmailValidationResponse } from '../types/core';

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Basic email format validation
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone number validation - US format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Zip code validation - US format
 */
export function isValidZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

/**
 * File size validation
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 10): FileValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File size must be less than ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Image file type validation
 */
export function isValidImageType(file: File): FileValidationResult {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'File must be an image (JPEG, PNG, GIF, or WebP)'
    };
  }
  
  return { valid: true };
}

/**
 * Combined file validation for images
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): FileValidationResult {
  const typeValidation = isValidImageType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return isFileSizeValid(file, maxSizeMB);
}

/**
 * Date validation - ensure date is not in the future
 */
export function isValidPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj <= new Date();
}

/**
 * Age validation - ensure age is within reasonable range
 */
export function isValidAge(age: number): boolean {
  return age >= 16 && age <= 120;
}

/**
 * Birth year validation
 */
export function isValidBirthYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 120;
  const maxYear = currentYear - 16;
  return year >= minYear && year <= maxYear;
}

/**
 * VIN validation - basic format check
 */
export function isValidVIN(vin: string): boolean {
  // VIN should be 17 characters, alphanumeric, excluding I, O, Q
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(vin.toUpperCase());
}

/**
 * State code validation - US states
 */
export function isValidStateCode(state: string): boolean {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC' // District of Columbia
  ];
  
  return states.includes(state.toUpperCase());
}

/**
 * Country code validation - ISO 3166-1 alpha-3
 */
export function isValidCountryCode(code: string): boolean {
  // Common country codes used by Ford/Lincoln
  const countryCodes = ['USA', 'CAN', 'MEX', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP'];
  return countryCodes.includes(code.toUpperCase());
}

/**
 * Survey-specific validations
 */
export interface SurveyValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate required survey fields
 */
export function validateRequiredSurveyFields(data: Record<string, unknown>): SurveyValidationResult {
  const errors: string[] = [];
  const requiredFields = ['first_name', 'last_name', 'email'];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field.replace('_', ' ')} is required`);
    }
  }
  
  // Validate email format if provided
  if (data.email && typeof data.email === 'string' && !isValidEmailFormat(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate phone if provided
  if (data.phone && typeof data.phone === 'string' && !isValidPhoneNumber(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate address fields
 */
export function validateAddress(address: Record<string, unknown>): SurveyValidationResult {
  const errors: string[] = [];
  
  if (address.zip_code && typeof address.zip_code === 'string' && !isValidZipCode(address.zip_code)) {
    errors.push('Invalid zip code format');
  }
  
  if (address.state && typeof address.state === 'string' && !isValidStateCode(address.state)) {
    errors.push('Invalid state code');
  }
  
  if (address.country_code && typeof address.country_code === 'string' && !isValidCountryCode(address.country_code)) {
    errors.push('Invalid country code');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}