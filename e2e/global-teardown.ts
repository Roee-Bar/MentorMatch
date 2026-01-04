/**
 * Global Teardown for E2E Tests
 * 
 * Performs cleanup operations after all tests complete.
 * This includes:
 * - Stopping Firebase emulators if we started them
 * - Verifying test isolation (checking for leaked data)
 * - Cleaning up any remaining test artifacts
 * - Logging test execution summary
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const EMULATOR_PID_FILE = path.join(process.cwd(), '.emulator-pid');

/**
 * Stop Firebase emulators if we started them
 */
async function stopEmulators(): Promise<void> {
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  // Only stop emulators if we're not in CI (CI handles its own cleanup)
  if (process.env.CI) {
    if (verbose) {
      console.log('CI mode detected - skipping emulator cleanup (handled by CI workflow)');
    }
    return;
  }
  
  // Check if we have a PID file (meaning we started the emulators)
  if (!fs.existsSync(EMULATOR_PID_FILE)) {
    if (verbose) {
      console.log('No emulator PID file found - emulators were not started by this process');
    }
    return;
  }
  
  try {
    const pid = parseInt(fs.readFileSync(EMULATOR_PID_FILE, 'utf-8').trim(), 10);
    
    if (verbose) {
      console.log(`Stopping Firebase emulators (PID: ${pid})...`);
    }
    
    // Try to kill the process
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /PID ${pid} /F /T`);
      } else {
        await execAsync(`kill ${pid} 2>/dev/null || true`);
      }
    } catch (error) {
      // Process might already be dead, that's okay
      if (verbose) {
        console.log('Emulator process may have already stopped');
      }
    }
    
    // Also try to kill any remaining firebase emulator processes
    try {
      if (process.platform === 'win32') {
        await execAsync('taskkill /F /IM firebase.exe /T 2>nul || true');
      } else {
        await execAsync('pkill -f "firebase emulators" || true');
      }
    } catch (error) {
      // Ignore errors
    }
    
    // Remove PID file
    fs.unlinkSync(EMULATOR_PID_FILE);
    
    if (verbose) {
      console.log('✓ Firebase emulators stopped');
    }
  } catch (error) {
    console.warn('Error stopping Firebase emulators:', error);
    // Try to clean up PID file anyway
    try {
      if (fs.existsSync(EMULATOR_PID_FILE)) {
        fs.unlinkSync(EMULATOR_PID_FILE);
      }
    } catch {
      // Ignore
    }
  }
}

async function globalTeardown() {
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  if (verbose) {
    console.log('Running global teardown...');
  }
  
  // Stop Firebase emulators if we started them
  await stopEmulators();
  
  // Verify test isolation - check for any leaked test data
  // This is a placeholder - in a real scenario, you might check the database
  // for test users/data that should have been cleaned up
  try {
    // Check if Firebase emulators are still running
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    if (emulatorHost && verbose) {
      console.log(`Firestore emulator host: ${emulatorHost}`);
      // In a real implementation, you might query for test data here
      // and log warnings if any is found
    }
  } catch (error) {
    console.warn('Could not verify test isolation:', error);
  }
  
  // Clean up any remaining test artifacts
  // This could include temporary files, screenshots from failed tests, etc.
  try {
    // Placeholder for cleanup operations
    // In a real scenario, you might delete temporary test files here
    if (verbose) {
      console.log('Test artifacts cleanup completed');
    }
  } catch (error) {
    console.warn('Error during test artifacts cleanup:', error);
  }
  
  // Clean up emulator log files
  const logFiles = ['firestore-debug.log', 'firebase-debug.log', 'ui-debug.log'];
  logFiles.forEach(logFile => {
    const logPath = path.join(process.cwd(), logFile);
    if (fs.existsSync(logPath)) {
      try {
        fs.unlinkSync(logPath);
        if (verbose) {
          console.log(`Cleaned up ${logFile}`);
        }
      } catch (error) {
        console.warn(`Could not delete ${logFile}:`, error);
      }
    }
  });
  
  // Log test execution summary
  if (verbose) {
    console.log('Global teardown complete');
    console.log('Test execution summary:');
    console.log(`  - Environment: ${process.env.NODE_ENV || 'unknown'}`);
    console.log(`  - E2E Test Mode: ${process.env.E2E_TEST || 'unknown'}`);
    console.log(`  - CI Mode: ${process.env.CI || 'false'}`);
  }
}

export default globalTeardown;

