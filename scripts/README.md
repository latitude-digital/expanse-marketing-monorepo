# E2E Test Scripts

This directory contains end-to-end test scripts for testing the application with Firebase emulators.

## Available Scripts

### 1. `test-e2e.sh` (Bash Script)
A simple bash script that sets up the environment and provides both manual and automated testing options.

**Usage:**
```bash
npm run test:e2e
# or directly:
./scripts/test-e2e.sh
```

**Features:**
- Automatically backs up and modifies `.env.development` for emulator mode
- Starts Firebase emulators (Auth, Firestore, Functions)
- Starts the web application
- Provides option to run automated tests or test manually
- Restores original environment settings when done

### 2. `test-e2e-playwright.js` (Automated Playwright Tests)
A Node.js script that runs automated E2E tests using Playwright.

**Usage:**
```bash
npm run test:e2e:auto
# or directly:
node ./scripts/test-e2e-playwright.js
```

**Features:**
- Fully automated test flow
- Creates test user in Auth emulator
- Creates test event with survey
- Takes the survey
- Verifies data in Firestore
- Visual browser automation (not headless by default)

### 3. `test-e2e-emulator.js` (Alternative Puppeteer Version)
An alternative implementation using Puppeteer (if you prefer it over Playwright).

**Prerequisites:**
```bash
npm install --save-dev puppeteer
```

## Test Flow

All scripts perform the following E2E test flow:

1. **Environment Setup**
   - Backs up current `.env.development`
   - Configures environment for emulator mode
   - Sets all emulator flags to `true`

2. **Service Startup**
   - Builds Firebase functions
   - Starts Firebase emulators (Auth, Firestore, Functions)
   - Starts web application dev server

3. **Test Execution**
   - Creates test user in Auth emulator
   - Logs into admin panel
   - Creates a new test event
   - Adds a survey question (First Name)
   - Takes the survey as an end user
   - Verifies data saved in Firestore

4. **Cleanup**
   - Stops all services
   - Restores original `.env.development`
   - Environment points back to cloud staging

## Manual Testing

When running `test:e2e` or `test:e2e:manual`, the script will:
1. Set up the environment
2. Start all services
3. Provide you with URLs to test manually:
   - Emulator UI: http://localhost:4002
   - Admin Panel: http://localhost:8002/admin
   - Survey: http://localhost:8002/s/[event-id]

Press `Ctrl+C` when done to clean up and restore settings.

## Environment Variables

The scripts automatically manage these environment variables:

```env
VITE_USE_FUNCTIONS_EMULATOR=true    # Use Functions emulator
VITE_USE_AUTH_EMULATOR=true         # Use Auth emulator
VITE_USE_FIRESTORE_EMULATOR=true    # Use Firestore emulator
VITE_FIREBASE_MODE=emulator         # Set Firebase to emulator mode
```

After tests complete, these are restored to their original values (typically pointing to cloud staging).

## Troubleshooting

### Port Conflicts
If you get port conflict errors, make sure no other services are running on:
- 4002 (Emulator UI)
- 5001 (Functions emulator)
- 8080 (Firestore emulator)
- 9099 (Auth emulator)
- 8002 (Web app dev server)

### Emulators Won't Start
1. Make sure Firebase CLI is installed: `npm install -g firebase-tools`
2. Check Firebase configuration: `firebase projects:list`
3. Ensure you're in the correct directory

### Tests Fail
1. Check the console output for specific error messages
2. Manually verify services are running at their URLs
3. Check that the `.env.development` file was properly modified
4. Ensure all dependencies are installed: `pnpm install`

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines. For headless execution:

```javascript
// In test-e2e-playwright.js, change:
const browser = await chromium.launch({ 
    headless: true,  // Set to true for CI
    slowMo: 0        // Remove slowMo for faster execution
});
```

## Notes

- Tests create temporary test data in the emulators only
- No production data is affected
- Original environment settings are always restored
- Emulator data is ephemeral and cleared when emulators stop