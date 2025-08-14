# E2E Authentication Tests

This directory contains comprehensive end-to-end tests for the authentication system using Playwright.

## Test Coverage (AUTH-020)

### ✅ Login Flow Tests
- **Successful login** with valid user/admin credentials
- **Failed login** with invalid credentials  
- **Form validation** for email format and password strength
- **Loading states** during authentication
- **Form state preservation** on validation errors

### ✅ Remember Me Functionality  
- **Session persistence** when remember me is checked
- **Session cleanup** when remember me is unchecked
- **Cross-browser session** behavior testing

### ✅ Redirect Functionality
- **Redirect to original URL** after successful login
- **Default redirect** to home page when no return URL
- **Encoded return URL** handling
- **Protected route access** control

### ✅ Logout Functionality
- **Complete logout** process and state cleanup
- **Cross-tab logout** synchronization  
- **URL parameter logout** handling
- **Authentication state cleanup**

### ✅ Password Reset Flow
- **Forgot password form** submission
- **Success/error message** handling (secure, non-revealing)
- **Email validation** in reset form
- **Navigation flows** between login and reset

### ✅ Protected Routes Testing
- **Unauthenticated access** redirects to login
- **Authenticated user access** to user routes
- **Admin route protection** (admin users only)
- **Return URL preservation** for protected routes

### ✅ Session Management
- **Session timeout warnings** (when enabled)
- **Session extension** functionality
- **Automatic logout** on timeout
- **Cross-tab session** synchronization

### ✅ Error Recovery & Edge Cases
- **Network error** handling
- **Malformed credential** handling  
- **Error message** clearing on new input
- **Browser compatibility** across Chrome, Firefox, Safari

## Test Users

The tests use predefined test users from `createTestUsers.ts`:

```typescript
// Regular user account
testuser@expanse.demo / TestUser123!@#

// Admin user account  
testadmin@expanse.demo / TestAdmin123!@#
```

## Prerequisites

1. **Development server** running on port 8001:
   ```bash
   pnpm dev
   ```

2. **Test users created** in Firebase Auth:
   ```javascript
   // In browser console:
   createTestUsers()
   ```

3. **Playwright installed**:
   ```bash
   npx playwright install
   ```

## Running Tests

### Quick Start
```bash
# Run auth tests only
npx playwright test tests/e2e/auth.spec.ts

# Run with HTML reporter
npx playwright test tests/e2e/auth.spec.ts --reporter=html

# Run using helper script
./scripts/run-auth-e2e-tests.sh
```

### Advanced Options
```bash
# Run specific test group
npx playwright test -g "Login Flow Tests"

# Run in headed mode (see browser)
npx playwright test tests/e2e/auth.spec.ts --headed

# Run on specific browser
npx playwright test tests/e2e/auth.spec.ts --project=chromium

# Debug mode
npx playwright test tests/e2e/auth.spec.ts --debug

# Run with UI mode
npx playwright test tests/e2e/auth.spec.ts --ui
```

### Mobile Testing
```bash
# Test on mobile viewports
npx playwright test tests/e2e/auth.spec.ts --project="Mobile Chrome"
npx playwright test tests/e2e/auth.spec.ts --project="Mobile Safari"
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:8001`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome/Safari
- **Reports**: HTML, JSON, JUnit

## Helper Functions

The tests use helper functions for maintainability:

```typescript
// Navigation helpers
navigateToLogin(page, returnUrl?)
waitForLogin(page)
waitForLogout(page)

// Authentication helpers  
loginAs(page, 'regular' | 'admin', rememberMe?)
logout(page)
isLoggedIn(page)

// Form helpers
fillLoginForm(page, email, password, rememberMe?)
submitLoginForm(page)
```

## Test Structure

```
tests/e2e/
├── auth.spec.ts           # Main auth test suite
├── auth.integration.spec.ts # Legacy integration tests  
├── auth-helpers.ts        # Reusable helper functions
├── test-credentials.json  # Test user credentials
└── README.md             # This file
```

## Debugging Tests

### View Test Results
```bash
# Open HTML report
npx playwright show-report

# View specific test run
npx playwright show-report test-results/
```

### Debug Failed Tests
```bash
# Run single test with debug
npx playwright test -g "should login with valid credentials" --debug

# Take screenshot on failure (configured by default)
# Screenshots saved to test-results/

# Record video on failure (configured by default)  
# Videos saved to test-results/
```

### Test Data Inspection
```javascript
// In browser DevTools console during test:
localStorage.getItem('authToken')
sessionStorage.getItem('userData')  
document.cookie
```

## CI/CD Integration

Tests are integrated with the CI/CD pipeline:

```bash
# Run in CI environment
npm run test:e2e

# Run with GitHub Actions
# See .github/workflows/e2e-tests.yml
```

### CI Configuration
- **Headless mode**: Always in CI
- **Parallel execution**: Disabled in CI for stability
- **Retry logic**: 2 retries on failure
- **Artifacts**: Screenshots, videos, HTML reports

## Security Considerations

The tests follow security best practices:

1. **No real credentials** in code (uses test accounts)
2. **Generic error messages** tested (no user enumeration)
3. **Session security** validated across tabs
4. **HTTPS behavior** tested where applicable
5. **Rate limiting** considerations (consistent timing)

## Performance Testing

Tests include performance considerations:

- **Loading state validation** (user experience)
- **Response time consistency** (security)
- **Cross-tab synchronization** timing
- **Network error recovery** performance

## Accessibility Testing

While primarily focused on functionality, tests also verify:

- **Keyboard navigation** support
- **ARIA attributes** presence  
- **Screen reader compatibility** (role attributes)
- **Focus management** during flows

## Known Limitations

1. **Session timeout tests** are slow (5-30 minute timeouts)
   - Marked as slow/skipped in CI
   - Consider mocked timers for faster testing

2. **Cross-tab testing** has timing dependencies
   - Brief delays added for event synchronization
   - May be flaky in very slow environments

3. **Network error simulation** is limited
   - Uses Playwright route mocking
   - May not capture all real-world scenarios

4. **Firebase emulator** not used by default
   - Tests run against live Firebase
   - Consider emulator for more isolated testing

## Maintenance

### Adding New Tests
1. Follow existing helper function patterns
2. Use descriptive test names and comments
3. Include both positive and negative test cases
4. Add appropriate timeouts and error handling

### Updating Test Users
```javascript
// Update credentials in createTestUsers.ts
// Then recreate users:
createTestUsers()
```

### Browser Compatibility
- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari/WebKit**: Full support (some timing differences)
- **Mobile browsers**: Supported via device emulation

## Troubleshooting

### Common Issues

**"Login form not found"**
```bash
# Check dev server is running
curl http://localhost:8001
# Start server: pnpm dev
```

**"Test users not found"**
```javascript
// Create test users in browser console:
createTestUsers()
```

**"Tests timeout"**
```bash
# Increase timeout in test
test.setTimeout(60000); // 60 seconds

# Or run with longer timeout
npx playwright test --timeout=60000
```

**"Cross-tab tests flaky"**
```bash
# Run with more workers for isolation
npx playwright test --workers=1
```

### Getting Help

1. Check the [Playwright documentation](https://playwright.dev)
2. Review existing test patterns in the codebase
3. Check CI logs for environment-specific issues
4. Use `--debug` mode to step through tests interactively

---

## Test Metrics

- **Total test cases**: 30+
- **Test coverage areas**: 8 major flows
- **Browser coverage**: 5 configurations
- **Mobile coverage**: 2 devices
- **Estimated run time**: 5-15 minutes
- **Maintenance effort**: Low (helper functions abstract complexity)

This comprehensive test suite ensures robust authentication functionality across all supported platforms and use cases.