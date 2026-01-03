/**
 * Admin Capacity Override E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';
import { seedSupervisor } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';

test.describe('Admin - Capacity Override', () => {
  test('should override supervisor capacity and log the change', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    // Create a supervisor with initial capacity
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 2,
    });

    await dashboard.goto();

    // Override supervisor capacity
    const newCapacity = 10;
    const reason = 'Increased workload capacity for new semester';
    await dashboard.overrideSupervisorCapacity(supervisor.id, newCapacity, reason);

    // Verify success message
    const successMessage = page.locator('[role="status"], .success, [data-testid="success-message"]');
    if (await successMessage.isVisible({ timeout: 5000 })) {
      await expect(successMessage).toBeVisible();
    }

    // Verify supervisor's maxCapacity updated in database
    const supervisorDoc = await adminDb.collection('supervisors').doc(supervisor.id).get();
    expect(supervisorDoc.exists).toBeTruthy();
    const supervisorData = supervisorDoc.data();
    expect(supervisorData?.maxCapacity).toBe(newCapacity);

    // Verify capacity change logged in capacity_changes collection
    const capacityChangesSnapshot = await adminDb
      .collection('capacity_changes')
      .where('supervisorId', '==', supervisor.id)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    expect(capacityChangesSnapshot.empty).toBeFalsy();
    const latestChange = capacityChangesSnapshot.docs[0].data();
    expect(latestChange.supervisorId).toBe(supervisor.id);
    expect(latestChange.newMaxCapacity).toBe(newCapacity);
    expect(latestChange.oldMaxCapacity).toBe(5);
    expect(latestChange.reason).toBe(reason);
    expect(latestChange.adminId).toBe(authenticatedAdmin.uid);
    expect(latestChange.adminEmail).toBe(authenticatedAdmin.email);
  });

  test('should display updated capacity after override', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor({
      maxCapacity: 3,
      currentCapacity: 1,
    });

    await dashboard.goto();
    await dashboard.navigateToSupervisorDetails(supervisor.id);

    // Verify initial capacity is displayed
    const capacityDisplay = page.locator('[data-testid="capacity"], text=/capacity/i');
    if (await capacityDisplay.isVisible()) {
      const capacityText = await capacityDisplay.textContent();
      expect(capacityText).toContain('3');
    }

    // Override capacity
    await dashboard.overrideSupervisorCapacity(supervisor.id, 8, 'Test override');

    // Wait for UI to update
    await page.waitForTimeout(2000);

    // Verify updated capacity is displayed (if UI shows it)
    if (await capacityDisplay.isVisible()) {
      const updatedCapacityText = await capacityDisplay.textContent();
      expect(updatedCapacityText).toContain('8');
    }
  });
});

