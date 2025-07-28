import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/login|auth/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill login form
    await page.fill('input[type="email"]', 'shan@iotashan.com');
    await page.fill('input[type="password"]', 'Pagxyk-gecvov-1cucxy');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/admin/, { timeout: 10000 });
    
    // Should show admin content
    await expect(page.locator('h1, h2')).toContainText(/admin|dashboard/i);
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

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/admin');
    await page.fill('input[type="email"]', 'shan@iotashan.com');
    await page.fill('input[type="password"]', 'Pagxyk-gecvov-1cucxy');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    await page.waitForURL(/admin/);
    
    // Find and click logout button
    await page.click('button:has-text("Logout"), button:has-text("Sign Out"), .logout');
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/login|auth|^\/$|^\/$/);
  });
});