import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  
  // Clean up any test data created during tests
  // Note: For now, we rely on test-level cleanup
  // In the future, you might want to clean up test data here
  
  // Log test execution summary
  console.log('✓ Global teardown complete');
}

export default globalTeardown;

