#!/usr/bin/env node

/**
 * Build Survey Bundle Script
 * Automatically rebuilds the survey bundle before Expo builds
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building offline survey bundle...');

const webAppPath = path.join(__dirname, '../../web-app');
const surveyBundlePath = path.join(__dirname, '../assets/survey/offline-survey.html');

// Check if the web-app directory exists
if (!fs.existsSync(webAppPath)) {
  console.error('❌ web-app directory not found at:', webAppPath);
  process.exit(1);
}

try {
  // Change to web-app directory and build
  console.log('📦 Running survey build in web-app directory...');
  
  // Try to detect package manager (npm for EAS, pnpm for local)
  let buildCommand;
  const isEASBuild = process.env.EAS_BUILD === 'true';
  
  if (isEASBuild || !fs.existsSync(path.join(webAppPath, '../../pnpm-lock.yaml'))) {
    // Use npm for EAS builds or when pnpm-lock doesn't exist
    console.log('Using npm for build (EAS or no pnpm-lock found)');
    buildCommand = 'npm run build:survey-offline';
  } else {
    // Use pnpm for local builds when available
    console.log('Using pnpm for build (local development)');
    buildCommand = 'pnpm run build:survey-offline';
  }
  
  execSync(buildCommand, {
    cwd: webAppPath,
    stdio: 'inherit'
  });
  
  // Verify the bundle was created
  if (fs.existsSync(surveyBundlePath)) {
    const stats = fs.statSync(surveyBundlePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Survey bundle built successfully (${sizeMB} MB)`);
    console.log(`📍 Location: ${surveyBundlePath}`);
  } else {
    console.error('❌ Survey bundle was not created at expected location');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Failed to build survey bundle:', error.message);
  process.exit(1);
}

console.log('✨ Survey bundle build complete!');