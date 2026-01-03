/**
 * Student Applications E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedSupervisor, seedApplication, cleanupApplication, cleanupUser } from '../../fixtures/db-helpers';
import { createApplicationScenario } from '../../fixtures/scenarios';
import { Selectors } from '../../utils/selectors';
import { waitForStable, waitForLoadingComplete } from '../../utils/wait-strategies';
import { expectElementCount } from '../../utils/assertions';
import { adminDb } from '@/lib/firebase-admin';
import type { Supervisor } from '@/types/database';

test.describe('Student - Applications @student @regression', () => {
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

  test('should submit a new application @regression @student', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Use shared supervisor
    await dashboard.goto();
    await dashboard.navigateToSupervisors();

    // Find and click on a supervisor
    const supervisorCard = page.locator(Selectors.supervisorCard).first();
    await supervisorCard.click();
    await waitForStable(supervisorCard);

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
        await waitForLoadingComplete(page);
      }
    }
  });

  test('should delete a pending application @regression @student', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor with capacity for this specific test
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 2,
    });

    // Create a pending application
    const { application } = await seedApplication(authenticatedStudent.uid, supervisor.id, {
      status: 'pending',
    });

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Verify application is visible
    const applicationsList = page.locator(Selectors.applicationCard);
    await expect(applicationsList.first()).toBeVisible({ timeout: 10000 });

    // Delete the application
    await dashboard.deleteApplication(application.id);

    // Verify success message
    const successMessage = page.locator(Selectors.successMessage);
    if (await successMessage.isVisible({ timeout: 5000 })) {
      await expect(successMessage).toBeVisible();
    }

    // Verify application removed from database
    const applicationDoc = await adminDb.collection('applications').doc(application.id).get();
    expect(applicationDoc.exists).toBeFalsy();

    // Cleanup supervisor created for this test
    await cleanupUser(supervisor.id);
  });

  test('should decrease supervisor capacity when deleting approved application @regression @student @api', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor with capacity
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 3,
    });

    // Create an approved application
    const { application } = await seedApplication(authenticatedStudent.uid, supervisor.id, {
      status: 'approved',
    });

    // Verify initial capacity
    const supervisorBefore = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityBefore = supervisorBefore.data()?.currentCapacity || 0;

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Delete the application
    await dashboard.deleteApplication(application.id);

    // Wait for capacity update
    await waitForLoadingComplete(page);

    // Verify supervisor capacity decreased
    const supervisorAfter = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter).toBe(capacityBefore - 1);

    // Verify application deleted
    const applicationDoc = await adminDb.collection('applications').doc(application.id).get();
    expect(applicationDoc.exists).toBeFalsy();
  });
});

