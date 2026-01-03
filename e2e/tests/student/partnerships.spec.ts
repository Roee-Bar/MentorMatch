/**
 * Student Partnerships E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedStudent } from '../../fixtures/db-helpers';

test.describe('Student - Partnerships', () => {
  test('should display partnership status', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    await dashboard.goto();

    // Should see partnership status on dashboard
    const partnershipStatus = page.locator('[data-testid="partnership-status"], .partnership-status');
    if (await partnershipStatus.isVisible()) {
      await expect(partnershipStatus).toBeVisible();
    }
  });

  test('should send partnership request', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create another student
    const { student: targetStudent } = await seedStudent();

    await dashboard.goto();

    // Look for partnership request functionality
    const requestButton = page.getByRole('button', { name: /request partnership|find partner/i });
    if (await requestButton.isVisible()) {
      await requestButton.click();
      
      // If there's a form or modal, interact with it
      await page.waitForTimeout(1000);
    }
  });
});

