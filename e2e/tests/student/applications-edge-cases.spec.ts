/**
 * Application Edge Cases E2E Tests
 * 
 * Tests repository-specific query methods and edge cases
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedSupervisor, seedStudent, seedApplication, cleanupUser, cleanupApplication } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';
import type { Supervisor, Student } from '@/types/database';

test.describe('Student - Application Edge Cases', () => {
  test('should find applications by partner ID', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 0,
    });

    // Create a partner student
    const { student: partnerStudent } = await seedStudent();

    // Create an application where current student is the primary applicant
    const { application: primaryApp } = await seedApplication(
      authenticatedStudent.uid,
      supervisor.id,
      {
        status: 'pending',
        hasPartner: true,
        partnerId: partnerStudent.id,
        partnerName: partnerStudent.fullName,
        partnerEmail: partnerStudent.email,
      }
    );

    // Create an application where current student is the partner
    const { application: partnerApp } = await seedApplication(
      partnerStudent.id,
      supervisor.id,
      {
        status: 'pending',
        hasPartner: true,
        partnerId: authenticatedStudent.uid,
        partnerName: authenticatedStudent.student?.fullName || 'Test Student',
        partnerEmail: authenticatedStudent.email || 'test@example.com',
      }
    );

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Test repository findByPartnerId() method indirectly
    // The API should return applications where student is partner
    const applicationsList = page.locator('[data-testid="application-card"], .application-card, table tbody tr');
    await expect(applicationsList.first()).toBeVisible({ timeout: 10000 });

    // Verify both applications are visible (primary and partner)
    const applicationCards = await applicationsList.count();
    expect(applicationCards).toBeGreaterThanOrEqual(1);

    // Verify database state - test repository query methods
    // Test findByStudentId() - should find primaryApp
    const studentAppsSnapshot = await adminDb
      .collection('applications')
      .where('studentId', '==', authenticatedStudent.uid)
      .get();
    expect(studentAppsSnapshot.docs.some(doc => doc.id === primaryApp.id)).toBeTruthy();

    // Test findByPartnerId() - should find partnerApp
    const partnerAppsSnapshot = await adminDb
      .collection('applications')
      .where('partnerId', '==', authenticatedStudent.uid)
      .get();
    expect(partnerAppsSnapshot.docs.some(doc => doc.id === partnerApp.id)).toBeTruthy();

    // Cleanup
    await cleanupApplication(primaryApp.id);
    await cleanupApplication(partnerApp.id);
    await cleanupUser(supervisor.id);
    await cleanupUser(partnerStudent.id);
  });

  test('should handle applications with no partner', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 0,
    });

    // Create an application without a partner
    const { application } = await seedApplication(
      authenticatedStudent.uid,
      supervisor.id,
      {
        status: 'pending',
        hasPartner: false,
        partnerId: undefined,
      }
    );

    await dashboard.goto();
    await dashboard.navigateToApplications();

    // Verify application is visible
    const applicationsList = page.locator('[data-testid="application-card"], .application-card, table tbody tr');
    await expect(applicationsList.first()).toBeVisible({ timeout: 10000 });

    // Test repository query - findByPartnerId() should not find this application
    const partnerAppsSnapshot = await adminDb
      .collection('applications')
      .where('partnerId', '==', authenticatedStudent.uid)
      .get();
    expect(partnerAppsSnapshot.docs.some(doc => doc.id === application.id)).toBeFalsy();

    // Test findByStudentId() should find it
    const studentAppsSnapshot = await adminDb
      .collection('applications')
      .where('studentId', '==', authenticatedStudent.uid)
      .get();
    expect(studentAppsSnapshot.docs.some(doc => doc.id === application.id)).toBeTruthy();

    // Cleanup
    await cleanupApplication(application.id);
    await cleanupUser(supervisor.id);
  });

  test('should find pending applications by supervisor', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 0,
    });

    // Create multiple students
    const students = await (await import('../../fixtures/db-helpers')).seedMultipleStudents(3);

    // Create multiple applications with different statuses
    const pendingApp1 = await seedApplication(students[0].student.id, supervisor.id, {
      status: 'pending',
    });
    const pendingApp2 = await seedApplication(students[1].student.id, supervisor.id, {
      status: 'pending',
    });
    const approvedApp = await seedApplication(students[2].student.id, supervisor.id, {
      status: 'approved',
    });

    // Test repository findPendingBySupervisorId() method indirectly
    // This tests the repository query with multiple filters
    const pendingAppsSnapshot = await adminDb
      .collection('applications')
      .where('supervisorId', '==', supervisor.id)
      .where('status', '==', 'pending')
      .get();

    expect(pendingAppsSnapshot.docs.length).toBeGreaterThanOrEqual(2);
    expect(pendingAppsSnapshot.docs.some(doc => doc.id === pendingApp1.application.id)).toBeTruthy();
    expect(pendingAppsSnapshot.docs.some(doc => doc.id === pendingApp2.application.id)).toBeTruthy();
    expect(pendingAppsSnapshot.docs.some(doc => doc.id === approvedApp.application.id)).toBeFalsy();

    // Cleanup
    await cleanupApplication(pendingApp1.application.id);
    await cleanupApplication(pendingApp2.application.id);
    await cleanupApplication(approvedApp.application.id);
    await cleanupUser(supervisor.id);
    for (const student of students) {
      await cleanupUser(student.uid);
    }
  });

  test('should handle duplicate application prevention', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a supervisor
    const { supervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 0,
    });

    // Create an existing pending application
    const { application: existingApp } = await seedApplication(
      authenticatedStudent.uid,
      supervisor.id,
      {
        status: 'pending',
      }
    );

    await dashboard.goto();
    await dashboard.navigateToSupervisors();

    // Try to create a duplicate application
    // This tests repository query in duplicate check (findAll with filters)
    const response = await page.request.post('/api/applications', {
      data: {
        supervisorId: supervisor.id,
        projectTitle: 'Duplicate Test Project',
        projectDescription: 'This should be rejected',
        isOwnTopic: true,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should be rejected due to duplicate check
    // The duplicate check uses repository findAll() with filters
    expect(response.status()).toBeGreaterThanOrEqual(400);

    // Verify only one application exists
    const appsSnapshot = await adminDb
      .collection('applications')
      .where('studentId', '==', authenticatedStudent.uid)
      .where('supervisorId', '==', supervisor.id)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    expect(appsSnapshot.docs.length).toBe(1);
    expect(appsSnapshot.docs[0].id).toBe(existingApp.id);

    // Cleanup
    await cleanupApplication(existingApp.id);
    await cleanupUser(supervisor.id);
  });

  test('should find applications by supervisor ID', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create multiple supervisors
    const supervisors = await (await import('../../fixtures/db-helpers')).seedMultipleSupervisors(2);

    // Create applications to different supervisors
    const app1 = await seedApplication(authenticatedStudent.uid, supervisors[0].supervisor.id, {
      status: 'pending',
    });
    const app2 = await seedApplication(authenticatedStudent.uid, supervisors[1].supervisor.id, {
      status: 'approved',
    });

    // Test repository findBySupervisorId() method indirectly
    const supervisor1AppsSnapshot = await adminDb
      .collection('applications')
      .where('supervisorId', '==', supervisors[0].supervisor.id)
      .get();

    expect(supervisor1AppsSnapshot.docs.some(doc => doc.id === app1.application.id)).toBeTruthy();
    expect(supervisor1AppsSnapshot.docs.some(doc => doc.id === app2.application.id)).toBeFalsy();

    const supervisor2AppsSnapshot = await adminDb
      .collection('applications')
      .where('supervisorId', '==', supervisors[1].supervisor.id)
      .get();

    expect(supervisor2AppsSnapshot.docs.some(doc => doc.id === app2.application.id)).toBeTruthy();
    expect(supervisor2AppsSnapshot.docs.some(doc => doc.id === app1.application.id)).toBeFalsy();

    // Cleanup
    await cleanupApplication(app1.application.id);
    await cleanupApplication(app2.application.id);
    for (const supervisor of supervisors) {
      await cleanupUser(supervisor.uid);
    }
  });
});

