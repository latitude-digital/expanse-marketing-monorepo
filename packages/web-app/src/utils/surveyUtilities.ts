import UAParser from 'ua-parser-js';
import { getApiUrl, ENDPOINTS } from '../config/api';
import * as Sentry from '@sentry/react';
import { EmailValidationResult, EmailValidationResponse } from '@expanse/shared';

// File validation types
export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

// UTM parameter types
export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

// Mobile device detection
export const detectMobile = (): boolean => {
  const parser = new UAParser();
  const result = parser.getResult();
  return result.device.type === 'mobile' || result.device.type === 'tablet';
};

// Image compression for mobile uploads
export const compressImage = async (
  file: File, 
  maxWidth: number = 1920, 
  quality: number = 0.8
): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(file); // Fallback to original file if canvas context fails
          return;
        }
        
        let width = img.width;
        let height = img.height;
        
        // Only compress if image is larger than maxWidth
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Fallback to original file if blob creation fails
            return;
          }
          
          const compressedFile = new File([blob], file.name, { 
            type: file.type,
            lastModified: file.lastModified 
          });
          resolve(compressedFile);
        }, file.type, quality);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// Enhanced file size validation with user-friendly messages
export const validateFileSize = (file: File, maxSizeMB: number = 10): FileValidationResult => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: `File size must be less than ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
    };
  }
  return { valid: true };
};

// Network error handling with specific messages
export const handleNetworkError = (error: any): string => {
  if (!navigator.onLine) {
    return "No internet connection. Please check your network and try again.";
  }
  
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return "Network error. Please check your connection and try again.";
  }
  
  if (error.status === 413) {
    return "File too large for upload. Please choose a smaller image.";
  }
  
  if (error.status === 408) {
    return "Upload timeout. Please try again.";
  }
  
  return "Upload failed. Please try again.";
};

// Upload with retry logic and exponential backoff
export const uploadWithRetry = async <T>(
  uploadFn: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (400-499)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Extract UTM parameters from URL
export const extractUTM = (): UTMParameters => {
  // Get the UTM parameters from the URL
  const search = window.location.search;
  const params = new URLSearchParams(search);

  const utm: UTMParameters = {};

  // Loop through each UTM parameter
  params.forEach((value, key) => {
    // Check if the parameter is a UTM parameter
    if (["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].includes(key)) {
      utm[key as keyof UTMParameters] = value;
    }
  });

  return utm;
};

// Helper function to determine the best language to use
export const determineLanguage = (
  supportedLocales: string[], 
  urlLang?: string, 
  browserLang?: string
): string => {
  // If URL parameter is provided and supported, use it
  if (urlLang && supportedLocales.includes(urlLang)) {
    return urlLang;
  }
  
  // Try to match browser language (full code like 'en-US')
  if (browserLang && supportedLocales.includes(browserLang)) {
    return browserLang;
  }
  
  // Try to match just the primary language code (like 'en' from 'en-US')
  const primaryBrowserLang = browserLang?.split('-')[0];
  if (primaryBrowserLang && supportedLocales.includes(primaryBrowserLang)) {
    return primaryBrowserLang;
  }
  
  // Fall back to the first supported locale or 'en' if available
  return supportedLocales.includes('en') ? 'en' : supportedLocales[0];
};

// Email validation function for SurveyJS
// This wraps the shared validation function with the API endpoint
export const validateEmailForSurveyJS = function(this: any): void {
  console.log('[validateEmail]', this.question.value);
  const email = this.question.value;

  this.question.setPropertyValue('didYouMean', "");

  if (!email) {
    this.returnResult();
    return;
  }

  // Use the shared validation with our API endpoint
  fetch(getApiUrl(ENDPOINTS.VALIDATE_EMAIL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(response => {
    response.json().then((res: EmailValidationResponse) => {
      const result = res.results;

      let valid = true;
      console.log('this.survey', this.survey);
      console.log('this.question', this.question);
      console.log('validateEmail res', res);

      // bad emails are rejected
      if (result?.valid === false) {
        valid = false;
      }

      // disposable email services are rejected
      if (result?.is_disposable === true) {
        valid = false;
      }

      // reject delivery_confidence below 20
      if (result?.delivery_confidence !== undefined && result.delivery_confidence < 20) {
        valid = false;
      }

      // typos are rejected with correction
      if (result?.did_you_mean) {
        valid = true;
        this.question.setPropertyValue('didYouMean', result.did_you_mean);

        console.log('this.question after', this.question.didYouMean);
      }

      this.returnResult(valid);
    });
  }).catch(err => {
    Sentry.captureException(err);
    alert(err);
  });
};