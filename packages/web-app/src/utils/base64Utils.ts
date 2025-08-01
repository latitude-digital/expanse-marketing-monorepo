/**
 * Convert URL-safe base64 to standard base64
 * URL-safe base64 uses:
 * - '_' instead of '/'
 * - '-' instead of '+'
 * - No padding (=) or '__' instead of '=='
 */
export function urlSafeBase64ToBase64(urlSafeBase64: string): string {
  // Replace URL-safe characters
  let base64 = urlSafeBase64
    .replace(/_/g, '/')
    .replace(/-/g, '+');
  
  // Add proper padding
  const padding = base64.length % 4;
  if (padding) {
    if (padding === 2) {
      base64 += '==';
    } else if (padding === 3) {
      base64 += '=';
    }
  }
  
  return base64;
}

/**
 * Convert standard base64 to URL-safe base64
 */
export function base64ToUrlSafeBase64(base64: string): string {
  return base64
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .replace(/=/g, ''); // Remove padding
}

/**
 * Decode URL-safe base64 string
 */
export function decodeUrlSafeBase64(urlSafeBase64: string): string {
  const base64 = urlSafeBase64ToBase64(urlSafeBase64);
  return atob(base64);
}

/**
 * Fix cookies that have '__' instead of proper base64 padding
 * This handles the specific case where '==' was replaced with '__'
 * 
 * NOTE: This is a workaround for an issue where CloudFront cookies
 * generated by @aws-sdk/cloudfront-signer have their base64 padding
 * modified by some browsers or intermediate proxies/CDNs.
 * 
 * Ideally, the AWS SDK would provide URL-safe base64 cookies, or
 * we would use a proper base64url library on both ends.
 */
export function fixCookieBase64Padding(cookieValue: string): string {
  // If the cookie ends with '__', it should be '=='
  if (cookieValue.endsWith('__')) {
    return cookieValue.slice(0, -2) + '==';
  }
  // If the cookie ends with '_' (single), it might be '='
  // But we need to check the length to be sure
  if (cookieValue.endsWith('_') && !cookieValue.endsWith('__')) {
    const withoutUnderscore = cookieValue.slice(0, -1);
    if ((withoutUnderscore.length + 1) % 4 === 3) {
      return withoutUnderscore + '=';
    }
  }
  return cookieValue;
}