import { test, expect } from '@playwright/test';
import { loginAs, waitForResponse } from '../../utils/setup';

test.describe('Authentication - Authorization', () => {
  test('TC-AUTH-007: Authorization - Student → Admin Route', async ({ page }) => {
    // Login as student
    await loginAs(page, 'studentNoPartner');
    await expect(page).toHaveURL(/\/authenticated\/student/);

    // Attempt to navigate to admin route
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/') || url.includes('/authenticated/admin');
      },
      { timeout: 5000 }
    ).catch(() => null);

    await page.goto('/authenticated/admin');

    // Wait for response if any
    await responsePromise;

    // Should be redirected back to student dashboard or show 403
    // The app should handle unauthorized access
    await page.waitForTimeout(2000);
    
    // Verify we're not on admin page (either redirected or 403)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/authenticated/admin');
  });

  test('TC-AUTH-008: Authorization - Supervisor → Student Route', async ({ page }) => {
    // Login as supervisor
    await loginAs(page, 'supervisor');
    await expect(page).toHaveURL(/\/authenticated\/supervisor/);

    // Attempt to navigate to student route
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/') || url.includes('/authenticated/student');
      },
      { timeout: 5000 }
    ).catch(() => null);

    await page.goto('/authenticated/student');

    // Wait for response if any
    await responsePromise;

    // Should be redirected back to supervisor dashboard
    await page.waitForTimeout(2000);
    
    // Verify we're not on student page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/authenticated/student');
  });
});

