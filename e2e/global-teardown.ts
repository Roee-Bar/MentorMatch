/**
 * Global Teardown for E2E Tests
 * 
 * Cleans up in-memory test database after all tests complete.
 */

import { testDatabase } from '@/lib/test-db';
import { testAuthStore } from '@/lib/test-db/auth-store';

async function globalTeardown() {
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  if (verbose) {
    console.log('Running global teardown...');
  }
  
  // Clear in-memory database
  testDatabase.clearAll();
  testAuthStore.clear();
  
  if (verbose) {
    console.log('Global teardown complete - in-memory database cleared');
  }
}

export default globalTeardown;
