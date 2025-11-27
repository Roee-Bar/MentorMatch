import { test as base, Page } from '@playwright/test';

/**
 * Helper function to perform login
 */
async function performLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}

/**
 * Extended test fixtures with pre-authenticated user contexts
 */
type AuthFixtures = {
  studentPage: Page;
  supervisorPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Pre-authenticated student page fixture
   * Usage: test('test name', async ({ studentPage }) => { ... })
   */
  studentPage: async ({ page }, use) => {
    await performLogin(page, 'student@test.com', 'password123');
    
    // Verify we're on student dashboard
    const url = page.url();
    if (url.includes('/student')) {
      // Already on student-specific dashboard
    } else if (url.includes('/dashboard')) {
      // On general dashboard, might need to navigate
      const studentLink = page.getByRole('link', { name: /student/i });
      if (await studentLink.isVisible().catch(() => false)) {
        await studentLink.click();
      }
    }
    
    await use(page);
  },

  /**
   * Pre-authenticated supervisor page fixture
   * Usage: test('test name', async ({ supervisorPage }) => { ... })
   */
  supervisorPage: async ({ page }, use) => {
    await performLogin(page, 'supervisor@test.com', 'password123');
    
    // Verify we're on supervisor dashboard
    const url = page.url();
    if (url.includes('/supervisor')) {
      // Already on supervisor-specific dashboard
    } else if (url.includes('/dashboard')) {
      // On general dashboard
      const supervisorLink = page.getByRole('link', { name: /supervisor/i });
      if (await supervisorLink.isVisible().catch(() => false)) {
        await supervisorLink.click();
      }
    }
    
    await use(page);
  },

  /**
   * Pre-authenticated admin page fixture
   * Usage: test('test name', async ({ adminPage }) => { ... })
   */
  adminPage: async ({ page }, use) => {
    await performLogin(page, 'admin@test.com', 'password123');
    await use(page);
  },
});

export { expect } from '@playwright/test';

