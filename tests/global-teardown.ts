import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  
  // Clean up any test data created during tests
  // Note: Test-level cleanup is preferred (using TestDataCleanup class)
  // Global teardown can be used for orphaned data cleanup if needed
  
  // Log test execution summary
  console.log('✓ Global teardown complete');
  console.log('Note: Test data cleanup should be handled at test level using TestDataCleanup helper');
}

export default globalTeardown;

