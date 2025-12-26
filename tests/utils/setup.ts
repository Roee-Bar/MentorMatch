import { Page } from '@playwright/test';
import { TEST_USERS, TestUserKey } from '../fixtures/test-users';

/**
 * Login as a specific test user
 * @param page - Playwright page object
 * @param user - Key of the test user to login as
 */
export async function loginAs(page: Page, user: TestUserKey): Promise<void> {
  const credentials = TEST_USERS[user];
  await page.goto('/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/authenticated\//);
}

/**
 * Wait for network to be idle (no pending requests)
 * @param page - Playwright page object
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Check console for JavaScript errors
 * @param page - Playwright page object
 * @returns Array of error messages
 */
export async function checkForErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Wait for a network response matching the given pattern
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param statusCode - Expected status code
 * @returns The response object
 */
export async function waitForResponse(
  page: Page,
  urlPattern: string | RegExp,
  statusCode: number = 200
) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matchesUrl && response.status() === statusCode;
    }
  );
}

