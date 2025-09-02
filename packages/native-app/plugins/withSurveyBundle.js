/**
 * Expo Config Plugin - Survey Bundle Builder
 * Ensures the survey bundle is built before any Expo process
 */

const { withPlugins, withDangerousMod } = require('@expo/config-plugins');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function withSurveyBundle(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      await buildSurveyBundle();
      return config;
    },
  ]);
}

async function buildSurveyBundle() {
  console.log('🔨 [Expo Plugin] Building offline survey bundle...');
  
  const scriptPath = path.join(__dirname, '../scripts/build-survey.js');
  
  if (!fs.existsSync(scriptPath)) {
    console.warn('⚠️  Survey build script not found, skipping survey bundle build');
    return;
  }
  
  try {
    execSync(`node ${scriptPath}`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (error) {
    console.error('❌ [Expo Plugin] Failed to build survey bundle:', error.message);
    // Don't fail the entire build if survey bundle fails
    console.warn('⚠️  Continuing without survey bundle update...');
  }
}

module.exports = withSurveyBundle;