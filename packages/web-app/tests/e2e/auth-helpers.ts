import { Page } from '@playwright/test';
import testCredentials from './test-credentials.json';

/**
 * Authentication helper functions for Playwright tests
 */

export interface TestUser {
  email: string;
  password: string;
  role: 'user' | 'admin';
  displayName: string;
  description: string;
}

export const TEST_USERS = {
  regularUser: testCredentials.testUser as TestUser,
  adminUser: testCredentials.testAdmin as TestUser
};

/**
 * Login helper function for Playwright tests
 * @param page - Playwright page object
 * @param userType - Type of user to login as ('user' or 'admin')
 * @returns Promise that resolves when login is complete
 */
export async function loginAs(page: Page, userType: 'user' | 'admin' = 'user'): Promise<void> {
  const user = userType === 'admin' ? TEST_USERS.adminUser : TEST_USERS.regularUser;
  
  // Navigate to login page
  await page.goto('/auth');
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Wait for navigation or success indication
  await Promise.race([
    page.waitForURL(/dashboard|home/, { timeout: 10000 }),
    page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 })
  ]).catch(() => {
    // If login fails, the error will be visible on the page
    console.log(`Login attempt for ${user.email} completed`);
  });
}

/**
 * Logout helper function
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu if it exists
  const userMenu = await page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    await userMenu.click();
    
    // Click logout button
    const logoutButton = await page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
  
  // Confirm we're back at login page
  await page.waitForURL(/auth|login|welcome/, { timeout: 5000 }).catch(() => {
    // Fallback: navigate directly to logout
    return page.goto('/auth');
  });
}

/**
 * Check if user is logged in
 * @param page - Playwright page object
 * @returns Promise<boolean> - true if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for common indicators of being logged in
  const indicators = [
    page.locator('[data-testid="user-menu"]'),
    page.locator('[data-testid="logout-button"]'),
    page.locator('.user-profile'),
    page.locator('[aria-label="User menu"]')
  ];
  
  for (const indicator of indicators) {
    if (await indicator.isVisible().catch(() => false)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get test credentials for direct use in tests
 */
export function getTestCredentials(userType: 'user' | 'admin' = 'user') {
  return userType === 'admin' ? TEST_USERS.adminUser : TEST_USERS.regularUser;
}

/**
 * Perform login with error handling
 * @param page - Playwright page object
 * @param email - Email to use for login
 * @param password - Password to use for login
 * @returns Promise<{success: boolean, error?: string}>
 */
export async function attemptLogin(
  page: Page, 
  email: string, 
  password: string
): Promise<{success: boolean, error?: string}> {
  try {
    // Navigate to login page
    await page.goto('/auth');
    
    // Wait for form
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
    
    // Fill credentials
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for response
    const response = await Promise.race([
      // Success: navigation away from login
      page.waitForURL((url) => !url.pathname.includes('auth'), { timeout: 5000 })
        .then(() => ({ success: true })),
      
      // Error: error message appears
      page.waitForSelector('[role="alert"]', { timeout: 5000 })
        .then(async () => {
          const errorText = await page.locator('[role="alert"]').textContent();
          return { success: false, error: errorText || 'Unknown error' };
        })
    ]);
    
    return response;
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    };
  }
}