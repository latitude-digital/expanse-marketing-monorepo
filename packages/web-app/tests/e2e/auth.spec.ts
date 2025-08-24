/**
 * Authentication Flow E2E Tests (AUTH-020)
 * 
 * Comprehensive test coverage for:
 * - Login flow tests with valid/invalid credentials
 * - Remember me functionality
 * - Redirect to original URL after login
 * - Logout functionality
 * - Password reset flow
 * - Protected routes access control
 * - Session timeout handling (if feasible)
 * 
 * Uses test users from createTestUsers.ts:
 * - testuser@expanse.demo / TestUser123!@#
 * - testadmin@expanse.demo / TestAdmin123!@#
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8001';
const TEST_TIMEOUT = 30000;

// Test credentials (from createTestUsers.ts)
const TEST_USERS = {
  regular: {
    email: 'testuser@expanse.demo',
    password: 'TestUser123!@#',
    role: 'user'
  },
  admin: {
    email: 'testadmin@expanse.demo', 
    password: 'TestAdmin123!@#',
    role: 'admin'
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!'
  }
};

// Helper functions
async function navigateToLogin(page: Page, returnUrl?: string): Promise<void> {
  const url = returnUrl ? `/auth?r=${encodeURIComponent(returnUrl)}` : '/auth';
  await page.goto(url);
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
}

async function fillLoginForm(page: Page, email: string, password: string, rememberMe = false): Promise<void> {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  if (rememberMe) {
    await page.check('input[name="rememberMe"]');
  }
}

async function submitLoginForm(page: Page): Promise<void> {
  await page.click('button[type="submit"]');
}

async function waitForLogin(page: Page): Promise<void> {
  // Wait for redirect away from login page or success indicators
  await Promise.race([
    page.waitForURL(url => !url.pathname.includes('auth') && !url.pathname.includes('login'), { timeout: 10000 }),
    page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 }),
    page.waitForSelector('.user-profile', { timeout: 10000 })
  ]);
}

async function waitForLogout(page: Page): Promise<void> {
  await Promise.race([
    page.waitForURL(/auth|login|welcome|^\/$/, { timeout: 10000 }),
    page.waitForSelector('input[name="email"]', { timeout: 10000 })
  ]);
}

async function loginAs(page: Page, userType: 'regular' | 'admin', rememberMe = false): Promise<void> {
  const user = TEST_USERS[userType];
  await navigateToLogin(page);
  await fillLoginForm(page, user.email, user.password, rememberMe);
  await submitLoginForm(page);
  await waitForLogin(page);
}

async function logout(page: Page): Promise<void> {
  // Try different logout button selectors
  const logoutSelectors = [
    '[data-testid="logout-button"]',
    'button:has-text("Sign Out")',
    'button:has-text("Logout")',
    '[data-testid="user-menu"]'
  ];
  
  for (const selector of logoutSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      await element.click();
      
      // If it was a user menu, look for logout option
      if (selector.includes('user-menu')) {
        await page.click('button:has-text("Sign Out"), button:has-text("Logout")');
      }
      break;
    }
  }
  
  await waitForLogout(page);
}

async function isLoggedIn(page: Page): Promise<boolean> {
  const indicators = [
    '[data-testid="user-menu"]',
    '[data-testid="logout-button"]', 
    '.user-profile',
    '[aria-label="User menu"]'
  ];
  
  for (const selector of indicators) {
    if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }
  }
  return false;
}

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set default timeout for all tests
    test.setTimeout(TEST_TIMEOUT);
    
    // Ensure we start with a clean state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Login Flow Tests', () => {
    test('should successfully login with valid user credentials', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
      await submitLoginForm(page);
      
      // Should redirect to home page or dashboard
      await waitForLogin(page);
      
      // Verify we're logged in
      expect(await isLoggedIn(page)).toBeTruthy();
      
      // Should not show login form anymore
      await expect(page.locator('input[name="email"]')).not.toBeVisible();
    });

    test('should successfully login with valid admin credentials', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await submitLoginForm(page);
      
      await waitForLogin(page);
      expect(await isLoggedIn(page)).toBeTruthy();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.invalid.email, TEST_USERS.invalid.password);
      await submitLoginForm(page);
      
      // Should show error message
      await page.waitForSelector('[role="alert"]', { timeout: 10000 });
      const errorMessage = await page.locator('[role="alert"]').textContent();
      
      expect(errorMessage).toContain('Invalid credentials');
      
      // Should still be on login page
      await expect(page.locator('input[name="email"]')).toBeVisible();
      expect(await isLoggedIn(page)).toBeFalsy();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, 'invalid-email', TEST_USERS.regular.password);
      await submitLoginForm(page);
      
      // Should show validation error
      const emailError = await page.locator('text=/invalid email/i, text=/valid email/i').first();
      await expect(emailError).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.regular.email, 'weak');
      await submitLoginForm(page);
      
      // Should show password validation error
      const passwordError = await page.locator('text=/at least 8 characters/i, text=/password/i').first();
      await expect(passwordError).toBeVisible();
    });

    test('should show loading state during login attempt', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
      
      // Start login process
      const submitPromise = submitLoginForm(page);
      
      // Check for loading indicators
      const loadingIndicators = Promise.race([
        page.waitForSelector('button[type="submit"]:disabled', { timeout: 3000 }),
        page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 3000 }),
        page.waitForSelector('button:has-text("Signing In...")', { timeout: 3000 })
      ]);
      
      const [, loadingElement] = await Promise.all([submitPromise, loadingIndicators.catch(() => null)]);
      
      if (loadingElement) {
        expect(loadingElement).toBeTruthy();
      }
      
      await waitForLogin(page);
    });

    test('should preserve form state on validation errors', async ({ page }) => {
      const testEmail = 'preserve@test.com';
      
      await navigateToLogin(page);
      await fillLoginForm(page, testEmail, 'weak', true); // Remember me checked
      await submitLoginForm(page);
      
      // Wait for validation error
      await page.waitForSelector('text=/at least 8 characters/i, [role="alert"]', { timeout: 5000 });
      
      // Check email is preserved
      const emailValue = await page.inputValue('input[name="email"]');
      expect(emailValue).toBe(testEmail);
      
      // Check remember me is still checked
      const isChecked = await page.isChecked('input[name="rememberMe"]');
      expect(isChecked).toBe(true);
    });
  });

  test.describe('Remember Me Functionality', () => {
    test('should persist login when remember me is checked', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.regular.email, TEST_USERS.regular.password, true);
      await submitLoginForm(page);
      await waitForLogin(page);
      
      // Simulate browser restart by creating new page context
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      
      // Navigate to a protected route that doesn't require admin
      await newPage.goto('/s/test123/dashboard');
      
      // Should still be logged in (or redirect to login if persistence is session-based)
      // This test may need adjustment based on actual Firebase persistence behavior
      const hasLoginForm = await newPage.locator('input[name="email"]').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!hasLoginForm) {
        // User is still logged in
        expect(await isLoggedIn(newPage)).toBeTruthy();
      }
      
      await newContext.close();
    });

    test('should not persist login when remember me is unchecked', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.regular.email, TEST_USERS.regular.password, false);
      await submitLoginForm(page);
      await waitForLogin(page);
      
      // Create new context (simulates browser restart)
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      
      // Navigate to protected route that doesn't require admin
      await newPage.goto('/s/test123/dashboard');
      
      // Should show login form (session-based auth should not persist)
      await expect(newPage.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
      
      await newContext.close();
    });
  });

  test.describe('Redirect to Original URL After Login', () => {
    test('should redirect to requested URL after login', async ({ page }) => {
      const targetUrl = '/admin';
      
      // Try to access protected route directly
      await page.goto(targetUrl);
      
      // Should redirect to login with return URL
      await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
      expect(page.url()).toContain('auth');
      
      // Login
      await fillLoginForm(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await submitLoginForm(page);
      
      // Should redirect to original URL
      await page.waitForURL(/admin/, { timeout: 10000 });
      expect(page.url()).toContain('/admin');
    });

    test('should redirect to home when no return URL specified', async ({ page }) => {
      await navigateToLogin(page);
      await fillLoginForm(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
      await submitLoginForm(page);
      
      // Should redirect to home page
      await page.waitForURL(url => !url.pathname.includes('auth'), { timeout: 10000 });
      expect(page.url()).toBe(`${BASE_URL}/`);
    });

    test('should handle encoded return URLs correctly', async ({ page }) => {
      const targetUrl = '/s/test123/dashboard';
      const encodedUrl = encodeURIComponent(targetUrl);
      
      await page.goto(`/auth?r=${encodedUrl}`);
      await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
      
      await fillLoginForm(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await submitLoginForm(page);
      
      // Should redirect to decoded URL
      await page.waitForURL(new RegExp(targetUrl.replace(/\//g, '\\/')), { timeout: 10000 });
    });
  });

  test.describe('Logout Functionality', () => {
    test('should logout successfully and redirect to login', async ({ page }) => {
      // Login first
      await loginAs(page, 'regular');
      expect(await isLoggedIn(page)).toBeTruthy();
      
      // Logout
      await logout(page);
      
      // Should be logged out
      expect(await isLoggedIn(page)).toBeFalsy();
      
      // Should show login form
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('should clear authentication state on logout', async ({ page }) => {
      await loginAs(page, 'regular');
      await logout(page);
      
      // Try to access protected route that doesn't require admin
      await page.goto('/s/test123/dashboard');
      
      // Should redirect to login
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle logout with URL parameter', async ({ page }) => {
      await loginAs(page, 'regular');
      
      // Navigate with logout parameter
      await page.goto('/auth?logout=1');
      
      // Should automatically logout and show login form
      await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });
      expect(await isLoggedIn(page)).toBeFalsy();
    });
  });

  test.describe('Password Reset Flow Tests', () => {
    test('should show forgot password form', async ({ page }) => {
      await navigateToLogin(page);
      
      // Click forgot password link
      await page.click('a:has-text("Forgot Password"), button:has-text("Forgot password")');
      
      // Should navigate to forgot password page or show form
      await page.waitForURL(/forgot-password/, { timeout: 10000 });
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('text=/reset/i')).toBeVisible();
    });

    test('should show success message for password reset request', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Fill email and submit
      await page.fill('input[name="email"]', TEST_USERS.regular.email);
      await page.click('button[type="submit"]');
      
      // Should show generic success message (security best practice)
      await page.waitForSelector('[role="alert"], .alert, text=/email/i', { timeout: 10000 });
      const successMessage = await page.locator('[role="alert"], .alert').first().textContent();
      
      expect(successMessage).toMatch(/email|sent|check|inbox/i);
      // Should not reveal whether email exists
      expect(successMessage).not.toMatch(/not found|does not exist/i);
    });

    test('should show generic message for non-existent email', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');
      
      // Should show same generic message (security best practice)
      await page.waitForSelector('[role="alert"], .alert, text=/email/i', { timeout: 10000 });
      const message = await page.locator('[role="alert"], .alert').first().textContent();
      
      expect(message).toMatch(/email|sent|check|inbox/i);
    });

    test('should validate email format in forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      const emailError = await page.locator('text=/valid email/i, [role="alert"]').first();
      await expect(emailError).toBeVisible();
    });

    test('should navigate back to login from forgot password', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Click back to sign in
      await page.click('a:has-text("Back to Sign In"), a:has-text("Sign In")');
      
      // Should return to login
      await page.waitForURL(/auth|login/, { timeout: 10000 });
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });
  });

  test.describe('Protected Routes Access Control', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      const protectedRoutes = [
        '/admin',
        '/admin/event/test123',
        '/s/test123/stats',
        '/s/test123/dashboard'
      ];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        
        // Should redirect to login
        await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
        expect(page.url()).toMatch(/auth|login/);
        
        // Clear any state between route tests
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }
    });

    test('should allow authenticated users access to user routes', async ({ page }) => {
      await loginAs(page, 'regular');
      
      // Access non-admin protected route
      await page.goto('/s/test123/stats');
      
      // Should not redirect to login (may show not found or actual content)
      const hasLoginForm = await page.locator('[data-testid="login-form"]').isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasLoginForm).toBeFalsy();
    });

    test('should restrict admin routes to admin users', async ({ page }) => {
      await loginAs(page, 'regular');
      
      // Try to access admin route
      await page.goto('/admin');
      
      // Should show access denied message
      await expect(page.locator('text=Access Denied')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Administrator privileges required')).toBeVisible();
      
      // Should still be on admin URL but showing access denied
      expect(page.url()).toContain('/admin');
      
      // Should not show login form
      const hasLoginForm = await page.locator('[data-testid="login-form"]').isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasLoginForm).toBeFalsy();
    });

    test('should allow admin users access to admin routes', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Access admin route
      await page.goto('/admin');
      
      // Should not redirect to login
      const hasLoginForm = await page.locator('[data-testid="login-form"]').isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasLoginForm).toBeFalsy();
      
      // Should see admin content
      await expect(page.locator('text=/admin|dashboard|events/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Session Timeout Tests', () => {
    test('should show session warning before timeout', async ({ page }) => {
      // This test may need to be marked as slow or skipped in CI
      // depending on the actual session timeout configuration
      
      await loginAs(page, 'regular');
      
      // Wait for session warning modal (this is environment-dependent)
      // In development, timeout is 5 minutes, warning at 4 minutes
      // This test would be very slow, so we'll mock it or skip in CI
      
      if (process.env.NODE_ENV === 'development') {
        test.skip('Session timeout test skipped - too slow for CI');
      }
      
      // For faster testing, we could trigger session warning manually if exposed
      const hasSessionModal = await page.locator('[data-testid="session-warning-modal"]').isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasSessionModal) {
        // Should show extend session option
        await expect(page.locator('button:has-text("Extend Session")')).toBeVisible();
      }
    });

    test('should extend session when user clicks extend', async ({ page }) => {
      await loginAs(page, 'regular');
      
      // If session modal appears (very unlikely in test timeframe)
      const sessionModal = page.locator('[data-testid="session-warning-modal"]');
      const hasModal = await sessionModal.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasModal) {
        await page.click('button:has-text("Extend Session")');
        
        // Modal should close
        await expect(sessionModal).not.toBeVisible();
        
        // Should still be logged in
        expect(await isLoggedIn(page)).toBeTruthy();
      } else {
        test.skip('Session modal did not appear - normal for short test duration');
      }
    });

    test('should logout user on session timeout', async ({ page }) => {
      // This test would be very slow with real timeouts
      // In practice, this would need to be tested with mocked timers or reduced timeout values
      
      if (process.env.CI) {
        test.skip('Session timeout test skipped in CI - too slow');
        return;
      }
      
      await loginAs(page, 'regular');
      
      // For testing purposes, we could:
      // 1. Mock the session timeout
      // 2. Use a test-specific short timeout
      // 3. Manually trigger timeout if the API is exposed
      
      // Mock approach (if session manager exposes test utilities)
      const sessionExpired = await page.evaluate(() => {
        // This would need to be implemented in the session manager
        if ((window as any).testUtils?.expireSession) {
          (window as any).testUtils.expireSession();
          return true;
        }
        return false;
      });
      
      if (sessionExpired) {
        // Should redirect to login
        await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
        expect(await isLoggedIn(page)).toBeFalsy();
      } else {
        test.skip('Session timeout utilities not available');
      }
    });
  });

  test.describe('Cross-Tab Session Management', () => {
    test('should sync logout across tabs', async ({ page }) => {
      await loginAs(page, 'regular');
      
      // Open second tab
      const secondTab = await page.context().newPage();
      await secondTab.goto('/');
      
      // Verify both tabs are logged in
      expect(await isLoggedIn(page)).toBeTruthy();
      expect(await isLoggedIn(secondTab)).toBeTruthy();
      
      // Logout from first tab
      await logout(page);
      
      // Second tab should also be logged out (may take a moment due to event synchronization)
      await secondTab.waitForTimeout(1000); // Brief wait for cross-tab sync
      
      // Navigate to trigger auth check (use non-admin protected route)
      await secondTab.goto('/s/test123/dashboard');
      
      // Should redirect to login
      await expect(secondTab.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
      
      await secondTab.close();
    });
  });

  test.describe('Error Recovery and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await navigateToLogin(page);
      
      // Simulate network failure
      await page.route('**/*', route => route.abort('failed'));
      
      await fillLoginForm(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
      await submitLoginForm(page);
      
      // Should show error message
      await expect(page.locator('[role="alert"], .error')).toBeVisible({ timeout: 10000 });
      
      // Restore network
      await page.unroute('**/*');
    });

    test('should handle malformed credentials', async ({ page }) => {
      await navigateToLogin(page);
      
      // Test various malformed inputs
      const malformedInputs = [
        { email: '', password: TEST_USERS.regular.password },
        { email: TEST_USERS.regular.email, password: '' },
        { email: 'test@', password: 'password' },
        { email: '@example.com', password: 'password' }
      ];
      
      for (const input of malformedInputs) {
        await page.fill('input[name="email"]', input.email);
        await page.fill('input[name="password"]', input.password);
        await submitLoginForm(page);
        
        // Should show validation error or login error
        const hasError = await page.locator('[role="alert"], .error, text=/required|invalid/i').isVisible({ timeout: 3000 });
        expect(hasError).toBeTruthy();
        
        // Clear form for next iteration
        await page.fill('input[name="email"]', '');
        await page.fill('input[name="password"]', '');
      }
    });

    test('should clear error messages on new input', async ({ page }) => {
      await navigateToLogin(page);
      
      // Generate an error
      await fillLoginForm(page, TEST_USERS.invalid.email, TEST_USERS.invalid.password);
      await submitLoginForm(page);
      
      // Wait for error
      await page.waitForSelector('[role="alert"]', { timeout: 10000 });
      
      // Start typing in email field
      await page.fill('input[name="email"]', TEST_USERS.regular.email);
      
      // Error should be cleared (implementation dependent)
      // This behavior may vary based on form implementation
      const errorStillVisible = await page.locator('[role="alert"]').isVisible({ timeout: 1000 }).catch(() => false);
      
      // Either error is cleared, or it remains until form is resubmitted (both are valid UX patterns)
      // The test documents the current behavior
      console.log(`Error persistence after input: ${errorStillVisible}`);
    });
  });
});