/**
 * AUTH-009: CloudFront Cookie Integration Test Utilities
 * 
 * These utilities help test and debug CloudFront cookie integration
 * with the Firebase SDK v10 authentication system.
 */

import { getAuth } from 'firebase/auth';
import app from '../services/firebase';
import { getCloudFrontCookies, ensureCloudFrontAccess, resetCloudFrontAccess } from '../services/cloudFrontAuth';

export interface CloudFrontTestResult {
  isAuthenticated: boolean;
  userEmail: string | null;
  hasCookies: boolean;
  cookieNames: string[];
  cookieDetails: Record<string, any>;
  errors: string[];
  timestamp: string;
}

/**
 * Comprehensive CloudFront integration test
 */
export async function testCloudFrontIntegration(): Promise<CloudFrontTestResult> {
  const auth = getAuth(app);
  const result: CloudFrontTestResult = {
    isAuthenticated: false,
    userEmail: null,
    hasCookies: false,
    cookieNames: [],
    cookieDetails: {},
    errors: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Check auth state
    const currentUser = auth.currentUser;
    result.isAuthenticated = !!currentUser;
    result.userEmail = currentUser?.email || null;

    if (!result.isAuthenticated) {
      result.errors.push('User is not authenticated');
      return result;
    }

    // Test CloudFront cookie retrieval
    try {
      await ensureCloudFrontAccess();
      console.log('CloudFront access ensured successfully');
    } catch (error) {
      result.errors.push(`Failed to ensure CloudFront access: ${error}`);
    }

    // Check current cookies
    const cookies = getCloudFrontCookies();
    result.hasCookies = Object.keys(cookies).length > 0;
    result.cookieNames = Object.keys(cookies);

    // Analyze cookie details
    result.cookieDetails = {
      totalCookies: Object.keys(cookies).length,
      cookieNames: Object.keys(cookies),
      ...cookies
    };

    // Validate expected CloudFront cookies
    const expectedCookies = ['CloudFront-Key-Pair-Id', 'CloudFront-Policy', 'CloudFront-Signature'];
    const missingCookies = expectedCookies.filter(name => !cookies[name]);
    
    if (missingCookies.length > 0) {
      result.errors.push(`Missing CloudFront cookies: ${missingCookies.join(', ')}`);
    }

    // Test cookie expiry if policy is available
    if (cookies['CloudFront-Policy']) {
      try {
        const decodedPolicy = atob(cookies['CloudFront-Policy']);
        const policy = JSON.parse(decodedPolicy);
        const expiryTime = policy.Statement?.[0]?.Condition?.DateLessThan?.['AWS:EpochTime'] * 1000;
        
        if (expiryTime) {
          const now = Date.now();
          const expiresAt = new Date(expiryTime);
          const timeUntilExpiry = expiryTime - now;
          
          result.cookieDetails.expiresAt = expiresAt.toISOString();
          result.cookieDetails.timeUntilExpiryMs = timeUntilExpiry;
          result.cookieDetails.isExpired = timeUntilExpiry <= 0;
          result.cookieDetails.willExpireSoon = timeUntilExpiry <= (5 * 60 * 1000); // 5 minutes
          
          if (result.cookieDetails.isExpired) {
            result.errors.push('CloudFront cookies are expired');
          } else if (result.cookieDetails.willExpireSoon) {
            result.errors.push('CloudFront cookies will expire soon (< 5 minutes)');
          }
        }
      } catch (error) {
        result.errors.push(`Failed to decode CloudFront policy: ${error}`);
      }
    }

  } catch (error) {
    result.errors.push(`CloudFront integration test failed: ${error}`);
  }

  return result;
}

/**
 * Quick CloudFront status check
 */
export function getCloudFrontStatus(): {
  authenticated: boolean;
  hasCookies: boolean;
  cookieCount: number;
  errors: string[];
} {
  const auth = getAuth(app);
  const cookies = getCloudFrontCookies();
  const errors: string[] = [];
  
  const authenticated = !!auth.currentUser;
  if (!authenticated) {
    errors.push('User not authenticated');
  }
  
  const hasCookies = Object.keys(cookies).length > 0;
  if (!hasCookies && authenticated) {
    errors.push('No CloudFront cookies found for authenticated user');
  }
  
  return {
    authenticated,
    hasCookies,
    cookieCount: Object.keys(cookies).length,
    errors
  };
}

/**
 * Force refresh CloudFront cookies and test
 */
export async function refreshAndTestCloudFront(): Promise<CloudFrontTestResult> {
  console.log('Forcing CloudFront cookie refresh...');
  resetCloudFrontAccess();
  
  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return testCloudFrontIntegration();
}

/**
 * Log CloudFront integration status to console (for debugging)
 */
export function logCloudFrontStatus(): void {
  const status = getCloudFrontStatus();
  
  console.group('🔒 CloudFront Integration Status');
  console.log('Authenticated:', status.authenticated);
  console.log('Has Cookies:', status.hasCookies);
  console.log('Cookie Count:', status.cookieCount);
  
  if (status.errors.length > 0) {
    console.error('Errors:', status.errors);
  }
  
  if (status.hasCookies) {
    const cookies = getCloudFrontCookies();
    console.log('Cookie Names:', Object.keys(cookies));
  }
  
  console.groupEnd();
}

/**
 * Browser console helper - adds CloudFront testing functions to window
 * Usage: CloudFrontTest.test(), CloudFrontTest.status(), CloudFrontTest.refresh()
 */
export function enableCloudFrontConsoleHelpers(): void {
  if (typeof window !== 'undefined') {
    (window as any).CloudFrontTest = {
      test: testCloudFrontIntegration,
      status: getCloudFrontStatus,
      refresh: refreshAndTestCloudFront,
      log: logCloudFrontStatus,
      cookies: getCloudFrontCookies
    };
    
    console.log('CloudFront test helpers enabled. Use CloudFrontTest.log() to check status.');
  }
}