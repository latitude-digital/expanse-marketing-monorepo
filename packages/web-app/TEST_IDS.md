# Admin Test IDs for Playwright Testing

This document outlines the test ID naming conventions and patterns used throughout the admin interface to support Playwright automated testing.

## Naming Convention

**Pattern**: `data-testid="admin-{screen}-{section}-{element}-{action}"`

### Examples:
- `admin-dashboard-header-new-event-button`
- `admin-dashboard-filters-current-events-button`
- `admin-dashboard-table-event-name-link`
- `admin-edit-event-form-name-input`
- `admin-edit-event-form-save-button`

## Admin Dashboard Test IDs

### Container & Layout
- `admin-dashboard-container` - Main dashboard wrapper
- `admin-dashboard-loading` - Loading state indicator
- `admin-dashboard-error` - Error state display

### Header Section
- `admin-dashboard-header-title` - "Events" page title
- `admin-dashboard-header-new-event-button` - "New Event" button

### Search & Filters
- `admin-dashboard-search-input` - Quick filter search box
- `admin-dashboard-search-clear-button` - Clear search button
- `admin-dashboard-filters-current-events-button` - Current events filter
- `admin-dashboard-filters-past-events-button` - Past events filter  
- `admin-dashboard-filters-future-events-button` - Future events filter

### Data Table
- `admin-dashboard-table` - AG Grid table container
- `admin-dashboard-table-event-name-link-{eventId}` - Event name links (dynamic ID)
- `admin-dashboard-table-event-id-link-{eventId}` - Event ID links (dynamic ID)
- `admin-dashboard-table-checkin-link-{eventId}` - Check-in action links (dynamic ID)
- `admin-dashboard-table-checkout-link-{eventId}` - Check-out action links (dynamic ID)

## Edit Event Screen Test IDs

### Container & Layout
- `admin-edit-event-container` - Main edit form wrapper
- `admin-edit-event-loading` - Loading state for edit screen

### Form Fields
- `admin-edit-event-form-id-input` - Event ID input field
- `admin-edit-event-form-name-input` - Event name input field
- `admin-edit-event-form-start-date-input` - Start date picker
- `admin-edit-event-form-end-date-input` - End date picker
- `admin-edit-event-form-ford-event-id-input` - Ford Event ID field

### Checkbox Fields
- `admin-edit-event-form-enable-pre-registration-checkbox` - Enable pre-registration toggle
- `admin-edit-event-form-send-thank-you-email-checkbox` - Send thank you email toggle
- `admin-edit-event-form-enable-auto-checkout-checkbox` - Enable auto check-out toggle

### Action Buttons
- `admin-edit-event-form-save-button` - Main save button
- `admin-edit-event-form-save-and-edit-survey-button` - Save and edit survey button

## Playwright Usage Examples

### Basic Element Selection
```typescript
// Select by test ID
await page.getByTestId('admin-dashboard-header-new-event-button').click();

// Alternative using locator
await page.locator('[data-testid="admin-dashboard-search-input"]').fill('test event');
```

### Dynamic Test IDs
```typescript
// For elements with dynamic IDs (like event-specific links)
const eventId = 'my-event-123';
await page.getByTestId(`admin-dashboard-table-event-name-link-${eventId}`).click();
```

### Form Interactions
```typescript
// Fill out event creation form
await page.getByTestId('admin-edit-event-form-name-input').fill('New Test Event');
await page.getByTestId('admin-edit-event-form-start-date-input').fill('2024-01-15');
await page.getByTestId('admin-edit-event-form-end-date-input').fill('2024-01-16');

// Submit form
await page.getByTestId('admin-edit-event-form-save-button').click();
```

### Filtering and Search
```typescript
// Test search functionality
await page.getByTestId('admin-dashboard-search-input').fill('conference');

// Test event filters
await page.getByTestId('admin-dashboard-filters-past-events-button').click();
await page.getByTestId('admin-dashboard-filters-current-events-button').click();
```

### Waiting and Assertions
```typescript
// Wait for loading to complete
await page.getByTestId('admin-dashboard-loading').waitFor({ state: 'hidden' });

// Assert table is visible
await expect(page.getByTestId('admin-dashboard-table')).toBeVisible();

// Assert form fields are filled correctly
await expect(page.getByTestId('admin-edit-event-form-name-input')).toHaveValue('Test Event');
```

### Error Handling
```typescript
// Check for error states
const errorElement = page.getByTestId('admin-dashboard-error');
if (await errorElement.isVisible()) {
    console.log('Dashboard error detected');
}
```

## Best Practices

### 1. Consistent Naming
- Always follow the `admin-{screen}-{section}-{element}-{action}` pattern
- Use kebab-case for all parts
- Be descriptive but concise

### 2. Dynamic IDs
- For elements that appear multiple times (like table rows), append the unique identifier
- Use meaningful identifiers when possible (event ID, user ID, etc.)

### 3. State-Dependent Elements
- Elements that only appear in certain states should have descriptive test IDs
- Examples: loading states, error messages, conditional form fields

### 4. Maintainability
- Keep test IDs semantic and descriptive of functionality, not implementation
- Update test IDs if component functionality changes significantly
- Document any complex test ID patterns in this file

## Testing Scenarios Supported

### Dashboard Testing
- ✅ Event listing and pagination
- ✅ Search and filtering functionality
- ✅ Event navigation and actions
- ✅ Loading and error states

### Event Management Testing  
- ✅ Event creation workflow
- ✅ Event editing and updates
- ✅ Form validation and error handling
- ✅ Survey configuration access

### Integration Testing
- ✅ Navigation between admin screens
- ✅ Data persistence and reload
- ✅ Permission and authentication flows

## Implementation Notes

- **SurveyJS Integration**: Edit Event form uses SurveyJS, so test IDs are added via `inputId` properties and `onAfterRenderQuestion` callbacks
- **AG Grid**: Dashboard table uses AG Grid, with test IDs added to custom cell renderers
- **Dynamic Content**: Some test IDs include dynamic parts (like event IDs) for unique identification
- **Async Loading**: Loading states have dedicated test IDs to support proper waiting in tests

## Future Enhancements

- Add test IDs to survey editing interface
- Include test IDs in email template management
- Add test IDs to user management screens (when implemented)
- Consider adding test IDs to modal dialogs and confirmation popups