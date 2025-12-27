import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

// Report Portal configuration interface
interface ReportPortalConfig {
  token: string;
  endpoint: string;
  project: string;
  launch: string;
  attributes: Array<{ key: string; value: string }>;
}

// Report Portal configuration (only in CI environment)
let rpConfig: ReportPortalConfig | undefined = undefined;
if (process.env.CI === 'true' && process.env.RP_ENDPOINT && process.env.RP_TOKEN) {
  rpConfig = {
    token: process.env.RP_TOKEN,
    endpoint: process.env.RP_ENDPOINT,
    project: process.env.RP_PROJECT || 'mentormatch',
    launch: process.env.RP_LAUNCH || `E2E Tests - Build ${process.env.BUILD_NUMBER || 'local'} - ${new Date().toISOString()}`,
    attributes: [
      { key: 'environment', value: process.env.NODE_ENV || 'test' },
      { key: 'branch', value: process.env.GIT_BRANCH || 'main' },
      { key: 'build', value: process.env.BUILD_NUMBER || 'local' },
      { key: 'commit', value: process.env.GIT_COMMIT || 'unknown' },
      { key: 'job', value: process.env.JOB_NAME || 'local' },
    ],
  };
}

// Build reporter array
const reporters: ReporterDescription[] = [
  ['html', { outputFolder: 'playwright-report' }],
  ['list'],
];

// Add Report Portal reporter if configured
if (rpConfig) {
  try {
    // Dynamic import to avoid errors if package is not installed
    require('@reportportal/agent-js-playwright');
    reporters.push(['@reportportal/agent-js-playwright', rpConfig]);
  } catch (error) {
    // In CI environment, fail fast if Report Portal is configured but unavailable
    if (process.env.CI === 'true') {
      throw new Error(
        'Report Portal is configured (RP_ENDPOINT and RP_TOKEN set) but @reportportal/agent-js-playwright is not installed. ' +
        'Install the package or remove Report Portal environment variables.'
      );
    }
    // In local development, just warn
    console.warn('Report Portal reporter not available. Install @reportportal/agent-js-playwright to enable.');
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: reporters,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

