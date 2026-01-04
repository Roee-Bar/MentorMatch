/**
 * Global Setup for E2E Tests
 * 
 * Ensures environment variables are set before tests run.
 * This is critical for Firebase Admin SDK to connect to emulators.
 * 
 * Note: Firebase emulators should be started separately using `npm run test:setup`
 * or kept running during development.
 */

import { getTestEnvVars } from './config/env';
import * as http from 'http';

/**
 * Check if Firebase emulators are running
 */
async function areEmulatorsRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4000', (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 302);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function globalSetup() {
  // Unset NO_COLOR if FORCE_COLOR is set to prevent Node.js warnings
  if (process.env.FORCE_COLOR && process.env.NO_COLOR) {
    delete process.env.NO_COLOR;
  }
  
  // Set all test environment variables using centralized config
  const testEnvVars = getTestEnvVars();
  Object.assign(process.env, testEnvVars);
  
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  // In CI, assume emulators are started by workflow
  if (process.env.CI) {
    if (verbose) {
      console.log('CI mode detected - assuming emulators are started by CI workflow');
    }
    return;
  }
  
  // In local development, check if emulators are running and warn if not
  const emulatorsRunning = await areEmulatorsRunning();
  if (!emulatorsRunning) {
    console.warn('⚠️  Firebase emulators do not appear to be running.');
    console.warn('   Start them with: npm run test:setup');
    console.warn('   Or keep them running during development.');
    console.warn('   Continuing with tests - they may fail if emulators are not available.');
  } else if (verbose) {
    console.log('✓ Firebase emulators are running');
  }
  
  if (verbose) {
    console.log('Global setup complete. Environment variables configured for emulator mode.');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
  }
}

export default globalSetup;
