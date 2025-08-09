import app from './firebase';
import { setCloudFrontCookies as setCloudFrontCookiesFn } from './namespacedFunctions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { fixCookieBase64Padding } from '../utils/base64Utils';

let cookiesSet = false;
let cookiePromise: Promise<void> | null = null;
let cookieExpiry: number | null = null;

export const ensureCloudFrontAccess = async (): Promise<void> => {
  // Skip CloudFront cookies in development
  // Cookies won't work cross-origin from localhost to uploads.expansemarketing.com
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    console.log('Skipping CloudFront cookie setup in local development');
    cookiesSet = true;
    return Promise.resolve();
  }

  // Check if cookies need refresh (expired or about to expire in next 5 minutes)
  const needsRefresh = !cookiesSet || 
    !cookieExpiry || 
    cookieExpiry < (Date.now() + 5 * 60 * 1000);

  if (!needsRefresh) {
    return Promise.resolve();
  }

  // Return existing promise if in progress
  if (cookiePromise) {
    return cookiePromise;
  }

  // Create new promise for cookie setting
  cookiePromise = (async () => {
    try {
      // Use namespaced function
      const result = await setCloudFrontCookiesFn();
      const { cookies, expires } = result.data as any;

      console.log('CloudFront cookies received:', Object.keys(cookies));
      console.log('Cookie values:', cookies);
      console.log('Cookies expire at:', new Date(expires).toISOString());
      
      // Debug: Check current cookies before setting new ones
      console.log('Current document.cookie:', document.cookie);
      
      // Store expiry time
      cookieExpiry = expires;

      // Set cookies with proper attributes
      Object.entries(cookies).forEach(([name, value]) => {
        // Trim any whitespace/newlines from cookie values
        let cookieValue = (value as string).trim();
        
        // Fix base64 padding if needed (some browsers/CDNs replace '==' with '__')
        const originalValue = cookieValue;
        cookieValue = fixCookieBase64Padding(cookieValue);
        if (originalValue !== cookieValue) {
          console.warn(`Cookie ${name} had invalid padding - fixed from "${originalValue.slice(-3)}" to "${cookieValue.slice(-3)}"`);
        }
        
        // For localhost development, don't set domain attribute
        if (window.location.hostname === 'localhost') {
          document.cookie = `${name}=${cookieValue}; path=/`;
          console.log(`Set cookie ${name} for localhost`);
        } else {
          // For production, set domain to allow subdomain access
          // Important: CloudFront cookies should NOT be URL encoded
          const cookieString = `${name}=${cookieValue}; domain=.expansemarketing.com; path=/; secure; samesite=none`;
          document.cookie = cookieString;
          console.log(`Set cookie ${name} for production`);
          console.log(`Cookie value (processed): "${cookieValue}"`);
          console.log(`Cookie value length: ${cookieValue.length}`);
          console.log(`Last 10 chars: "${cookieValue.slice(-10)}"`);
          
          // Verify the cookie was set
          const allCookies = document.cookie;
          const cookieExists = allCookies.includes(name);
          console.log(`Cookie ${name} exists after setting: ${cookieExists}`);
        }
      });

      cookiesSet = true;
      console.log('CloudFront access enabled - all cookies set');
    } catch (error) {
      console.error('Failed to set CloudFront cookies:', error);
      // Don't throw - allow component to continue functioning
    } finally {
      cookiePromise = null;
    }
  })();

  return cookiePromise;
};

// Helper function to get CloudFront cookies
export const getCloudFrontCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && name.startsWith('CloudFront-')) {
      // Fix base64 padding if needed
      let processedValue = value;
      if (value) {
        const fixed = fixCookieBase64Padding(value);
        if (fixed !== value) {
          console.warn(`Cookie ${name} had invalid padding when reading - fixed`);
          processedValue = fixed;
        }
      }
      acc[name] = processedValue;
    }
    return acc;
  }, {} as Record<string, string>);
  
  // Log cookie details for debugging
  if (Object.keys(cookies).length > 0) {
    console.log('CloudFront cookies found:', Object.keys(cookies));
    // Decode and log policy for debugging
    if (cookies['CloudFront-Policy']) {
      try {
        const decodedPolicy = atob(cookies['CloudFront-Policy']);
        const policy = JSON.parse(decodedPolicy);
        console.log('CloudFront Policy:', policy);
        console.log('Policy expiry:', new Date(policy.Statement[0].Condition.DateLessThan['AWS:EpochTime'] * 1000).toISOString());
      } catch (e) {
        console.error('Failed to decode CloudFront policy:', e);
      }
    }
  }
  
  return cookies;
};

// Reset function for testing or logout
export const resetCloudFrontAccess = () => {
  cookiesSet = false;
  cookiePromise = null;
  cookieExpiry = null;
  
  // Clear cookies
  ['CloudFront-Key-Pair-Id', 'CloudFront-Policy', 'CloudFront-Signature'].forEach(name => {
    if (window.location.hostname === 'localhost') {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } else {
      document.cookie = `${name}=; domain=.expansemarketing.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
};

// Force refresh CloudFront cookies
export const forceRefreshCloudFrontAccess = async (): Promise<void> => {
  console.log('Force refreshing CloudFront cookies...');
  resetCloudFrontAccess();
  // Wait a bit to ensure cookies are cleared
  await new Promise(resolve => setTimeout(resolve, 100));
  return ensureCloudFrontAccess();
};

// Initialize auth state listener for automatic cookie refresh
const auth = getAuth(app);
let refreshInterval: NodeJS.Timeout | null = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, check if we need to refresh cookies
    ensureCloudFrontAccess().catch(err => {
      console.error('Failed to refresh CloudFront cookies on auth state change:', err);
    });
    
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Set up periodic refresh check every 5 minutes
    refreshInterval = setInterval(() => {
      ensureCloudFrontAccess().catch(err => {
        console.error('Failed to refresh CloudFront cookies on interval:', err);
      });
    }, 5 * 60 * 1000); // 5 minutes
  } else {
    // User signed out, reset cookies and clear interval
    resetCloudFrontAccess();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
});