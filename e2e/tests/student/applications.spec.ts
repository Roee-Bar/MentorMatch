/**
 * Student Applications E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedSupervisor, seedApplication, cleanupUser } from '../../fixtures/db-helpers';
import { Selectors } from '../../utils/selectors';
import type { Supervisor } from '@/types/database';

test.describe('Student - Applications @student @smoke', () => {
  let sharedSupervisor: { uid: string; supervisor: Supervisor } | undefined;

  test.beforeAll(async () => {
    // Increase timeout for beforeAll to handle potential Firebase initialization delays
    try {
      sharedSupervisor = await seedSupervisor();
    } catch (error) {
      console.error('Failed to seed supervisor in beforeAll:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    // Guard against cleanup when sharedSupervisor was not initialized
    if (sharedSupervisor?.uid) {
      try {
        await cleanupUser(sharedSupervisor.uid);
      } catch (error) {
        console.error('Failed to cleanup supervisor in afterAll:', error);
        // Don't throw - cleanup errors shouldn't fail the test suite
      }
    }
  });

  test('should display student applications @smoke @student', async ({ page, authenticatedStudent }) => {
    if (!sharedSupervisor) {
      throw new Error('sharedSupervisor was not initialized in beforeAll');
    }

    const dashboard = new StudentDashboard(page);

    // Use shared supervisor
    await seedApplication(authenticatedStudent.uid, sharedSupervisor.supervisor.id, {
      status: 'pending',
    });

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Should see applications list
    await expect(page).toHaveURL(/\/authenticated\/student\/applications/);
    const applicationsList = page.locator(Selectors.applicationCard);
    await expect(applicationsList.first()).toBeVisible({ timeout: 10000 });
  });
});

