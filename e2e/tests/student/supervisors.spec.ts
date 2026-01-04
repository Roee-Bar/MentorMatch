/**
 * Student Supervisors E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedSupervisor } from '../../fixtures/db-helpers';

test.describe('Student - Browse Supervisors @student @smoke', () => {
  test('should display list of supervisors @smoke @fast', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a test supervisor
    await seedSupervisor();

    await dashboard.goto();
    await dashboard.navigateToSupervisors();

    // Should see supervisors list
    await expect(page).toHaveURL(/\/authenticated\/student\/supervisors/);
    // Check for supervisor cards or table
    const supervisorsList = page.locator('[data-testid="supervisor-card"], .supervisor-card, table tbody tr');
    await expect(supervisorsList.first()).toBeVisible({ timeout: 10000 });
  });
});

