/**
 * Global Setup for E2E Tests
 * 
 * Ensures environment variables are set before tests run.
 * This is critical for Firebase Admin SDK to connect to emulators.
 * Also starts Firebase emulators if they're not already running.
 */

import { spawn, ChildProcess } from 'child_process';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

let emulatorProcess: ChildProcess | null = null;
const EMULATOR_PID_FILE = path.join(process.cwd(), '.emulator-pid');

/**
 * Check if a port is in use
 */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    server.on('error', () => resolve(true));
  });
}

/**
 * Check if Firebase emulators are already running
 */
async function areEmulatorsRunning(): Promise<boolean> {
  // Check if emulator UI port (4000) is in use
  const uiPortInUse = await isPortInUse(4000);
  if (uiPortInUse) {
    // Port is in use, check if it's actually the emulator UI
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
  return false;
}

/**
 * Wait for emulators to be ready
 */
async function waitForEmulators(maxAttempts = 60, delayMs = 2000): Promise<void> {
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const isReady = await new Promise<boolean>((resolve) => {
        const req = http.get('http://localhost:4000', (res) => {
          resolve(res.statusCode === 200 || res.statusCode === 302);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
          req.destroy();
          resolve(false);
        });
      });
      
      if (isReady) {
        if (verbose) {
          console.log('✓ Firebase emulators are ready!');
        }
        return;
      }
    } catch {
      // Emulator not ready yet
    }
    
    if (verbose && i % 5 === 0) {
      console.log(`Waiting for Firebase emulators to start... (${i * delayMs / 1000}s)`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('Firebase emulators failed to start within timeout');
}

/**
 * Start Firebase emulators
 */
async function startEmulators(): Promise<void> {
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  if (verbose) {
    console.log('Starting Firebase emulators...');
  }
  
  // Check if emulators are already running
  if (await areEmulatorsRunning()) {
    if (verbose) {
      console.log('Firebase emulators are already running, reusing existing instance.');
    }
    return;
  }
  
  // Start emulators in the background
  const emulatorCommand = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
  const emulatorArgs = [
    'emulators:start',
    '--only',
    'auth,firestore'
  ];
  
  emulatorProcess = spawn(emulatorCommand, emulatorArgs, {
    stdio: verbose ? 'inherit' : 'ignore',
    env: {
      ...process.env,
      FIREBASE_EMULATOR_DEBUG_LOG: '/dev/null',
      _JAVA_OPTIONS: '-XX:+IgnoreUnrecognizedVMOptions',
    },
    detached: false,
  });
  
  // Store PID for cleanup
  if (emulatorProcess.pid) {
    fs.writeFileSync(EMULATOR_PID_FILE, emulatorProcess.pid.toString());
  }
  
  // Handle process errors
  emulatorProcess.on('error', (error) => {
    console.error('Failed to start Firebase emulators:', error);
    throw error;
  });
  
  // Wait for emulators to be ready
  await waitForEmulators();
}

async function globalSetup() {
  // Ensure test environment variables are set
  if (!process.env.E2E_TEST) {
    process.env.E2E_TEST = 'true';
  }
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'test';
  }
  
  // CRITICAL: Set project ID FIRST before any Firebase Admin SDK initialization
  // This prevents the Admin SDK from reading .firebaserc or Application Default Credentials
  // The project ID MUST be 'demo-test' to match emulator configuration
  process.env.FIREBASE_ADMIN_PROJECT_ID = 'demo-test';
  process.env.GCLOUD_PROJECT = 'demo-test';
  
  // Ensure Firebase emulator environment variables are set
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
  }
  
  // Force client SDK to use demo-test in test mode
  // This ensures both client and admin SDK use the same project ID
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-test';
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-test.appspot.com';
  
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  // Start Firebase emulators if not already running (only in local development, not CI)
  if (!process.env.CI) {
    try {
      await startEmulators();
    } catch (error) {
      console.error('Failed to start Firebase emulators:', error);
      // Don't throw - allow tests to proceed if emulators are manually started
      if (verbose) {
        console.warn('Continuing with tests. Make sure Firebase emulators are running manually.');
      }
    }
  } else if (verbose) {
    console.log('CI mode detected - assuming emulators are started by CI workflow');
  }
  
  if (verbose) {
    console.log('Global setup complete. Environment variables configured for emulator mode.');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
    console.log('GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT);
  }
}

export default globalSetup;

