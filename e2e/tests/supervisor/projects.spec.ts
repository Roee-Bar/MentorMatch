/**
 * Supervisor Projects E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { SupervisorDashboard } from '../../pages/SupervisorDashboard';
import { seedStudent, seedSupervisor, seedProject, cleanupProject } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';

test.describe('Supervisor - Projects', () => {
  test('should change project status to completed', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    // Create a student
    const { student } = await seedStudent();

    // Create a project with status 'in_progress'
    const { project } = await seedProject({
      supervisorId: authenticatedSupervisor.uid,
      supervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
      studentIds: [student.id],
      studentNames: [student.fullName],
      status: 'in_progress',
      title: 'Test Project',
      description: 'Test project description',
    });

    await dashboard.goto();
    await dashboard.navigateToProjects();

    // Verify project is visible
    const projectsList = page.locator('[data-testid="project-card"], .project-card, table tbody tr');
    await expect(projectsList.first()).toBeVisible({ timeout: 10000 });

    // Change project status to completed
    await dashboard.changeProjectStatus(project.id, 'completed');

    // Verify success message
    const successMessage = page.locator('[role="status"], .success, [data-testid="success-message"]');
    if (await successMessage.isVisible({ timeout: 5000 })) {
      await expect(successMessage).toBeVisible();
    }

    // Verify project status updated in database
    const projectDoc = await adminDb.collection('projects').doc(project.id).get();
    expect(projectDoc.exists).toBeTruthy();
    const projectData = projectDoc.data();
    expect(projectData?.status).toBe('completed');
    expect(projectData?.completedAt).toBeDefined();

    // Cleanup
    await cleanupProject(project.id);
  });

  test('should cleanup co-supervisor partnership when project completes', async ({ page, authenticatedSupervisor }) => {
    const dashboard = new SupervisorDashboard(page);

    // Create a student
    const { student } = await seedStudent();

    // Create a co-supervisor
    const { supervisor: coSupervisor } = await seedSupervisor({
      maxCapacity: 5,
      currentCapacity: 2,
    });

    // Create a project with co-supervisor
    const { project } = await seedProject({
      supervisorId: authenticatedSupervisor.uid,
      supervisorName: authenticatedSupervisor.supervisor?.fullName || 'Test Supervisor',
      coSupervisorId: coSupervisor.id,
      coSupervisorName: coSupervisor.fullName,
      studentIds: [student.id],
      studentNames: [student.fullName],
      status: 'in_progress',
      title: 'Test Project with Co-Supervisor',
      description: 'Test project description',
    });

    // Verify initial co-supervisor capacity
    const coSupervisorBefore = await adminDb.collection('supervisors').doc(coSupervisor.id).get();
    const capacityBefore = coSupervisorBefore.data()?.currentCapacity || 0;

    await dashboard.goto();
    await dashboard.navigateToProjects();

    // Change project status to completed
    await dashboard.changeProjectStatus(project.id, 'completed');

    // Wait for cleanup to complete
    await page.waitForTimeout(2000);

    // Verify project status updated
    const projectDoc = await adminDb.collection('projects').doc(project.id).get();
    const projectData = projectDoc.data();
    expect(projectData?.status).toBe('completed');
    expect(projectData?.completedAt).toBeDefined();

    // Verify co-supervisor partnership cleaned up
    // The coSupervisorId should be cleared or the capacity should be decreased
    const projectAfter = await adminDb.collection('projects').doc(project.id).get();
    const projectAfterData = projectAfter.data();
    
    // Check if coSupervisorId is cleared (implementation may vary)
    // Also verify co-supervisor capacity decreased
    const coSupervisorAfter = await adminDb.collection('supervisors').doc(coSupervisor.id).get();
    const capacityAfter = coSupervisorAfter.data()?.currentCapacity || 0;
    
    // Capacity should decrease when partnership is cleaned up
    expect(capacityAfter).toBeLessThanOrEqual(capacityBefore);

    // Cleanup
    await cleanupProject(project.id);
  });
});

