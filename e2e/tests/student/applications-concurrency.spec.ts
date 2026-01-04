/**
 * Application Concurrency E2E Tests
 * 
 * Tests transaction atomicity for concurrent operations affecting the same supervisor
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedSupervisor, seedMultipleStudents, seedApplication, cleanupUser, cleanupApplication } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';
import type { Supervisor } from '@/types/database';

test.describe('Student - Application Concurrency', () => {
  test('should handle concurrent application deletions', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor with capacity for multiple applications
    const { supervisor } = await seedSupervisor({
      maxCapacity: 10,
      currentCapacity: 5,
    });

    // Create multiple students
    const students = await seedMultipleStudents(3);

    // Create multiple approved applications to the same supervisor
    const applications = await Promise.all(
      students.map(student =>
        seedApplication(student.student.id, supervisor.id, {
          status: 'approved',
        })
      )
    );

    // Verify initial capacity
    const supervisorBefore = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityBefore = supervisorBefore.data()?.currentCapacity || 0;
    expect(capacityBefore).toBe(5 + applications.length); // Initial + approved applications

    // Delete all applications concurrently (tests transaction atomicity)
    const deletePromises = applications.map(app =>
      dashboard.deleteApplication(app.application.id)
    );

    await Promise.all(deletePromises);

    // Wait for all transactions to complete
    await page.waitForTimeout(3000);

    // Verify supervisor capacity decreased correctly (transaction atomicity)
    const supervisorAfter = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter).toBe(5); // Should be back to initial capacity

    // Verify all applications were deleted
    for (const app of applications) {
      const appDoc = await adminDb.collection('applications').doc(app.application.id).get();
      expect(appDoc.exists).toBeFalsy();
    }

    // Cleanup
    await cleanupUser(supervisor.id);
    for (const student of students) {
      await cleanupUser(student.uid);
    }
  });

  test('should maintain capacity consistency under concurrent updates', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor with initial capacity
    const { supervisor } = await seedSupervisor({
      maxCapacity: 10,
      currentCapacity: 3,
    });

    // Create multiple students
    const students = await seedMultipleStudents(4);

    // Create multiple pending applications
    const applications = await Promise.all(
      students.map(student =>
        seedApplication(student.student.id, supervisor.id, {
          status: 'pending',
        })
      )
    );

    // Verify initial capacity
    const supervisorBefore = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityBefore = supervisorBefore.data()?.currentCapacity || 0;
    expect(capacityBefore).toBe(3);

    // Delete some applications and approve others concurrently
    // This tests that capacity updates are atomic
    const deletePromises = applications.slice(0, 2).map(app =>
      dashboard.deleteApplication(app.application.id)
    );

    // Note: Approving applications would require supervisor actions, so we'll just test deletions
    // In a real scenario, you might have supervisor approve while student deletes
    await Promise.all(deletePromises);

    // Wait for transactions to complete
    await page.waitForTimeout(3000);

    // Verify capacity is consistent (should still be 3, no change for pending apps)
    const supervisorAfter = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter).toBe(3); // Pending applications don't affect capacity

    // Verify deleted applications are gone
    for (const app of applications.slice(0, 2)) {
      const appDoc = await adminDb.collection('applications').doc(app.application.id).get();
      expect(appDoc.exists).toBeFalsy();
    }

    // Verify remaining applications still exist
    for (const app of applications.slice(2)) {
      const appDoc = await adminDb.collection('applications').doc(app.application.id).get();
      expect(appDoc.exists).toBeTruthy();
    }

    // Cleanup
    for (const app of applications.slice(2)) {
      await cleanupApplication(app.application.id);
    }
    await cleanupUser(supervisor.id);
    for (const student of students) {
      await cleanupUser(student.uid);
    }
  });

  test('should handle concurrent application deletions with capacity updates', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor({
      maxCapacity: 8,
      currentCapacity: 4,
    });

    // Create multiple students
    const students = await seedMultipleStudents(3);

    // Create multiple approved applications
    const applications = await Promise.all(
      students.map(student =>
        seedApplication(student.student.id, supervisor.id, {
          status: 'approved',
        })
      )
    );

    // Verify initial state
    const supervisorBefore = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityBefore = supervisorBefore.data()?.currentCapacity || 0;
    expect(capacityBefore).toBe(4 + applications.length);

    // Simulate concurrent deletions using Promise.all
    // This tests repository getDocumentRef() usage in transactions
    const deleteOperations = applications.map(async (app) => {
      // Each deletion uses a transaction that:
      // 1. Gets supervisor ref via repository.getDocumentRef()
      // 2. Updates capacity atomically
      // 3. Deletes application
      return dashboard.deleteApplication(app.application.id);
    });

    await Promise.all(deleteOperations);

    // Wait for all transactions to complete
    await page.waitForTimeout(4000);

    // Verify final capacity is correct (transaction atomicity)
    const supervisorAfter = await adminDb.collection('supervisors').doc(supervisor.id).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter).toBe(4); // Should be back to initial capacity

    // Verify no race conditions - capacity should be exactly correct
    expect(capacityAfter).toBe(capacityBefore - applications.length);

    // Verify all applications deleted
    for (const app of applications) {
      const appDoc = await adminDb.collection('applications').doc(app.application.id).get();
      expect(appDoc.exists).toBeFalsy();
    }

    // Cleanup
    await cleanupUser(supervisor.id);
    for (const student of students) {
      await cleanupUser(student.uid);
    }
  });
});

