/**
 * Unified email validation service
 * Consolidates email validation logic from web-app and firebase packages
 */

import axios from 'axios';
import { EmailValidationResult, EmailValidationResponse } from '../types/core';

/**
 * SparkPost API key should be set in environment variables
 */
const SPARKPOST_API_KEY = process.env.SPARKPOST_API_KEY || process.env.VITE_SPARKPOST_API_KEY;

/**
 * Basic email format validation
 * Synchronous validation for quick client-side checks
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Advanced email validation using SparkPost API
 * Async validation that checks deliverability, disposable domains, etc.
 */
export async function validateEmailWithAPI(
  email: string,
  apiEndpoint?: string
): Promise<EmailValidationResponse> {
  try {
    // If apiEndpoint is provided, use it (for client-side calls)
    if (apiEndpoint) {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json() as EmailValidationResponse;
    }
    
    // Direct SparkPost API call (for server-side)
    if (!SPARKPOST_API_KEY) {
      console.warn('SparkPost API key not configured, falling back to basic validation');
      return {
        results: {
          valid: validateEmailFormat(email)
        }
      };
    }
    
    const response = await axios.get(
      `https://api.sparkpost.com/api/v1/recipient-validation/single/${email}`,
      {
        headers: {
          'Authorization': SPARKPOST_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // SparkPost returns data in results field
    return {
      results: response.data.results
    };
    
  } catch (error: any) {
    console.error('Email validation error:', error);
    
    // Fall back to basic validation on API error
    return {
      results: {
        valid: validateEmailFormat(email)
      }
    };
  }
}

/**
 * SurveyJS-compatible email validation function
 * This can be used as a custom validator in SurveyJS
 */
export function validateEmailForSurveyJS(
  this: any,
  apiEndpoint: string
): void {
  const email = this.question.value;
  
  // Clear any previous suggestions
  this.question.setPropertyValue('didYouMean', '');
  
  // If no email, validation passes
  if (!email) {
    this.returnResult(true);
    return;
  }
  
  // Quick format check first
  if (!validateEmailFormat(email)) {
    this.returnResult(false);
    return;
  }
  
  // Async API validation
  validateEmailWithAPI(email, apiEndpoint)
    .then((response) => {
      const result = response.results;
      
      // Set suggestion if available
      if (result?.did_you_mean) {
        this.question.setPropertyValue('didYouMean', result.did_you_mean);
      }
      
      // Determine if valid based on SparkPost criteria
      let isValid = true;
      if (result?.valid === false) isValid = false;
      if (result?.is_disposable === true) isValid = false;
      if (result?.delivery_confidence !== undefined && result.delivery_confidence < 20) isValid = false;
      
      // Return validation result
      this.returnResult(isValid);
    })
    .catch((error) => {
      console.error('Email validation error:', error);
      // On error, allow the email (better UX than blocking)
      this.returnResult(true);
    });
}

/**
 * Validate email with comprehensive checks
 * Returns detailed validation result
 */
export function validateEmailComprehensive(email: string): EmailValidationResult {
  const domain = email.split('@')[1];
  
  // Basic format check
  if (!validateEmailFormat(email)) {
    return {
      valid: false
    };
  }
  
  // Check for common typos in domain
  const typoMap: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };
  
  const suggestion = typoMap[domain];
  if (suggestion) {
    return {
      valid: true, // Allow but suggest
      did_you_mean: email.replace(domain, suggestion)
    };
  }
  
  // Check for disposable email domains (basic list)
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com',
    'guerrillamail.com', 'mailinator.com', 'temp-mail.org'
  ];
  
  if (disposableDomains.includes(domain)) {
    return {
      valid: false,
      is_disposable: true
    };
  }
  
  return {
    valid: true
  };
}

/**
 * Batch email validation
 * Validates multiple emails at once
 */
export async function validateEmailBatch(
  emails: string[],
  apiEndpoint?: string
): Promise<Map<string, EmailValidationResponse>> {
  const results = new Map<string, EmailValidationResponse>();
  
  // Process in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(email => validateEmailWithAPI(email, apiEndpoint))
    );
    
    batch.forEach((email, index) => {
      results.set(email, batchResults[index]);
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}