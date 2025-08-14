#!/usr/bin/env node

/**
 * End-to-End Test Script for Firebase Emulator
 * 
 * This script:
 * 1. Backs up current environment configuration
 * 2. Sets up emulator environment
 * 3. Starts Firebase emulators
 * 4. Runs E2E tests against the emulators
 * 5. Restores original environment configuration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const WEB_APP_PATH = path.join(PROJECT_ROOT, 'packages/web-app');
const FIREBASE_PATH = path.join(PROJECT_ROOT, 'packages/firebase');
const ENV_FILE = path.join(WEB_APP_PATH, '.env.development');
const ENV_BACKUP = path.join(WEB_APP_PATH, '.env.development.backup');

// Test configuration
const TEST_EVENT_ID = `test-event-${Date.now()}`;
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testPassword123!';
const EMULATOR_UI_URL = 'http://127.0.0.1:4002';
const WEB_APP_URL = 'http://localhost:8002';
const ADMIN_URL = `${WEB_APP_URL}/admin`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.blue}[Step ${step}]${colors.reset} ${message}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Backup and modify environment
function setupEnvironment() {
  logStep(1, 'Setting up emulator environment');
  
  // Backup current environment file
  log('Backing up .env.development file...');
  fs.copyFileSync(ENV_FILE, ENV_BACKUP);
  
  // Read current env file
  let envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  
  // Modify for emulator usage
  const emulatorConfig = [
    'VITE_USE_FUNCTIONS_EMULATOR=true',
    'VITE_USE_AUTH_EMULATOR=true', 
    'VITE_USE_FIRESTORE_EMULATOR=true',
    'VITE_FIREBASE_MODE=emulator'
  ];
  
  emulatorConfig.forEach(config => {
    const [key] = config.split('=');
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, config);
    } else {
      envContent += `\n${config}`;
    }
  });
  
  fs.writeFileSync(ENV_FILE, envContent);
  log('Environment configured for emulator usage', 'green');
}

// Restore original environment
function restoreEnvironment() {
  logStep('Cleanup', 'Restoring original environment');
  
  if (fs.existsSync(ENV_BACKUP)) {
    fs.copyFileSync(ENV_BACKUP, ENV_FILE);
    fs.unlinkSync(ENV_BACKUP);
    log('Original environment restored', 'green');
  }
}

// Start Firebase emulators
async function startEmulators() {
  logStep(2, 'Starting Firebase emulators');
  
  return new Promise((resolve, reject) => {
    const emulatorProcess = spawn('npm', ['run', 'emulator'], {
      cwd: FIREBASE_PATH,
      stdio: 'pipe'
    });
    
    let started = false;
    
    emulatorProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      if (output.includes('All emulators ready') && !started) {
        started = true;
        log('Emulators started successfully', 'green');
        resolve(emulatorProcess);
      }
    });
    
    emulatorProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    emulatorProcess.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        emulatorProcess.kill();
        reject(new Error('Emulators failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

// Start web app dev server
async function startWebApp() {
  logStep(3, 'Starting web application');
  
  return new Promise((resolve, reject) => {
    const webAppProcess = spawn('npm', ['run', 'dev'], {
      cwd: WEB_APP_PATH,
      stdio: 'pipe'
    });
    
    let started = false;
    
    webAppProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (!started) process.stdout.write(output);
      
      if (output.includes('Local:') && !started) {
        started = true;
        log('Web app started successfully', 'green');
        resolve(webAppProcess);
      }
    });
    
    webAppProcess.stderr.on('data', (data) => {
      if (!started) process.stderr.write(data);
    });
    
    webAppProcess.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        webAppProcess.kill();
        reject(new Error('Web app failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

// Create test user in Auth emulator
async function createTestUser(page) {
  logStep(4, 'Creating test user in Auth emulator');
  
  // Navigate to Auth emulator
  await page.goto(`${EMULATOR_UI_URL}/auth`);
  await sleep(2000);
  
  // Click Add User button
  const addUserButton = await page.$('button[aria-label="Add user"]');
  if (addUserButton) {
    await addUserButton.click();
    await sleep(1000);
    
    // Fill in user details
    await page.type('input[placeholder="Email"]', TEST_USER_EMAIL);
    await page.type('input[placeholder="Password"]', TEST_USER_PASSWORD);
    
    // Save user
    const saveButton = await page.$('button:has-text("Save")');
    if (saveButton) {
      await saveButton.click();
      log(`Test user created: ${TEST_USER_EMAIL}`, 'green');
    }
  }
}

// Run E2E tests
async function runE2ETests() {
  logStep(5, 'Running E2E tests');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Create test user
    await createTestUser(page);
    
    // Login to admin panel
    logStep(6, 'Logging into admin panel');
    await page.goto(`${ADMIN_URL}/login`);
    await sleep(2000);
    
    // Use email/password login
    await page.type('input[type="email"]', TEST_USER_EMAIL);
    await page.type('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await sleep(3000);
    
    // Create new event
    logStep(7, 'Creating test event');
    await page.goto(`${ADMIN_URL}/event/new`);
    await sleep(2000);
    
    // Fill event details
    await page.type('input[name="id"]', TEST_EVENT_ID);
    await page.type('input[name="name"]', `E2E Test Event ${Date.now()}`);
    
    // Set dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await page.type('input[name="startDate"]', today.toISOString().split('T')[0]);
    await page.type('input[name="endDate"]', tomorrow.toISOString().split('T')[0]);
    
    // Save event
    await page.click('button:has-text("Save")');
    await sleep(2000);
    
    // Add survey question
    logStep(8, 'Adding survey question');
    await page.goto(`${ADMIN_URL}/event/${TEST_EVENT_ID}/survey`);
    await sleep(3000);
    
    // Add First Name question
    const firstNameButton = await page.$('button:has-text("First Name")');
    if (firstNameButton) {
      await firstNameButton.click();
      await sleep(1000);
    }
    
    // Save survey
    const saveSurveyButton = await page.$('button:has-text("Save Survey")');
    if (saveSurveyButton) {
      await saveSurveyButton.click();
      await sleep(2000);
      log('Survey saved successfully', 'green');
    }
    
    // Take the survey
    logStep(9, 'Taking the survey');
    await page.goto(`${WEB_APP_URL}/s/${TEST_EVENT_ID}`);
    await sleep(3000);
    
    // Fill in first name
    await page.type('input[type="text"]', 'John');
    await sleep(500);
    
    // Submit survey
    await page.click('button:has-text("Complete")');
    await sleep(3000);
    
    // Check for success message
    const successMessage = await page.$('text=saved successfully');
    if (successMessage) {
      log('Survey submitted successfully!', 'green');
    } else {
      throw new Error('Survey submission failed');
    }
    
    // Verify in Firestore emulator
    logStep(10, 'Verifying data in Firestore');
    await page.goto(`${EMULATOR_UI_URL}/firestore/default/data/events/${TEST_EVENT_ID}/surveys`);
    await sleep(3000);
    
    // Check if survey document exists
    const surveyDoc = await page.$('a[href*="/surveys/"]');
    if (surveyDoc) {
      log('✅ Survey data verified in Firestore!', 'green');
      
      // Click to view details
      await surveyDoc.click();
      await sleep(2000);
      
      // Verify first_name field
      const firstNameField = await page.$('text="first_name:"');
      if (firstNameField) {
        log('✅ First name field found in survey document', 'green');
      }
    } else {
      throw new Error('Survey document not found in Firestore');
    }
    
    log('\n🎉 All E2E tests passed successfully!', 'green');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  let emulatorProcess = null;
  let webAppProcess = null;
  
  try {
    console.log(colors.blue + '\n=================================');
    console.log('   Firebase E2E Emulator Test');
    console.log('=================================' + colors.reset);
    
    // Setup environment
    setupEnvironment();
    
    // Build functions first
    logStep(1.5, 'Building Firebase functions');
    execCommand('npm run build', { cwd: FIREBASE_PATH });
    
    // Start emulators
    emulatorProcess = await startEmulators();
    
    // Start web app
    webAppProcess = await startWebApp();
    
    // Wait for services to be ready
    log('Waiting for services to stabilize...', 'yellow');
    await sleep(5000);
    
    // Run tests
    await runE2ETests();
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Cleanup
    log('\nCleaning up...', 'yellow');
    
    if (emulatorProcess) {
      emulatorProcess.kill();
      log('Emulators stopped', 'green');
    }
    
    if (webAppProcess) {
      webAppProcess.kill();
      log('Web app stopped', 'green');
    }
    
    // Restore environment
    restoreEnvironment();
    
    log('\n✅ Cleanup complete!', 'green');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\nInterrupted! Cleaning up...', 'yellow');
  restoreEnvironment();
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error(error);
  restoreEnvironment();
  process.exit(1);
});