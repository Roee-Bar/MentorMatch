import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * This configuration sets up Playwright for end-to-end testing of MentorMatch.
 * It includes:
 * - Automatic Next.js dev server startup
 * - Firebase Emulator integration
 * - Test retries and timeouts
 * - Screenshot and video capture on failure
 * 
 * Note: Uses tsconfig.playwright.json for proper path alias resolution
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  // Global test timeout - increased in CI to account for webServer startup (~180s)
  timeout: process.env.CI ? 240000 : 60000, // 4 minutes in CI (webServer + test), 1 minute locally
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  reporter: process.env.CI
    ? [
        ['github'], // Concise GitHub Actions reporter
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results.json' }],
        ['junit', { outputFile: 'test-results.xml' }],
      ]
    : [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        process.env.PLAYWRIGHT_VERBOSE === 'true' ? ['list'] : ['dot'], // Use 'dot' for minimal output, 'list' for verbose
        ['json', { outputFile: 'test-results.json' }],
      ],
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5000,
    navigationTimeout: 15000,
    // Clear browser state between tests for better isolation
    storageState: undefined,
  },

  expect: {
    timeout: 10000,
    toHaveScreenshot: { threshold: 0.2 },
    toMatchSnapshot: { threshold: 0.2 },
  },

  // Note: Environment variables for test workers are inherited from process.env
  // These should be set in the CI/CD pipeline or when running tests:
  // - E2E_TEST
  // - NODE_ENV
  // - FIREBASE_AUTH_EMULATOR_HOST
  // - FIRESTORE_EMULATOR_HOST
  // - FIREBASE_ADMIN_PROJECT_ID

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Configure web server to start Next.js dev server
  // Note: In CI, the server is started manually in the workflow to ensure proper startup
  // and error visibility. In local development, Playwright will start it automatically.
  // Firebase Emulators require Java to be installed
  // Start emulators manually with: npx firebase emulators:start --only auth,firestore
  // The health check endpoint (/api/health) is used to verify server readiness
  ...(process.env.CI ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 120000,
      stdout: 'ignore',
      stderr: 'ignore',
      // Use environment variables from the workflow, with fallbacks
      env: {
        E2E_TEST: process.env.E2E_TEST || 'true',
        NODE_ENV: process.env.NODE_ENV || 'test',
        CI: process.env.CI || 'false',
        FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099',
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8081',
        // NEXT_PUBLIC_* variables are embedded in the client bundle at build time
        NEXT_PUBLIC_E2E_TEST: process.env.NEXT_PUBLIC_E2E_TEST || 'true',
        NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || 'test',
        NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099',
        NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8081',
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-test',
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-test.appspot.com',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:test',
        FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test',
        // Don't set dummy credentials - let firebase-admin use emulator mode in test environment
        // FIREBASE_ADMIN_CLIENT_EMAIL: undefined,
        // FIREBASE_ADMIN_PRIVATE_KEY: undefined,
      },
    },
  }),
});

