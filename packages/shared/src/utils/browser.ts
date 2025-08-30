/**
 * Browser and device detection utilities
 */

/**
 * UTM parameter types
 */
export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Extract UTM parameters from URL
 */
export function extractUTM(): UTMParameters {
  if (typeof window === 'undefined') {
    return {};
  }
  
  // Get the UTM parameters from the URL
  const search = window.location.search;
  const params = new URLSearchParams(search);

  const utm: UTMParameters = {};

  // Loop through each UTM parameter
  params.forEach((value, key) => {
    // Check if the parameter is a UTM parameter
    if (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].includes(key)) {
      utm[key as keyof UTMParameters] = value;
    }
  });

  return utm;
}

/**
 * Get browser language
 */
export function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') {
    return 'en';
  }
  
  return navigator.language || 'en';
}

/**
 * Check if browser supports a specific feature
 */
export function supportsFeature(feature: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  switch (feature) {
    case 'localStorage':
      try {
        return 'localStorage' in window && window.localStorage !== null;
      } catch {
        return false;
      }
    
    case 'sessionStorage':
      try {
        return 'sessionStorage' in window && window.sessionStorage !== null;
      } catch {
        return false;
      }
    
    case 'geolocation':
      return 'geolocation' in navigator;
    
    case 'notifications':
      return 'Notification' in window;
    
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    
    case 'webGL':
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    
    default:
      return false;
  }
}

/**
 * Get URL parameter value
 */
export function getURLParameter(name: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Set URL parameter
 */
export function setURLParameter(name: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const params = new URLSearchParams(window.location.search);
  params.set(name, value);
  
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Remove URL parameter
 */
export function removeURLParameter(name: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const params = new URLSearchParams(window.location.search);
  params.delete(name);
  
  const newUrl = params.toString() 
    ? `${window.location.pathname}?${params.toString()}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  
  window.history.replaceState({}, '', newUrl);
}

/**
 * Check if running in iframe
 */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    return window.self !== window.top;
  } catch {
    return true; // Probably in an iframe with different origin
  }
}

/**
 * Get referrer domain
 */
export function getReferrerDomain(): string | null {
  if (typeof document === 'undefined' || !document.referrer) {
    return null;
  }
  
  try {
    const url = new URL(document.referrer);
    return url.hostname;
  } catch {
    return null;
  }
}