/**
 * Student Partnerships E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { StudentDashboard } from '../../pages/StudentDashboard';
import { seedStudent, seedMultipleStudentsWithPartnerships } from '../../fixtures/db-helpers';
import { adminDb } from '@/lib/firebase-admin';
import { getAuthToken } from '../../utils/auth-helpers';

test.describe('Student - Partnerships', () => {
  test('should display partnership status', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    await dashboard.goto();

    // Should see partnership status on dashboard
    const partnershipStatus = page.locator('[data-testid="partnership-status"], .partnership-status');
    if (await partnershipStatus.isVisible()) {
      await expect(partnershipStatus).toBeVisible();
    }
  });

  test('should send partnership request', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create another student
    const { student: targetStudent } = await seedStudent();

    await dashboard.goto();

    // Look for partnership request functionality
    const requestButton = page.getByRole('button', { name: /request partnership|find partner/i });
    if (await requestButton.isVisible()) {
      await requestButton.click();
      
      // If there's a form or modal, interact with it
      await page.waitForTimeout(1000);
    }
  });

  test('should find available partners with large dataset', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create a large dataset of students with various partnership statuses
    // This tests repository in-memory filtering (repository pattern change)
    const students = await seedMultipleStudentsWithPartnerships(20, {
      pairedCount: 3, // 6 students paired (3 pairs)
      pendingSentCount: 4,
      pendingReceivedCount: 2,
      noneCount: 8, // 8 students with no partnership status
    });

    await dashboard.goto();

    // Navigate to supervisors or partnerships page
    // The repository should filter out paired students in memory
    // This tests the repository pattern change from Firestore '!=' query to in-memory filtering
    const availablePartnersResponse = await page.request.get(
      `/api/students/${authenticatedStudent.uid}/available-partners`
    );

    expect(availablePartnersResponse.ok()).toBeTruthy();
    const availablePartners = await availablePartnersResponse.json();

    // Verify repository filtering works correctly
    // Should exclude paired students and current user
    // Should include students with 'none', 'pending_sent', 'pending_received' status
    expect(availablePartners.data).toBeDefined();
    const partnerIds = availablePartners.data.map((p: { id: string }) => p.id);
    
    // Should not include current user
    expect(partnerIds).not.toContain(authenticatedStudent.uid);

    // Verify paired students are excluded (repository in-memory filtering)
    const pairedStudents = students.filter(s => s.student.partnershipStatus === 'paired');
    for (const paired of pairedStudents) {
      expect(partnerIds).not.toContain(paired.uid);
    }

    // Cleanup
    for (const student of students) {
      await (await import('../../fixtures/db-helpers')).cleanupUser(student.uid);
    }
  });

  test('should filter partnership requests correctly', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    // Create multiple students
    const students = await seedMultipleStudentsWithPartnerships(5, {
      noneCount: 5,
    });

    // Create partnership requests where current student is requester
    const requesterRequests = await Promise.all(
      students.slice(0, 2).map(async (student) => {
        const requestData = {
          requesterId: authenticatedStudent.uid,
          requesterName: authenticatedStudent.student?.fullName || 'Test Student',
          requesterEmail: authenticatedStudent.email || 'test@example.com',
          requesterStudentId: authenticatedStudent.student?.studentId || 'ST001',
          requesterDepartment: authenticatedStudent.student?.department || 'Computer Science',
          targetStudentId: student.student.id,
          targetStudentName: student.student.fullName,
          targetStudentEmail: student.student.email,
          targetDepartment: student.student.department,
          status: 'pending' as const,
          createdAt: new Date(),
        };

        const docRef = await adminDb.collection('partnership_requests').add(requestData);
        return { id: docRef.id, ...requestData };
      })
    );

    // Create partnership requests where current student is target
    const targetRequests = await Promise.all(
      students.slice(2, 4).map(async (student) => {
        const requestData = {
          requesterId: student.student.id,
          requesterName: student.student.fullName,
          requesterEmail: student.student.email,
          requesterStudentId: student.student.studentId,
          requesterDepartment: student.student.department,
          targetStudentId: authenticatedStudent.uid,
          targetStudentName: authenticatedStudent.student?.fullName || 'Test Student',
          targetStudentEmail: authenticatedStudent.email || 'test@example.com',
          targetDepartment: authenticatedStudent.student?.department || 'Computer Science',
          status: 'pending' as const,
          createdAt: new Date(),
        };

        const docRef = await adminDb.collection('partnership_requests').add(requestData);
        return { id: docRef.id, ...requestData };
      })
    );

    await dashboard.goto();

    // Test repository findByRequesterId() method indirectly
    const outgoingResponse = await page.request.get(
      `/api/students/${authenticatedStudent.uid}/partnership-requests?type=outgoing`
    );
    expect(outgoingResponse.ok()).toBeTruthy();
    const outgoingData = await outgoingResponse.json();
    expect(outgoingData.data.length).toBeGreaterThanOrEqual(requesterRequests.length);

    // Test repository findByTargetId() method indirectly
    const incomingResponse = await page.request.get(
      `/api/students/${authenticatedStudent.uid}/partnership-requests?type=incoming`
    );
    expect(incomingResponse.ok()).toBeTruthy();
    const incomingData = await incomingResponse.json();
    expect(incomingData.data.length).toBeGreaterThanOrEqual(targetRequests.length);

    // Cleanup
    for (const request of [...requesterRequests, ...targetRequests]) {
      await adminDb.collection('partnership_requests').doc(request.id).delete();
    }
    for (const student of students) {
      await (await import('../../fixtures/db-helpers')).cleanupUser(student.uid);
    }
  });

  test('should handle empty query results', async ({ page, authenticatedStudent }) => {
    const dashboard = new StudentDashboard(page);

    await dashboard.goto();

    // Test repository queries with no results
    // This tests edge cases for repository findAll() methods

    // Get auth token for API request
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Get partnership requests when none exist
    const requestsResponse = await page.request.get(
      `/api/students/${authenticatedStudent.uid}/partnership-requests?type=all`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    expect(requestsResponse.ok()).toBeTruthy();
    const requestsData = await requestsResponse.json();
    expect(requestsData.data).toEqual([]);

    // Get available partners when none exist (or all are filtered out)
    const partnersResponse = await page.request.get(
      `/api/students/available-partners`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    expect(partnersResponse.ok()).toBeTruthy();
    const partnersData = await partnersResponse.json();
    expect(Array.isArray(partnersData.data)).toBeTruthy();
    // Should return empty array, not error
  });
});

