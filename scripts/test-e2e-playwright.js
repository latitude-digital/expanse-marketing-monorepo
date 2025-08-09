#!/usr/bin/env node

/**
 * End-to-End Test Script using Playwright
 * 
 * This script automates the complete E2E testing flow with Firebase emulators
 */

const { chromium } = require('playwright');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const WEB_APP_PATH = path.join(PROJECT_ROOT, 'packages/web-app');
const FIREBASE_PATH = path.join(PROJECT_ROOT, 'packages/firebase');
const ENV_FILE = path.join(WEB_APP_PATH, '.env.development');
const ENV_BACKUP = path.join(WEB_APP_PATH, '.env.development.backup');

// Test configuration
const TEST_EVENT_ID = `test-e2e-${Date.now()}`;
const TEST_EVENT_NAME = `E2E Test Event ${new Date().toISOString()}`;
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testPassword123!';
const EMULATOR_UI_URL = 'http://127.0.0.1:4002';
const WEB_APP_URL = 'http://localhost:8002';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}═══ Step ${step} ═══${colors.reset}\n${colors.blue}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Setup environment for emulator
function setupEmulatorEnvironment() {
  logStep(1, 'Configuring environment for emulator testing');
  
  // Backup current environment
  log('📁 Backing up current .env.development...');
  fs.copyFileSync(ENV_FILE, ENV_BACKUP);
  
  // Read and modify environment
  let envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  
  // Ensure emulator settings are enabled
  const updates = {
    'VITE_USE_FUNCTIONS_EMULATOR': 'true',
    'VITE_USE_AUTH_EMULATOR': 'true',
    'VITE_USE_FIRESTORE_EMULATOR': 'true',
    'VITE_FIREBASE_MODE': 'emulator'
  };
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    const newLine = `${key}=${value}`;
    
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  }
  
  fs.writeFileSync(ENV_FILE, envContent);
  log('✅ Environment configured for emulator mode', 'green');
}

// Restore original environment
function restoreOriginalEnvironment() {
  logStep('Final', 'Restoring original environment');
  
  if (fs.existsSync(ENV_BACKUP)) {
    fs.copyFileSync(ENV_BACKUP, ENV_FILE);
    fs.unlinkSync(ENV_BACKUP);
    log('✅ Original environment restored (pointing to cloud staging)', 'green');
  }
}

// Start Firebase emulators
async function startEmulators() {
  logStep(2, 'Starting Firebase emulators');
  
  return new Promise((resolve, reject) => {
    const emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'functions,firestore,auth'], {
      cwd: FIREBASE_PATH,
      stdio: 'pipe'
    });
    
    let ready = false;
    
    emulatorProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('All emulators ready') && !ready) {
        ready = true;
        log('✅ Firebase emulators are ready!', 'green');
        resolve(emulatorProcess);
      }
    });
    
    emulatorProcess.stderr.on('data', (data) => {
      if (data.toString().includes('Error')) {
        console.error(data.toString());
      }
    });
    
    // Timeout protection
    setTimeout(() => {
      if (!ready) {
        emulatorProcess.kill();
        reject(new Error('Emulators failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

// Start web application
async function startWebApp() {
  logStep(3, 'Starting web application');
  
  return new Promise((resolve, reject) => {
    const webProcess = spawn('npm', ['run', 'dev'], {
      cwd: WEB_APP_PATH,
      stdio: 'pipe'
    });
    
    let ready = false;
    
    webProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('8002') && !ready) {
        ready = true;
        log('✅ Web application is running!', 'green');
        resolve(webProcess);
      }
    });
    
    webProcess.stderr.on('data', (data) => {
      if (data.toString().includes('Error')) {
        console.error(data.toString());
      }
    });
    
    // Timeout protection
    setTimeout(() => {
      if (!ready) {
        webProcess.kill();
        reject(new Error('Web app failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

// Main E2E test flow
async function runE2ETest() {
  logStep(4, 'Running E2E test flow');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Create test user in Auth emulator
    log('\n📋 Creating test user in Auth emulator...');
    await page.goto(`${EMULATOR_UI_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    // Try to add user (might already exist)
    try {
      await page.click('button[aria-label="Add user"]', { timeout: 5000 });
      await page.fill('input[placeholder="Email"]', TEST_USER_EMAIL);
      await page.fill('input[placeholder="Password"]', TEST_USER_PASSWORD);
      await page.click('button:has-text("Save")');
      log('✅ Test user created', 'green');
    } catch (e) {
      log('ℹ️  User might already exist, continuing...', 'yellow');
    }
    
    // Step 2: Login to admin panel
    log('\n📋 Logging into admin panel...');
    await page.goto(`${WEB_APP_URL}/admin/login`);
    await page.waitForLoadState('networkidle');
    
    // Login with email/password
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForURL('**/admin', { timeout: 10000 });
    log('✅ Logged in successfully', 'green');
    
    // Step 3: Create new event
    log('\n📋 Creating test event...');
    await page.goto(`${WEB_APP_URL}/admin/event/new`);
    await page.waitForLoadState('networkidle');
    
    // Fill event details
    await page.fill('input[placeholder="Event ID"]', TEST_EVENT_ID);
    await page.fill('input[placeholder="Event Name"]', TEST_EVENT_NAME);
    
    // Set dates (today to tomorrow)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    await page.fill('input[type="date"]:first-of-type', today);
    await page.fill('input[type="date"]:last-of-type', tomorrow);
    
    // Save event
    await page.click('button:has-text("Save Event")');
    await sleep(2000);
    log('✅ Event created', 'green');
    
    // Step 4: Add survey question
    log('\n📋 Adding survey question...');
    await page.goto(`${WEB_APP_URL}/admin/event/${TEST_EVENT_ID}/survey`);
    await page.waitForLoadState('networkidle');
    await sleep(2000);
    
    // Add First Name question
    await page.click('button:has-text("First Name")');
    await sleep(1000);
    
    // Save survey
    await page.click('button:has-text("Save Survey")');
    await page.waitForSelector('text=Saved', { timeout: 5000 });
    log('✅ Survey question added', 'green');
    
    // Step 5: Take the survey
    log('\n📋 Taking the survey as end user...');
    await page.goto(`${WEB_APP_URL}/s/${TEST_EVENT_ID}`);
    await page.waitForLoadState('networkidle');
    await sleep(2000);
    
    // Fill in the first name
    await page.fill('input[type="text"]', 'John');
    await sleep(500);
    
    // Submit survey
    await page.click('button:has-text("Complete")');
    
    // Wait for success message
    await page.waitForSelector('text=saved successfully', { timeout: 10000 });
    log('✅ Survey submitted successfully', 'green');
    
    // Step 6: Verify in Firestore emulator
    log('\n📋 Verifying data in Firestore emulator...');
    await page.goto(`${EMULATOR_UI_URL}/firestore/default/data`);
    await sleep(2000);
    
    // Navigate to the survey data
    await page.click('button[aria-label="edit"]');
    await page.fill('input[placeholder="Document path"]', `events/${TEST_EVENT_ID}/surveys`);
    await page.keyboard.press('Enter');
    await sleep(2000);
    
    // Check if survey document exists
    const surveyDocs = await page.$$('a[href*="/surveys/"]');
    if (surveyDocs.length > 0) {
      log('✅ Survey document found in Firestore!', 'green');
      
      // Click on the first survey document
      await surveyDocs[0].click();
      await sleep(1000);
      
      // Verify first_name field exists
      const hasFirstName = await page.isVisible('text="first_name:"');
      if (hasFirstName) {
        log('✅ First name field verified in document!', 'green');
      }
    } else {
      throw new Error('No survey documents found in Firestore');
    }
    
    log('\n🎉 All E2E tests passed successfully!', 'green');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  let emulatorProcess = null;
  let webAppProcess = null;
  
  console.log(colors.cyan + '\n╔════════════════════════════════════╗');
  console.log('║   Firebase E2E Test with Emulator   ║');
  console.log('╚════════════════════════════════════╝' + colors.reset);
  
  try {
    // Setup environment
    setupEmulatorEnvironment();
    
    // Build functions
    log('\n🔨 Building Firebase functions...');
    execSync('npm run build', { cwd: FIREBASE_PATH, stdio: 'inherit' });
    
    // Start services
    emulatorProcess = await startEmulators();
    webAppProcess = await startWebApp();
    
    // Wait for services to stabilize
    log('\n⏳ Waiting for services to stabilize...', 'yellow');
    await sleep(5000);
    
    // Run E2E tests
    await runE2ETest();
    
    log('\n✨ E2E test completed successfully!', 'green');
    
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    process.exitCode = 1;
  } finally {
    // Cleanup
    log('\n🧹 Cleaning up...', 'yellow');
    
    if (emulatorProcess) {
      emulatorProcess.kill('SIGTERM');
      log('  → Emulators stopped', 'green');
    }
    
    if (webAppProcess) {
      webAppProcess.kill('SIGTERM');
      log('  → Web app stopped', 'green');
    }
    
    // Restore original environment
    restoreOriginalEnvironment();
    
    log('\n👍 All done!', 'green');
  }
}

// Handle interruption
process.on('SIGINT', () => {
  log('\n\n⚠️  Interrupted! Cleaning up...', 'yellow');
  restoreOriginalEnvironment();
  process.exit(130);
});

// Run the test
main().catch(error => {
  console.error('Unexpected error:', error);
  restoreOriginalEnvironment();
  process.exit(1);
});