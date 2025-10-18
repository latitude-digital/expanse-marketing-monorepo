#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VALID_ENVS = ['staging', 'production'];

function usage() {
  console.log('Usage: node scripts/fingerprint.js <check|update> [environment]');
  console.log('Environment defaults to APP_VARIANT or "production".');
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  const mode = (args[0] || '').toLowerCase();
  const envInput = args[1] || process.env.APP_VARIANT || 'production';
  const environment = envInput.toLowerCase();

  if (!['check', 'update'].includes(mode)) {
    console.error(`Invalid mode "${process.argv[2]}".`);
    usage();
    process.exit(1);
  }

  if (!VALID_ENVS.includes(environment)) {
    console.error(`Invalid environment "${envInput}". Expected one of: ${VALID_ENVS.join(', ')}`);
    process.exit(1);
  }

  const projectRoot = path.join(__dirname, '..');
  const fingerprintsPath = path.join(projectRoot, 'fingerprints.json');

  let fingerprints;
  try {
    const raw = fs.readFileSync(fingerprintsPath, 'utf8');
    fingerprints = JSON.parse(raw);
  } catch (error) {
    console.error(`Unable to read fingerprints file at ${fingerprintsPath}:`, error.message);
    process.exit(1);
  }

  let fingerprintJson;
  try {
    const output = execSync('npx --yes @expo/fingerprint fingerprint:generate --platform ios', {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    fingerprintJson = JSON.parse(output);
  } catch (error) {
    console.error('Failed to generate Expo fingerprint:', error.message);
    if (error.stdout) {
      console.error('stdout:', error.stdout.toString());
    }
    if (error.stderr) {
      console.error('stderr:', error.stderr.toString());
    }
    process.exit(1);
  }

  const currentHash = fingerprintJson?.hash;
  if (!currentHash) {
    console.error('Fingerprint generate command did not return a hash.');
    process.exit(1);
  }

  const stored = fingerprints[environment] || {};

  if (mode === 'check') {
    if (!stored.hash) {
      console.error(`No stored fingerprint found for ${environment}. Run a full build to establish one.`);
      process.exit(1);
    }

    if (stored.hash !== currentHash) {
      console.error('Fingerprint mismatch detected.');
      console.error(`Stored ${environment} hash: ${stored.hash}`);
      console.error(`Current hash: ${currentHash}`);
      console.error('Run a full native build to update fingerprints before attempting an EAS update.');
      process.exit(1);
    }

    console.log(`Fingerprint check passed for ${environment}.`);
    return;
  }

  const sourceCount = Array.isArray(fingerprintJson.sources)
    ? fingerprintJson.sources.length
    : undefined;

  fingerprints[environment] = {
    hash: currentHash,
    generatedAt: new Date().toISOString(),
    ...(sourceCount !== undefined ? { sourceCount } : {}),
  };

  try {
    fs.writeFileSync(fingerprintsPath, JSON.stringify(fingerprints, null, 2) + '\n');
  } catch (error) {
    console.error('Failed to update fingerprint file:', error.message);
    process.exit(1);
  }

  console.log(`Fingerprint updated for ${environment}. Hash: ${currentHash}`);
}

main();
