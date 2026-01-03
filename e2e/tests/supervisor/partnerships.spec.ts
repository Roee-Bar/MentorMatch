/**
 * Supervisor Partnership Requests E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { SupervisorDashboard } from '../../pages/SupervisorDashboard';
import { seedSupervisor, seedProject, seedSupervisorPartnershipRequest, cleanupUser, cleanupProject, cleanupSupervisorPartnershipRequest } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';
import type { Supervisor, Project } from '@/types/database';

test.describe('Supervisor - Partnership Requests', () => {
  test('should create partnership request', async ({ page, authenticatedSupervisor }) => {
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
    // This tests the repository pattern indirectly
    const response = await page.request.post('/api/supervisor-partnerships/request', {
      data: {
        targetSupervisorId: targetSupervisor.id,
        projectId: project.id,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Verify request was created in database using repository pattern
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

  test('should accept partnership request', async ({ page, authenticatedSupervisor }) => {
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
    const response = await page.request.post(`/api/supervisor-partnerships/${request.id}/respond`, {
      data: {
        action: 'accept',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Wait for database updates
    await page.waitForTimeout(2000);

    // Verify request status updated (repository pattern)
    const requestDoc = await adminDb.collection('supervisor-partnership-requests').doc(request.id).get();
    expect(requestDoc.exists).toBeTruthy();
    const requestData = requestDoc.data();
    expect(requestData?.status).toBe('accepted');
    expect(requestData?.respondedAt).toBeDefined();

    // Verify project updated with co-supervisor (repository pattern)
    const projectAfter = await adminDb.collection('projects').doc(project.id).get();
    const projectData = projectAfter.data();
    expect(projectData?.coSupervisorId).toBe(authenticatedSupervisor.uid);
    expect(projectData?.coSupervisorName).toBe(authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor');

    // Verify target supervisor capacity increased (repository pattern in transaction)
    const supervisorAfter = await adminDb.collection('supervisors').doc(authenticatedSupervisor.uid).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter).toBe(capacityBefore + 1);

    // Cleanup
    await cleanupSupervisorPartnershipRequest(request.id);
    await cleanupProject(project.id);
    await cleanupUser(requestingSupervisor.id);
    await (await import('../../fixtures/db-helpers')).cleanupUser(student.id);
  });

  test('should reject partnership request', async ({ page, authenticatedSupervisor }) => {
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

    await dashboard.goto();

    // Reject partnership request via API
    const response = await page.request.post(`/api/supervisor-partnerships/${request.id}/respond`, {
      data: {
        action: 'reject',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Wait for database updates
    await page.waitForTimeout(2000);

    // Verify request status updated (repository pattern)
    const requestDoc = await adminDb.collection('supervisor-partnership-requests').doc(request.id).get();
    expect(requestDoc.exists).toBeTruthy();
    const requestData = requestDoc.data();
    expect(requestData?.status).toBe('rejected');
    expect(requestData?.respondedAt).toBeDefined();

    // Verify project NOT updated with co-supervisor
    const projectAfter = await adminDb.collection('projects').doc(project.id).get();
    const projectData = projectAfter.data();
    expect(projectData?.coSupervisorId).toBeUndefined();

    // Cleanup
    await cleanupSupervisorPartnershipRequest(request.id);
    await cleanupProject(project.id);
    await cleanupUser(requestingSupervisor.id);
    await (await import('../../fixtures/db-helpers')).cleanupUser(student.id);
  });

  test('should cancel partnership request', async ({ page, authenticatedSupervisor }) => {
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

    // Create a partnership request
    const { request } = await seedSupervisorPartnershipRequest(
      authenticatedSupervisor.uid,
      targetSupervisor.id,
      project.id,
      {
        requestingSupervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
        targetSupervisorName: targetSupervisor.fullName,
        projectTitle: project.title,
      }
    );

    await dashboard.goto();

    // Cancel partnership request via API
    const response = await page.request.delete(`/api/supervisor-partnerships/${request.id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.ok()).toBeTruthy();

    // Wait for database updates
    await page.waitForTimeout(2000);

    // Verify request status updated (repository pattern)
    const requestDoc = await adminDb.collection('supervisor-partnership-requests').doc(request.id).get();
    expect(requestDoc.exists).toBeTruthy();
    const requestData = requestDoc.data();
    expect(requestData?.status).toBe('cancelled');

    // Cleanup
    await cleanupSupervisorPartnershipRequest(request.id);
    await cleanupProject(project.id);
    await cleanupUser(targetSupervisor.id);
    await (await import('../../fixtures/db-helpers')).cleanupUser(student.id);
  });

  test('should handle concurrent partnership requests', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    // Create multiple requesting supervisors and a project
    const { supervisor: requestingSupervisor1 } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 1,
    });
    const { supervisor: requestingSupervisor2 } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 1,
    });

    const { student } = await (await import('../../fixtures/db-helpers')).seedStudent();
    const { project } = await seedProject({
      supervisorId: requestingSupervisor1.id,
      supervisorName: requestingSupervisor1.fullName,
      studentIds: [student.id],
      studentNames: [student.fullName],
      status: 'in_progress',
      title: 'Test Project for Concurrent Partnership',
      description: 'Test project description',
    });

    // Create two partnership requests for the same project (should only one succeed)
    const { request: request1 } = await seedSupervisorPartnershipRequest(
      requestingSupervisor1.id,
      authenticatedSupervisor.uid,
      project.id,
      {
        requestingSupervisorName: requestingSupervisor1.fullName,
        targetSupervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
        projectTitle: project.title,
      }
    );

    const { request: request2 } = await seedSupervisorPartnershipRequest(
      requestingSupervisor2.id,
      authenticatedSupervisor.uid,
      project.id,
      {
        requestingSupervisorName: requestingSupervisor2.fullName,
        targetSupervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
        projectTitle: project.title,
      }
    );

    // Verify initial target supervisor capacity
    const supervisorBefore = await adminDb.collection('supervisors').doc(authenticatedSupervisor.uid).get();
    const capacityBefore = supervisorBefore.data()?.currentCapacity || 0;

    await dashboard.goto();

    // Accept both requests concurrently (tests transaction atomicity)
    const [response1, response2] = await Promise.all([
      page.request.post(`/api/supervisor-partnerships/${request1.id}/respond`, {
        data: { action: 'accept' },
        headers: { 'Content-Type': 'application/json' },
      }),
      page.request.post(`/api/supervisor-partnerships/${request2.id}/respond`, {
        data: { action: 'accept' },
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);

    // At least one should succeed, but only one should actually update the project
    await page.waitForTimeout(2000);

    // Verify only one request was accepted (transaction should prevent both)
    const request1Doc = await adminDb.collection('supervisor-partnership-requests').doc(request1.id).get();
    const request2Doc = await adminDb.collection('supervisor-partnership-requests').doc(request2.id).get();
    
    const request1Data = request1Doc.data();
    const request2Data = request2Doc.data();
    
    const acceptedCount = [request1Data?.status, request2Data?.status].filter(s => s === 'accepted').length;
    expect(acceptedCount).toBeLessThanOrEqual(1);

    // Verify project has at most one co-supervisor (transaction atomicity)
    const projectAfter = await adminDb.collection('projects').doc(project.id).get();
    const projectData = projectAfter.data();
    if (projectData?.coSupervisorId) {
      expect(projectData.coSupervisorId).toBe(authenticatedSupervisor.uid);
    }

    // Verify capacity increased by at most 1 (transaction atomicity)
    const supervisorAfter = await adminDb.collection('supervisors').doc(authenticatedSupervisor.uid).get();
    const capacityAfter = supervisorAfter.data()?.currentCapacity || 0;
    expect(capacityAfter - capacityBefore).toBeLessThanOrEqual(1);

    // Cleanup
    await cleanupSupervisorPartnershipRequest(request1.id);
    await cleanupSupervisorPartnershipRequest(request2.id);
    await cleanupProject(project.id);
    await cleanupUser(requestingSupervisor1.id);
    await cleanupUser(requestingSupervisor2.id);
    await (await import('../../fixtures/db-helpers')).cleanupUser(student.id);
  });
});

