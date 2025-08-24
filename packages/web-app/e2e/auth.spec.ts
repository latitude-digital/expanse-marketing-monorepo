import { test, expect } from '@playwright/test';

// Test credentials - these should be set up in the database with appropriate roles
const TEST_USERS = {
  admin: {
    email: 'testadmin@expanse.demo',
    password: 'TestAdmin123!@#'
  },
  regular: {
    email: 'testuser@expanse.demo', 
    password: 'TestUser123!@#'
  }
};

test.describe('Authentication Flow', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/login|auth/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should allow admin users to access admin routes', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill login form with admin credentials
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/admin/, { timeout: 15000 });
    
    // Should not show access denied or login form
    const hasAccessDenied = await page.locator('text=Access Denied').isVisible({ timeout: 3000 }).catch(() => false);
    const hasLoginForm = await page.locator('input[type="email"]').isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasAccessDenied).toBeFalsy();
    expect(hasLoginForm).toBeFalsy();
  });

  test('should restrict admin routes for regular users', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill login form with regular user credentials  
    await page.fill('input[type="email"]', TEST_USERS.regular.email);
    await page.fill('input[type="password"]', TEST_USERS.regular.password);
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Should be logged in but see access denied for admin route
    await page.waitForURL(/admin/, { timeout: 15000 });
    
    // Should show access denied message
    await expect(page.locator('text=Access Denied')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Administrator privileges required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('.error, [role="alert"], .alert-error')).toBeVisible();
  });

  test('should allow access to non-admin protected routes for authenticated users', async ({ page }) => {
    // Test a regular protected route that doesn't require admin
    await page.goto('/s/test123/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/);
    
    // Login with regular user
    await page.fill('input[type="email"]', TEST_USERS.regular.email);
    await page.fill('input[type="password"]', TEST_USERS.regular.password);
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Should redirect to the protected route
    await page.waitForURL(/\/s\/test123\/dashboard/, { timeout: 15000 });
    
    // Should not show login form
    const hasLoginForm = await page.locator('input[type="email"]').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasLoginForm).toBeFalsy();
  });
});