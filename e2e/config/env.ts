/**
 * Centralized Environment Variable Configuration
 * 
 * Single source of truth for all test environment variables.
 * This ensures consistency across:
 * - Local development
 * - CI/CD pipelines
 * - Playwright configuration
 * - Global setup/teardown
 */

/**
 * Get test environment variables
 * @param overrides Optional overrides for specific variables
 * @returns Object containing all test environment variables
 */
export function getTestEnvVars(overrides?: Record<string, string>): Record<string, string> {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test';
  
  const base = {
    E2E_TEST: 'true',
    NODE_ENV: 'test',
    CI: process.env.CI || 'false',
    FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    FIRESTORE_EMULATOR_HOST: 'localhost:8081',
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: 'localhost:8081',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${projectId}.appspot.com`,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:test',
    FIREBASE_ADMIN_PROJECT_ID: projectId,
    GCLOUD_PROJECT: projectId,
  };
  
  return { ...base, ...overrides };
}

