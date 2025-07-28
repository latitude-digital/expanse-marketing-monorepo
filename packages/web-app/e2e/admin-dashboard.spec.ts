import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    // Note: You'll need to handle authentication based on your setup
    await page.goto('/admin');
  });

  test('should display dashboard with all main elements', async ({ page }) => {
    // Wait for dashboard to load
    await page.getByTestId('admin-dashboard-container').waitFor();
    
    // Check main elements are present
    await expect(page.getByTestId('admin-dashboard-header-title')).toBeVisible();
    await expect(page.getByTestId('admin-dashboard-header-new-event-button')).toBeVisible();
    await expect(page.getByTestId('admin-dashboard-search-input')).toBeVisible();
    await expect(page.getByTestId('admin-dashboard-table')).toBeVisible();
  });

  test('should filter events correctly', async ({ page }) => {
    // Wait for dashboard to load
    await page.getByTestId('admin-dashboard-container').waitFor();
    
    // Test current events filter (should be active by default)
    await expect(page.getByTestId('admin-dashboard-filters-current-events-button')).toHaveCSS('background-color', 'rgb(25, 118, 210)');
    
    // Switch to past events
    await page.getByTestId('admin-dashboard-filters-past-events-button').click();
    await expect(page.getByTestId('admin-dashboard-filters-past-events-button')).toHaveCSS('background-color', 'rgb(25, 118, 210)');
    
    // Switch to future events
    await page.getByTestId('admin-dashboard-filters-future-events-button').click();
    await expect(page.getByTestId('admin-dashboard-filters-future-events-button')).toHaveCSS('background-color', 'rgb(25, 118, 210)');
  });

  test('should search events', async ({ page }) => {
    // Wait for dashboard to load
    await page.getByTestId('admin-dashboard-container').waitFor();
    
    // Type in search box
    await page.getByTestId('admin-dashboard-search-input').fill('test event');
    
    // Verify search value
    await expect(page.getByTestId('admin-dashboard-search-input')).toHaveValue('test event');
    
    // Clear search
    await page.getByTestId('admin-dashboard-search-clear-button').click();
    await expect(page.getByTestId('admin-dashboard-search-input')).toHaveValue('');
  });

  test('should navigate to new event creation', async ({ page }) => {
    // Wait for dashboard to load
    await page.getByTestId('admin-dashboard-container').waitFor();
    
    // Click new event button
    await page.getByTestId('admin-dashboard-header-new-event-button').click();
    
    // Should navigate to edit event page
    await expect(page).toHaveURL('/admin/event/new');
  });

  test('should handle loading states', async ({ page }) => {
    // This test would check loading states
    // In a real scenario, you might mock slow API responses
    
    await page.goto('/admin');
    
    // Check if loading indicator appears (might be too fast in development)
    const loadingElement = page.getByTestId('admin-dashboard-loading');
    
    // Wait for content to load
    await page.getByTestId('admin-dashboard-container').waitFor();
    
    // Ensure loading state is gone
    await expect(loadingElement).not.toBeVisible();
  });
});

test.describe('Admin Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to new event creation
    await page.goto('/admin/event/new');
  });

  test('should display event creation form', async ({ page }) => {
    // Wait for form to load
    await page.getByTestId('admin-edit-event-container').waitFor();
    
    // Check form fields are present
    await expect(page.getByTestId('admin-edit-event-form-id-input')).toBeVisible();
    await expect(page.getByTestId('admin-edit-event-form-name-input')).toBeVisible();
    await expect(page.getByTestId('admin-edit-event-form-start-date-input')).toBeVisible();
    await expect(page.getByTestId('admin-edit-event-form-end-date-input')).toBeVisible();
  });

  test('should create new event with valid data', async ({ page }) => {
    // Wait for form to load
    await page.getByTestId('admin-edit-event-container').waitFor();
    
    // Fill out required fields
    await page.getByTestId('admin-edit-event-form-id-input').fill('test-event-' + Date.now());
    await page.getByTestId('admin-edit-event-form-name-input').fill('Test Event Name');
    
    // Set dates (format: YYYY-MM-DD)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Next day
    
    await page.getByTestId('admin-edit-event-form-start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('admin-edit-event-form-end-date-input').fill(endDate.toISOString().split('T')[0]);
    
    // Submit form
    await page.getByTestId('admin-edit-event-form-save-button').click();
    
    // Should redirect to admin dashboard after successful creation
    await expect(page).toHaveURL('/admin');
  });

  test('should validate required fields', async ({ page }) => {
    // Wait for form to load
    await page.getByTestId('admin-edit-event-container').waitFor();
    
    // Try to submit without filling required fields
    await page.getByTestId('admin-edit-event-form-save-button').click();
    
    // Form should show validation errors (specific error checking depends on SurveyJS implementation)
    // For now, just ensure we're still on the same page
    await expect(page.getByTestId('admin-edit-event-container')).toBeVisible();
  });

  test('should enable conditional form sections', async ({ page }) => {
    // Wait for form to load
    await page.getByTestId('admin-edit-event-container').waitFor();
    
    // Test pre-registration checkbox
    await page.getByTestId('admin-edit-event-form-enable-pre-registration-checkbox').check();
    
    // Additional fields should become visible (specific field checking depends on SurveyJS conditional logic)
    
    // Test thank you email checkbox
    await page.getByTestId('admin-edit-event-form-send-thank-you-email-checkbox').check();
    
    // Auto checkout checkbox
    await page.getByTestId('admin-edit-event-form-enable-auto-checkout-checkbox').check();
  });
});

test.describe('Admin Event Management', () => {
  test('should edit existing event', async ({ page }) => {
    // This test assumes an event exists - you might need to create one first or mock data
    
    // Navigate to dashboard
    await page.goto('/admin');
    await page.getByTestId('admin-dashboard-container').waitFor();
    
    // Find and click on first event name link (this assumes at least one event exists)
    const firstEventLink = page.locator('[data-testid^="admin-dashboard-table-event-name-link-"]').first();
    
    if (await firstEventLink.isVisible()) {
      await firstEventLink.click();
      
      // Should navigate to edit page
      await page.getByTestId('admin-edit-event-container').waitFor();
      
      // Form should be populated with existing data
      await expect(page.getByTestId('admin-edit-event-form-name-input')).not.toHaveValue('');
    }
  });

  test('should access survey editing from event form', async ({ page }) => {
    // Navigate to edit event form
    await page.goto('/admin/event/new');
    await page.getByTestId('admin-edit-event-container').waitFor();
    
    // Fill required fields first
    await page.getByTestId('admin-edit-event-form-id-input').fill('test-survey-event');
    await page.getByTestId('admin-edit-event-form-name-input').fill('Test Survey Event');
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    await page.getByTestId('admin-edit-event-form-start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('admin-edit-event-form-end-date-input').fill(endDate.toISOString().split('T')[0]);
    
    // Click "Save and Edit Survey" button
    await page.getByTestId('admin-edit-event-form-save-and-edit-survey-button').click();
    
    // Should navigate to survey editing interface
    await expect(page).toHaveURL(/.*\/survey$/);
  });
});