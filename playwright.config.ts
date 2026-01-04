import { defineConfig, devices } from '@playwright/test';
import { getTestEnvVars } from './e2e/config/env';

/**
 * Playwright E2E Test Configuration
 * 
 * This configuration sets up Playwright for end-to-end testing of MentorMatch.
 * It includes:
 * - Automatic Next.js dev server startup (via webServer)
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

  // Configure web server to start Next.js dev server automatically
  // Playwright will manage the server lifecycle in both CI and local development
  // Firebase Emulators should be started separately using: npm run test:setup
  // The health check endpoint (/api/health) is used to verify server readiness
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI, // Only reuse in local dev, not CI
    timeout: 120000,
    stdout: process.env.CI ? 'pipe' : 'ignore',
    stderr: process.env.CI ? 'pipe' : 'ignore',
    // Use centralized environment variables
    env: getTestEnvVars({
      // Add any additional env vars needed for Next.js dev server
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
    }),
  },
});

