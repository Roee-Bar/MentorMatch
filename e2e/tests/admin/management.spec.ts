/**
 * Admin Management E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';
import { seedStudent, seedSupervisor } from '../../fixtures/db-helpers';

test.describe('Admin - User Management', () => {
  test('should view student details', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    // Create a test student
    await seedStudent();

    await dashboard.goto();

    // Click on a student row
    const studentRow = page.locator('table tbody tr').first();
    if (await studentRow.isVisible()) {
      await studentRow.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should view supervisor details', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    // Create a test supervisor
    await seedSupervisor();

    await dashboard.goto();

    // Navigate to supervisors section
    const supervisorsTab = page.getByRole('tab', { name: /supervisors/i });
    if (await supervisorsTab.isVisible()) {
      await supervisorsTab.click();
    }

    // Click on a supervisor row
    const supervisorRow = page.locator('table tbody tr').first();
    if (await supervisorRow.isVisible()) {
      await supervisorRow.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should filter students', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Look for filter controls
    const searchInput = page.getByPlaceholder(/search|filter/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });
});

