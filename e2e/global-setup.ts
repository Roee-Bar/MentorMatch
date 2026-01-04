/**
 * Global Setup for E2E Tests
 * 
 * Sets up test environment variables for in-memory database.
 * No emulators or external services needed.
 */

async function globalSetup() {
  // Unset NO_COLOR if FORCE_COLOR is set to prevent Node.js warnings
  if (process.env.FORCE_COLOR && process.env.NO_COLOR) {
    delete process.env.NO_COLOR;
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.E2E_TEST = 'true';
  process.env.NEXT_PUBLIC_NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_E2E_TEST = 'true';
  process.env.FIREBASE_ADMIN_PROJECT_ID = 'demo-test';
  process.env.GCLOUD_PROJECT = 'demo-test';
  
  const verbose = process.env.PLAYWRIGHT_VERBOSE === 'true';
  
  if (verbose) {
    console.log('Global setup complete. Using in-memory test database.');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
  }
}

export default globalSetup;
