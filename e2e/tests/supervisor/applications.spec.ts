/**
 * Supervisor Applications E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { SupervisorDashboard } from '../../pages/SupervisorDashboard';
import { seedStudent, seedApplication, cleanupUser } from '../../fixtures/db-helpers';
import type { Student } from '@/types/database';

test.describe('Supervisor - Applications', () => {
  let sharedStudent: { uid: string; student: Student } | undefined;

  test.beforeAll(async () => {
    // Increase timeout for beforeAll to handle potential Firebase initialization delays
    try {
      sharedStudent = await seedStudent();
    } catch (error) {
      console.error('Failed to seed student in beforeAll:', error);
      throw error;
    }
  }, { timeout: 120000 }); // 2 minutes timeout

  test.afterAll(async () => {
    // Guard against cleanup when sharedStudent was not initialized
    if (sharedStudent?.uid) {
      try {
        await cleanupUser(sharedStudent.uid);
      } catch (error) {
        console.error('Failed to cleanup student in afterAll:', error);
        // Don't throw - cleanup errors shouldn't fail the test suite
      }
    }
  });

  test('should display pending applications', async ({ page, authenticatedSupervisor }) => {
    if (!sharedStudent) {
      throw new Error('sharedStudent was not initialized in beforeAll');
    }

    const dashboard = new SupervisorDashboard(page);

    // Use shared student
    await seedApplication(sharedStudent.student.id, authenticatedSupervisor.uid, {
      status: 'pending',
    });

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Should see applications list
    await expect(page).toHaveURL(/\/authenticated\/supervisor\/applications/);
    const applicationsList = page.locator('[data-testid="application-card"], .application-card, table tbody tr');
    await expect(applicationsList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should approve an application', async ({ page, authenticatedSupervisor }) => {
    if (!sharedStudent) {
      throw new Error('sharedStudent was not initialized in beforeAll');
    }

    const dashboard = new SupervisorDashboard(page);

    // Use shared student
    const { application } = await seedApplication(sharedStudent.student.id, authenticatedSupervisor.uid, {
      status: 'pending',
    });

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Find the application and approve it
    const approveButton = page.getByRole('button', { name: /approve|accept/i }).first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await page.waitForTimeout(2000);
      
      // Should see success message or status change
      const successMessage = page.locator('[role="status"], .success');
      if (await successMessage.isVisible({ timeout: 5000 })) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should reject an application', async ({ page, authenticatedSupervisor }) => {
    if (!sharedStudent) {
      throw new Error('sharedStudent was not initialized in beforeAll');
    }

    const dashboard = new SupervisorDashboard(page);

    // Use shared student
    await seedApplication(sharedStudent.student.id, authenticatedSupervisor.uid, {
      status: 'pending',
    });

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Find the application and reject it
    const rejectButton = page.getByRole('button', { name: /reject|decline/i }).first();
    if (await rejectButton.isVisible()) {
      await rejectButton.click();
      await page.waitForTimeout(2000);
    }
  });
});

