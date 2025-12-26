import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/test-users';
import { loginAs, waitForResponse, checkForErrors } from '../../utils/setup';

test.describe('Authentication - Login', () => {
  test('TC-AUTH-001: Student Login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Fill login form
    await page.fill('input[name="email"]', TEST_USERS.studentNoPartner.email);
    await page.fill('input[name="password"]', TEST_USERS.studentNoPartner.password);

    // Intercept network request
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return (url.includes('/api/auth') || url.includes('firebase')) && response.status() === 200;
      },
      { timeout: 10000 }
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for successful response
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    // Verify redirect to student dashboard
    await expect(page).toHaveURL(/\/authenticated\/student/, { timeout: 15000 });

    // Check for console errors
    const errors = await checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test('TC-AUTH-002: Supervisor Login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERS.supervisor.email);
    await page.fill('input[name="password"]', TEST_USERS.supervisor.password);

    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return (url.includes('/api/auth') || url.includes('firebase')) && response.status() === 200;
      },
      { timeout: 10000 }
    );

    await page.click('button[type="submit"]');
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    // Verify redirect to supervisor dashboard
    await expect(page).toHaveURL(/\/authenticated\/supervisor/, { timeout: 15000 });
  });

  test('TC-AUTH-003: Admin Login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);

    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return (url.includes('/api/auth') || url.includes('firebase')) && response.status() === 200;
      },
      { timeout: 10000 }
    );

    await page.click('button[type="submit"]');
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    // Verify redirect to admin dashboard
    await expect(page).toHaveURL(/\/authenticated\/admin/, { timeout: 15000 });
  });

  test('TC-AUTH-004: Invalid Credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Wait for response (should be error)
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/auth') || url.includes('firebase');
      },
      { timeout: 10000 }
    );

    await page.click('button[type="submit"]');
    await responsePromise;

    // Wait a bit for error message to appear
    await page.waitForTimeout(2000);

    // Verify error message is displayed
    const errorMessage = await page.locator('text=/error|invalid|incorrect/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Verify still on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

