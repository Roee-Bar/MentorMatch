/**
 * Test Configuration
 * 
 * Centralized configuration for E2E tests including timeouts, retries,
 * test data defaults, and environment settings.
 */

/**
 * Test timeout configurations
 */
export const Timeouts = {
  /** Navigation timeout in milliseconds */
  navigation: 15000,
  
  /** Action timeout (clicks, fills, etc.) in milliseconds */
  action: 5000,
  
  /** Assertion timeout in milliseconds */
  assertion: 5000,
  
  /** API request timeout in milliseconds */
  api: 10000,
  
  /** Network idle timeout in milliseconds */
  networkIdle: 2000,
  
  /** Element stability timeout (for animations) in milliseconds */
  elementStability: 500,
} as const;

/**
 * Retry configuration
 */
export const Retries = {
  /** Number of retries in CI environment */
  ci: 2,
  
  /** Number of retries in local environment */
  local: 0,
  
  /** Get retry count based on environment */
  get count(): number {
    return process.env.CI ? this.ci : this.local;
  },
} as const;

/**
 * Test data defaults
 */
export const TestData = {
  /** Default password for test users */
  defaultPassword: 'TestPassword123!',
  
  /** Default department for test users */
  defaultDepartment: 'Computer Science',
  
  /** Default email domain for test users */
  defaultEmailDomain: 'test.example.com',
  
  /** Default phone number format */
  defaultPhone: '050-1234567',
} as const;

/**
 * Environment detection helpers
 */
export const Environment = {
  /** Check if running in CI environment */
  isCI(): boolean {
    return process.env.CI === 'true' || !!process.env.CI;
  },
  
  /** Check if running in test environment */
  isTest(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
  },
  
  /** Get base URL for tests */
  getBaseURL(): string {
    return process.env.E2E_BASE_URL || 'http://localhost:3000';
  },
  
  /** Get Firebase emulator host for Auth */
  getAuthEmulatorHost(): string {
    return (
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
      'localhost:9099'
    );
  },
  
  /** Get Firebase emulator host for Firestore */
  getFirestoreEmulatorHost(): string {
    return (
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ||
      'localhost:8081'
    );
  },
  
  /** Get Firebase project ID */
  getProjectId(): string {
    return (
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'demo-test'
    );
  },
} as const;

/**
 * Test configuration object
 */
export const TestConfig = {
  timeouts: Timeouts,
  retries: Retries,
  testData: TestData,
  environment: Environment,
} as const;

export default TestConfig;

