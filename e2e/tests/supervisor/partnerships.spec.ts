/**
 * Supervisor Partnership Requests E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { SupervisorDashboard } from '../../pages/SupervisorDashboard';
import { seedSupervisor, seedProject, seedSupervisorPartnershipRequest, cleanupUser, cleanupProject, cleanupSupervisorPartnershipRequest } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';
import { authenticatedRequest } from '../../utils/auth-helpers';

test.describe('Supervisor - Partnership Requests @supervisor @regression', () => {
  test('should create partnership request @regression', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    // Create a target supervisor and a project
    const { supervisor: targetSupervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 2,
    });

    const { student } = await (await import('../../fixtures/db-helpers')).seedStudent();
    const { project } = await seedProject({
      supervisorId: authenticatedSupervisor.uid,
      supervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
      studentIds: [student.id],
      studentNames: [student.fullName],
      status: 'in_progress',
      title: 'Test Project for Partnership',
      description: 'Test project description',
    });

    await dashboard.goto();

    // Create partnership request via API (since UI may not exist)
    const response = await authenticatedRequest(page, 'POST', '/api/supervisor-partnerships/request', {
      data: {
        targetSupervisorId: targetSupervisor.id,
        projectId: project.id,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Verify request was created in database
    const requestsSnapshot = await adminDb
      .collection('supervisor-partnership-requests')
      .where('requestingSupervisorId', '==', authenticatedSupervisor.uid)
      .where('projectId', '==', project.id)
      .where('status', '==', 'pending')
      .get();

    expect(requestsSnapshot.empty).toBeFalsy();
    const requestData = requestsSnapshot.docs[0].data();
    expect(requestData.targetSupervisorId).toBe(targetSupervisor.id);
    expect(requestData.projectId).toBe(project.id);

    // Cleanup
    if (!requestsSnapshot.empty) {
      await cleanupSupervisorPartnershipRequest(requestsSnapshot.docs[0].id);
    }
    await cleanupProject(project.id);
    await cleanupUser(targetSupervisor.id);
    await (await import('../../fixtures/db-helpers')).cleanupUser(student.id);
  });

  test('should accept partnership request @regression', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    // Create a requesting supervisor and a project
    const { supervisor: requestingSupervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 1,
    });

    const { student } = await (await import('../../fixtures/db-helpers')).seedStudent();
    const { project } = await seedProject({
      supervisorId: requestingSupervisor.id,
      supervisorName: requestingSupervisor.fullName,
      studentIds: [student.id],
      studentNames: [student.fullName],
      status: 'in_progress',
      title: 'Test Project for Partnership',
      description: 'Test project description',
    });

    // Create a partnership request
    const { request } = await seedSupervisorPartnershipRequest(
      requestingSupervisor.id,
      authenticatedSupervisor.uid,
      project.id,
      {
        requestingSupervisorName: requestingSupervisor.fullName,
        targetSupervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
        projectTitle: project.title,
      }
    );

    // Verify initial project state
    const projectBefore = await adminDb.collection('projects').doc(project.id).get();
    expect(projectBefore.data()?.coSupervisorId).toBeUndefined();

    // Verify initial target supervisor capacity
    const supervisorBefore = await adminDb.collection('supervisors').doc(authenticatedSupervisor.uid).get();
    const capacityBefore = supervisorBefore.data()?.currentCapacity || 0;

    await dashboard.goto();

    // Accept partnership request via API
    const response = await authenticatedRequest(page, 'POST', `/api/supervisor-partnerships/${request.id}/respond`, {
      data: {
        action: 'accept',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Wait for database updates
    await page.waitForTimeout(2000);

    // Verify request status updated
    const requestDoc = await adminDb.collection('supervisor-partnership-requests').doc(request.id).get();
    expect(requestDoc.exists).toBeTruthy();
    const requestData = requestDoc.data();
    expect(requestData?.status).toBe('accepted');
    expect(requestData?.respondedAt).toBeDefined();

    // Verify project updated with co-supervisor
    const projectAfter = await adminDb.collection('projects').doc(project.id).get();
    const projectData = projectAfter.data();
    expect(projectData?.coSupervisorId).toBe(authenticatedSupervisor.uid);
    expect(projectData?.coSupervisorName).toBe(authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor');

    // Verify target supervisor capacity increased
    const supervisorAfter = await adminDb.collection('supervisors').doc(authenticatedSupervisor.uid).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter).toBe(capacityBefore + 1);

    // Cleanup
    await cleanupSupervisorPartnershipRequest(request.id);
    await cleanupProject(project.id);
    await cleanupUser(requestingSupervisor.id);
    await (await import('../../fixtures/db-helpers')).cleanupUser(student.id);
  });
});

