/**
 * Global Teardown for E2E Tests
 * 
 * Performs cleanup operations after all tests complete.
 * Cleans up emulator log files.
 * 
 * Note: Firebase emulators are managed separately and should be stopped manually
 * or kept running during development.
 */

import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown() {
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  if (verbose) {
    console.log('Running global teardown...');
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
        // Ignore errors - file might be locked or already deleted
      }
    }
  });
  
  if (verbose) {
    console.log('Global teardown complete');
  }
}

export default globalTeardown;
