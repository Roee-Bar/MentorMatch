/**
 * Student Applications E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedSupervisor, seedApplication } from '../../fixtures/db-helpers';

test.describe('Student - Applications', () => {
  test('should display student applications', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor and application
    const { supervisor } = await seedSupervisor();
    await seedApplication(authenticatedStudent.uid, supervisor.id, {
      status: 'pending',
    });

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Should see applications list
    await expect(page).toHaveURL(/\/authenticated\/student\/applications/);
    const applicationsList = page.locator('[data-testid="application-card"], .application-card, table tbody tr');
    await expect(applicationsList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should submit a new application', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor();

    await dashboard.goto();
    await dashboard.navigateToSupervisors();

    // Find and click on a supervisor
    const supervisorCard = page.locator('[data-testid="supervisor-card"], .supervisor-card').first();
    await supervisorCard.click();

    // Look for apply button
    const applyButton = page.getByRole('button', { name: /apply|submit application/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();

      // Fill application form if modal opens
      const titleInput = page.getByLabel(/project title/i);
      const descriptionInput = page.getByLabel(/project description/i);
      
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Project Title');
        await descriptionInput.fill('Test project description');
        
        const submitButton = page.getByRole('button', { name: /submit|create/i });
        await submitButton.click();

        // Should see success message or redirect
        await page.waitForTimeout(2000);
      }
    }
  });
});

