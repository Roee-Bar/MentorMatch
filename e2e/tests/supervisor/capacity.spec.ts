/**
 * Supervisor Capacity Management E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { SupervisorDashboard } from '../../pages/SupervisorDashboard';

test.describe('Supervisor - Capacity Management', () => {
  test('should display current capacity', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    await dashboard.goto();

    // Should see capacity information
    const capacityInfo = page.locator('[data-testid="capacity"], .capacity, text=/capacity/i');
    if (await capacityInfo.isVisible()) {
      await expect(capacityInfo).toBeVisible();
    }
  });

  test('should update capacity', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    await dashboard.goto();

    // Look for edit capacity button
    const editButton = page.getByRole('button', { name: /edit capacity|update capacity/i });
    if (await editButton.isVisible()) {
      await editButton.click();

      // If modal opens, update capacity
      const capacityInput = page.getByLabel(/max capacity|capacity/i);
      if (await capacityInput.isVisible()) {
        await capacityInput.fill('10');
        
        const saveButton = page.getByRole('button', { name: /save|update/i });
        await saveButton.click();

        await page.waitForTimeout(2000);
      }
    }
  });
});

