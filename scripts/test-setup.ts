/**
 * Test Setup Script
 * 
 * Simple helper script to start Firebase emulators for local testing.
 * Checks if emulators are already running before starting new ones.
 * 
 * Usage: npm run test:setup
 */

import { spawn } from 'child_process';
import * as http from 'http';
import * as net from 'net';

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
  const uiPortInUse = await isPortInUse(4000);
  if (!uiPortInUse) {
    return false;
  }
  
  // Check if it's actually the emulator UI
  // Try both localhost and 127.0.0.1, and check multiple endpoints
  const hosts = ['http://localhost:4000', 'http://127.0.0.1:4000'];
  const endpoints = ['', '/auth', '/firestore'];
  
  for (const host of hosts) {
    for (const endpoint of endpoints) {
      const url = `${host}${endpoint}`;
      const isReady = await new Promise<boolean>((resolve) => {
        const req = http.get(url, (res) => {
          resolve(res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 404);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => {
          req.destroy();
          resolve(false);
        });
      });
      
      if (isReady) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Wait for emulators to be ready
 */
async function waitForEmulators(maxAttempts = 60, delayMs = 2000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await areEmulatorsRunning()) {
      console.log('✓ Firebase emulators are ready!');
      return;
    }
    
    if (i % 5 === 0 && i > 0) {
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
  console.log('Starting Firebase emulators...');
  
  const emulatorCommand = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
  const emulatorArgs = [
    'emulators:start',
    '--only',
    'auth,firestore'
  ];
  
  const emulatorEnv = { ...process.env };
  if (emulatorEnv.FORCE_COLOR && emulatorEnv.NO_COLOR) {
    delete emulatorEnv.NO_COLOR;
  }
  
  const emulatorProcess = spawn(emulatorCommand, emulatorArgs, {
    stdio: 'inherit',
    env: {
      ...emulatorEnv,
      FIREBASE_EMULATOR_DEBUG_LOG: '/dev/null',
      _JAVA_OPTIONS: '-XX:+IgnoreUnrecognizedVMOptions',
    },
    detached: false,
  });
  
  emulatorProcess.on('error', (error) => {
    console.error('Failed to start Firebase emulators:', error);
    process.exit(1);
  });
  
  // Wait for emulators to be ready
  await waitForEmulators();
  
  console.log('');
  console.log('✓ Firebase emulators are running!');
  console.log('  - Auth Emulator: http://localhost:9099');
  console.log('  - Firestore Emulator: http://localhost:8081');
  console.log('  - Emulator UI: http://localhost:4000');
  console.log('');
  console.log('You can now run tests with: npm run test:e2e');
  console.log('Press Ctrl+C to stop the emulators.');
}

async function main() {
  try {
    // Check if emulators are already running
    if (await areEmulatorsRunning()) {
      console.log('✓ Firebase emulators are already running!');
      console.log('  - Emulator UI: http://localhost:4000');
      return;
    }
    
    // Start emulators
    await startEmulators();
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\nStopping Firebase emulators...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

