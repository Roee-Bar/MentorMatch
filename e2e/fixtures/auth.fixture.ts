import { test as base, Page } from '@playwright/test';
import { TEST_STUDENTS, TEST_SUPERVISORS } from '../utils/test-data';

type AuthFixtures = {
  studentPage: Page;
  supervisorPage: Page;
  adminPage: Page;
};

/**
 * Login helper function
 * @param page - Playwright page instance
 * @param email - User email
 * @param password - User password
 * @param expectedUrl - URL pattern to wait for after login
 */
async function loginAs(page: Page, email: string, password: string, expectedUrl: RegExp) {
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to complete
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

/**
 * Extended test fixtures with pre-authenticated pages
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Fixture that provides a page logged in as a student (Sarah Cohen)
   */
  studentPage: async ({ page }, use) => {
    await loginAs(
      page,
      TEST_STUDENTS.sarahCohen.email,
      TEST_STUDENTS.sarahCohen.password,
      /\/authenticated\/student/
    );
    await use(page);
  },

  /**
   * Fixture that provides a page logged in as a supervisor (Dr. Naomi Unkelos-Shpigel)
   */
  supervisorPage: async ({ page }, use) => {
    await loginAs(
      page,
      TEST_SUPERVISORS.naomiUnkelos.email,
      TEST_SUPERVISORS.naomiUnkelos.password,
      /\/authenticated\/supervisor/
    );
    await use(page);
  },

  /**
   * Fixture that provides a page logged in as an admin
   * Note: Update email/password when admin test account is available
   */
  adminPage: async ({ page }, use) => {
    // TODO: Replace with actual admin credentials when available
    await loginAs(
      page,
      'admin@braude.ac.il',
      'Test123!',
      /\/authenticated\/admin/
    );
    await use(page);
  },
});

export { expect } from '@playwright/test';

