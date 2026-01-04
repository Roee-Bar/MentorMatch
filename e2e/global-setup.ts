/**
 * Global Setup for E2E Tests
 * 
 * Ensures environment variables are set before tests run.
 * This is critical for Firebase Admin SDK to connect to emulators.
 */

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
  
  if (process.env.PLAYWRIGHT_VERBOSE === 'true') {
    console.log('Global setup complete. Environment variables configured for emulator mode.');
    console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
    console.log('GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT);
  }
}

export default globalSetup;

