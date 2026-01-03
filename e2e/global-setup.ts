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
  
  // Ensure Firebase emulator environment variables are set
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  }
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
  }
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    process.env.FIREBASE_ADMIN_PROJECT_ID = 'demo-test';
  }
  
  // Prevent Firebase Admin SDK from using Application Default Credentials
  // This is important when running tests with emulators
  process.env.GCLOUD_PROJECT = process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test';
  
  console.log('Global setup complete. Environment variables configured for emulator mode.');
}

export default globalSetup;

