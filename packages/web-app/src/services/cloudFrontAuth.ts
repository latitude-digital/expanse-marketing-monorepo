import app from './firebase';
import { setCloudFrontCookies as setCloudFrontCookiesFn } from './namespacedFunctions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { fixCookieBase64Padding } from '../utils/base64Utils';

let cookiesSet = false;
let cookiePromise: Promise<void> | null = null;
let cookieExpiry: number | null = null;

export const ensureCloudFrontAccess = async (): Promise<void> => {
  // AUTH-009: Enhanced CloudFront access with better auth integration
  
  // Skip CloudFront cookies in development
  // Cookies won't work cross-origin from localhost to uploads.expansemarketing.com
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    console.log('Skipping CloudFront cookie setup in local development');
    cookiesSet = true;
    return Promise.resolve();
  }
  
  // Check if user is authenticated before attempting to get CloudFront cookies
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('User not authenticated - skipping CloudFront cookie setup');
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
      // AUTH-009: Enhanced error handling for CloudFront cookie retrieval
      console.log('Fetching CloudFront cookies for authenticated user:', currentUser?.email);
      
      // Use namespaced function to get CloudFront cookies
      const result = await setCloudFrontCookiesFn();
      const { cookies, expires } = result.data as any;
      
      if (!cookies || !expires) {
        throw new Error('Invalid CloudFront cookie response - missing cookies or expires');
      }

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
      console.log('CloudFront access enabled - all cookies set for user:', currentUser?.email);
    } catch (error) {
      console.error('Failed to set CloudFront cookies:', error);
      console.error('CloudFront cookie error details:', {
        userEmail: currentUser?.email,
        userUid: currentUser?.uid,
        timestamp: new Date().toISOString()
      });
      
      // Reset state on error to allow retry
      cookiesSet = false;
      cookieExpiry = null;
      
      // Don't throw - allow component to continue functioning
      // but log the error for monitoring
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

// AUTH-009: Enhanced auth state listener for better CloudFront integration
const auth = getAuth(app);
let refreshInterval: NodeJS.Timeout | null = null;
let isInitialized = false;

// Track auth state changes and manage CloudFront cookies accordingly
onAuthStateChanged(auth, async (user) => {
  console.log('CloudFront auth state changed:', user ? 'signed in' : 'signed out');
  
  if (user) {
    // User is signed in - ensure CloudFront access
    try {
      await ensureCloudFrontAccess();
      console.log('CloudFront access ensured after auth state change');
    } catch (err) {
      console.error('Failed to ensure CloudFront access on auth state change:', err);
    }
    
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Set up periodic refresh check every 5 minutes
    // Only start if not already running to prevent duplicate intervals
    refreshInterval = setInterval(async () => {
      try {
        await ensureCloudFrontAccess();
        console.log('CloudFront cookies refreshed via interval');
      } catch (err) {
        console.error('Failed to refresh CloudFront cookies on interval:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('CloudFront periodic refresh interval started');
  } else {
    // User signed out - clean up CloudFront cookies and intervals
    console.log('User signed out - cleaning up CloudFront cookies');
    resetCloudFrontAccess();
    
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      console.log('CloudFront periodic refresh interval cleared');
    }
  }
  
  isInitialized = true;
});

// Export initialization status for testing/debugging
export const isCloudFrontInitialized = () => isInitialized;