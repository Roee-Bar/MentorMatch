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
 * Check if Firebase emulators are running and fully ready
 */
async function areEmulatorsRunning(): Promise<{ running: boolean; details: { ui: boolean; auth: boolean; firestore: boolean } }> {
  const details = {
    ui: false,
    auth: false,
    firestore: false,
  };

  // Check Emulator UI
  try {
    const uiCheck = await new Promise<boolean>((resolve) => {
      const req = http.get('http://localhost:4000', (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 302);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
    details.ui = uiCheck;
  } catch {
    details.ui = false;
  }

  // Check Auth Emulator
  try {
    const authCheck = await new Promise<boolean>((resolve) => {
      const req = http.get('http://localhost:9099', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json?.authEmulator?.ready === true);
          } catch {
            resolve(res.statusCode === 200);
          }
        });
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
    details.auth = authCheck;
  } catch {
    details.auth = false;
  }

  // Check Firestore Emulator
  try {
    const firestoreCheck = await new Promise<boolean>((resolve) => {
      const req = http.get('http://localhost:8081', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve(res.statusCode === 200 && (data.includes('Ok') || data.trim() === 'Ok'));
        });
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
    details.firestore = firestoreCheck;
  } catch {
    details.firestore = false;
  }

  const running = details.ui && details.auth && details.firestore;
  return { running, details };
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
  const emulatorStatus = await areEmulatorsRunning();
  if (!emulatorStatus.running) {
    console.error('❌ Firebase emulators are not fully ready!');
    console.error('   Status:');
    console.error(`   - Emulator UI (port 4000): ${emulatorStatus.details.ui ? '✓' : '✗'}`);
    console.error(`   - Auth Emulator (port 9099): ${emulatorStatus.details.auth ? '✓' : '✗'}`);
    console.error(`   - Firestore Emulator (port 8081): ${emulatorStatus.details.firestore ? '✓' : '✗'}`);
    console.error('');
    console.error('   To fix:');
    console.error('   1. Start emulators: npm run test:setup');
    console.error('   2. Wait for "✓ Firebase emulators are running!" message');
    console.error('   3. Verify manually:');
    console.error('      - curl http://localhost:4000 (Emulator UI)');
    console.error('      - curl http://localhost:9099 (Auth Emulator)');
    console.error('      - curl http://localhost:8081 (Firestore Emulator)');
    console.error('');
    console.error('   Continuing with tests - they will likely fail if emulators are not available.');
  } else if (verbose) {
    console.log('✓ Firebase emulators are running and ready');
    console.log('  - Emulator UI: ✓');
    console.log('  - Auth Emulator: ✓');
    console.log('  - Firestore Emulator: ✓');
  }
  
  if (verbose) {
    console.log('Global setup complete. Environment variables configured for emulator mode.');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
  }
}

export default globalSetup;
