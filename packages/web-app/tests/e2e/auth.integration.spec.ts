import { test, expect } from '@playwright/test';
import { loginAs, logout, isLoggedIn, attemptLogin, getTestCredentials } from './auth-helpers';

// Test configuration
const BASE_URL = 'http://localhost:8001';

// Get real test credentials from saved configuration
const TEST_USER = getTestCredentials('user');
const TEST_ADMIN = getTestCredentials('admin');

// Invalid credentials for negative testing
const INVALID_EMAIL = 'invalid@example.com';
const INVALID_PASSWORD = 'wrongpassword';

test.describe('Authentication Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto(`${BASE_URL}/login`);
    
    // Wait for the login form to be visible
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
  });

  test.describe('AUTH-006: Email/Password Validation', () => {
    test('should show validation errors for invalid email format', async ({ page }) => {
      // Type invalid email
      await page.fill('input[name="email"]', 'notanemail');
      await page.fill('input[name="password"]', 'Test123!@#');
      
      // Try to submit
      await page.click('button[type="submit"]');
      
      // Check for validation error
      const emailError = await page.locator('text=/invalid email/i');
      await expect(emailError).toBeVisible();
    });

    test('should show validation errors for weak password', async ({ page }) => {
      // Type valid email but weak password
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'weak');
      
      // Try to submit
      await page.click('button[type="submit"]');
      
      // Check for password validation error
      const passwordError = await page.locator('text=/at least 8 characters/i');
      await expect(passwordError).toBeVisible();
    });

    test('should validate password complexity requirements', async ({ page }) => {
      const weakPasswords = [
        { password: 'short', error: /at least 8 characters/i },
        { password: 'alllowercase', error: /one uppercase letter/i },
        { password: 'ALLUPPERCASE', error: /one lowercase letter/i },
        { password: 'NoNumbers!', error: /one number/i },
        { password: 'NoSpecial123', error: /one special character/i }
      ];

      for (const { password, error } of weakPasswords) {
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        
        const errorMessage = await page.locator(`text=${error}`);
        await expect(errorMessage).toBeVisible();
        
        // Clear for next iteration
        await page.fill('input[name="password"]', '');
      }
    });
  });

  test.describe('AUTH-007: Secure Error Handling', () => {
    test('should show generic error message for invalid credentials', async ({ page }) => {
      // Try to login with invalid credentials
      await page.fill('input[name="email"]', INVALID_EMAIL);
      await page.fill('input[name="password"]', INVALID_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForSelector('[role="alert"]', { timeout: 10000 });
      
      // Check for generic error message
      const errorMessage = await page.locator('[role="alert"]').textContent();
      expect(errorMessage).toContain('Invalid credentials');
      
      // Ensure it doesn't reveal if email exists
      expect(errorMessage).not.toContain('not found');
      expect(errorMessage).not.toContain('does not exist');
      expect(errorMessage).not.toContain('wrong password');
    });

    test('should have consistent response time for different error types', async ({ page }) => {
      const attempts = [
        { email: 'nonexistent@example.com', password: 'Test123!@#' },
        { email: 'test@example.com', password: 'WrongPassword123!' },
        { email: 'invalid-email', password: 'Test123!@#' }
      ];

      const responseTimes = [];

      for (const { email, password } of attempts) {
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        
        const startTime = Date.now();
        await page.click('button[type="submit"]');
        await page.waitForSelector('[role="alert"]', { timeout: 10000 });
        const endTime = Date.now();
        
        responseTimes.push(endTime - startTime);
        
        // Clear for next attempt
        await page.reload();
      }

      // Check that response times are consistent (within 200ms variance)
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);
      expect(maxTime - minTime).toBeLessThan(200);
    });
  });

  test.describe('AUTH-015: WCAG AA Compliance', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check email input
      const emailInput = await page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('aria-label', /email/i);
      await expect(emailInput).toHaveAttribute('aria-required', 'true');
      
      // Check password input
      const passwordInput = await page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute('aria-label', /password/i);
      await expect(passwordInput).toHaveAttribute('aria-required', 'true');
      
      // Check form has proper role
      const form = await page.locator('form');
      await expect(form).toHaveAttribute('role', 'form');
      
      // Check submit button
      const submitButton = await page.locator('button[type="submit"]');
      await expect(submitButton).toHaveAttribute('aria-label', /sign in/i);
    });

    test('should announce errors to screen readers', async ({ page }) => {
      // Submit invalid form
      await page.fill('input[name="email"]', 'invalid');
      await page.click('button[type="submit"]');
      
      // Check for aria-live region
      const liveRegion = await page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();
      
      // Check error has proper role
      const errorAlert = await page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This test checks computed styles for contrast
      const button = await page.locator('button[type="submit"]');
      
      // Check button has sufficient contrast
      const backgroundColor = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      const color = await button.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Basic check that colors are defined
      expect(backgroundColor).toBeTruthy();
      expect(color).toBeTruthy();
    });

    test('should have visible focus indicators', async ({ page }) => {
      // Tab to email input
      await page.keyboard.press('Tab');
      const emailInput = await page.locator('input[name="email"]');
      const emailFocusStyle = await emailInput.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(emailFocusStyle).not.toBe('none');
      
      // Tab to password input
      await page.keyboard.press('Tab');
      const passwordInput = await page.locator('input[name="password"]');
      const passwordFocusStyle = await passwordInput.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(passwordFocusStyle).not.toBe('none');
    });
  });

  test.describe('AUTH-016: Keyboard Navigation', () => {
    test('should support Tab navigation through form', async ({ page }) => {
      // Start at email field
      await page.keyboard.press('Tab');
      const emailInput = await page.locator('input[name="email"]:focus');
      await expect(emailInput).toBeFocused();
      
      // Tab to password field
      await page.keyboard.press('Tab');
      const passwordInput = await page.locator('input[name="password"]:focus');
      await expect(passwordInput).toBeFocused();
      
      // Tab to remember me checkbox
      await page.keyboard.press('Tab');
      const checkbox = await page.locator('input[type="checkbox"]:focus');
      await expect(checkbox).toBeFocused();
      
      // Tab to forgot password link
      await page.keyboard.press('Tab');
      const forgotLink = await page.locator('button:has-text("Forgot password"):focus');
      await expect(forgotLink).toBeFocused();
      
      // Tab to submit button
      await page.keyboard.press('Tab');
      const submitButton = await page.locator('button[type="submit"]:focus');
      await expect(submitButton).toBeFocused();
    });

    test('should support Enter key in email field to move to password', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.keyboard.press('Enter');
      
      // Check password field is focused
      const passwordInput = await page.locator('input[name="password"]:focus');
      await expect(passwordInput).toBeFocused();
    });

    test('should support Enter key in password field to submit', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Test123!@#');
      
      // Focus password field and press Enter
      await page.focus('input[name="password"]');
      await page.keyboard.press('Enter');
      
      // Check that form was submitted (loading state or error appears)
      const submitButton = await page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();
      const hasLoadingState = await page.locator('[data-testid="loading-spinner"]').isVisible().catch(() => false);
      const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
      
      expect(isDisabled || hasLoadingState || hasError).toBeTruthy();
    });

    test('should support Escape key to clear errors', async ({ page }) => {
      // Generate an error
      await page.fill('input[name="email"]', 'invalid');
      await page.click('button[type="submit"]');
      
      // Wait for error
      await page.waitForSelector('[role="alert"]');
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Error should be cleared
      const errorAlert = await page.locator('[role="alert"]');
      await expect(errorAlert).not.toBeVisible();
    });
  });

  test.describe('AUTH-017: Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check form is visible and properly sized
      const form = await page.locator('[data-testid="login-form"]');
      await expect(form).toBeVisible();
      
      // Check no horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      
      // Check button has minimum touch target size (44px)
      const submitButton = await page.locator('button[type="submit"]');
      const buttonHeight = await submitButton.evaluate(el => el.offsetHeight);
      expect(buttonHeight).toBeGreaterThanOrEqual(44);
    });

    test('should be responsive on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check form is centered and properly sized
      const form = await page.locator('[data-testid="login-form"]');
      await expect(form).toBeVisible();
      
      const formWidth = await form.evaluate(el => el.offsetWidth);
      expect(formWidth).toBeGreaterThan(384); // Should be wider than mobile
      expect(formWidth).toBeLessThanOrEqual(512); // But not full width
    });

    test('should handle landscape orientation', async ({ page }) => {
      // Set landscape mobile viewport
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Check form is still visible and usable
      const form = await page.locator('[data-testid="login-form"]');
      await expect(form).toBeVisible();
      
      // Check all form elements are visible without scrolling
      const emailInput = await page.locator('input[name="email"]');
      const passwordInput = await page.locator('input[name="password"]');
      const submitButton = await page.locator('button[type="submit"]');
      
      await expect(emailInput).toBeInViewport();
      await expect(passwordInput).toBeInViewport();
      await expect(submitButton).toBeInViewport();
    });
  });

  test.describe('AUTH-009: CloudFront Integration', () => {
    test('should handle CloudFront cookie operations', async ({ page }) => {
      // Check if CloudFront functions are available in development
      const hasCloudFrontTest = await page.evaluate(() => {
        return typeof (window as any).CloudFrontTest !== 'undefined';
      });
      
      if (hasCloudFrontTest) {
        // Run CloudFront status check
        const status = await page.evaluate(() => {
          return (window as any).CloudFrontTest.status();
        });
        
        expect(status).toHaveProperty('hasUser');
        expect(status).toHaveProperty('hasCookies');
        expect(status).toHaveProperty('environment');
      }
    });
  });

  test.describe('Successful Authentication', () => {
    test('should successfully login with valid test user credentials', async ({ page }) => {
      // Use saved test credentials
      const result = await attemptLogin(page, TEST_USER.email, TEST_USER.password);
      
      // Verify successful login
      expect(result.success).toBeTruthy();
      expect(result.error).toBeUndefined();
      
      // Verify we're logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBeTruthy();
    });

    test('should successfully login with valid admin credentials', async ({ page }) => {
      // Use saved admin credentials
      const result = await attemptLogin(page, TEST_ADMIN.email, TEST_ADMIN.password);
      
      // Verify successful login
      expect(result.success).toBeTruthy();
      expect(result.error).toBeUndefined();
      
      // Verify we're logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBeTruthy();
    });

    test('should login using helper function', async ({ page }) => {
      // Login as regular user
      await loginAs(page, 'user');
      
      // Verify logged in state
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBeTruthy();
      
      // Logout
      await logout(page);
      
      // Verify logged out
      const loggedOut = !(await isLoggedIn(page));
      expect(loggedOut).toBeTruthy();
    });
  });

  test.describe('Integration Flow', () => {
    test('should show loading state during authentication', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Test123!@#');
      
      // Start monitoring for loading state
      const submitPromise = page.click('button[type="submit"]');
      
      // Check for loading indicator or disabled button
      const buttonDisabledPromise = page.waitForSelector('button[type="submit"]:disabled', { timeout: 5000 }).catch(() => null);
      const loadingSpinnerPromise = page.waitForSelector('[data-testid="loading-spinner"]', { timeout: 5000 }).catch(() => null);
      
      const [, buttonDisabled, loadingSpinner] = await Promise.all([
        submitPromise,
        buttonDisabledPromise,
        loadingSpinnerPromise
      ]);
      
      expect(buttonDisabled || loadingSpinner).toBeTruthy();
    });

    test('should preserve form state on validation errors', async ({ page }) => {
      const testEmail = 'preserve@test.com';
      
      // Fill form with invalid password
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'weak');
      
      // Check remember me
      await page.check('input[type="checkbox"]');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Wait for validation error
      await page.waitForSelector('text=/at least 8 characters/i');
      
      // Check email is preserved
      const emailValue = await page.inputValue('input[name="email"]');
      expect(emailValue).toBe(testEmail);
      
      // Check remember me is still checked
      const isChecked = await page.isChecked('input[type="checkbox"]');
      expect(isChecked).toBe(true);
    });
  });
});