/**
 * Composed Fixtures
 * 
 * Higher-level fixtures that combine multiple lower-level fixtures.
 * These fixtures provide common test scenarios with authentication and data setup.
 */

import { test as baseTest } from '@playwright/test';
import { test as authTest } from './auth';
import type { Student, Supervisor, Admin, Application, SupervisorPartnershipRequest } from '@/types/database';
import { seedSupervisor, seedApplication, cleanupUser, cleanupApplication } from './db-helpers';
import { createApplicationScenario, createPartnershipScenario } from './scenarios';

/**
 * Extended fixtures with composed scenarios
 */
type ComposedFixtures = {
  studentWithSupervisor: {
    student: { uid: string; email: string; password: string; student: Student };
    supervisor: { uid: string; supervisor: Supervisor };
    cleanup: () => Promise<void>;
  };
  studentWithApplication: {
    student: { uid: string; email: string; password: string; student: Student };
    supervisor: { uid: string; supervisor: Supervisor };
    application: { id: string; application: Application };
    cleanup: () => Promise<void>;
  };
  supervisorWithApplications: {
    supervisor: { uid: string; email: string; password: string; supervisor: Supervisor };
    students: Array<{ uid: string; student: Student }>;
    applications: Array<{ id: string; application: Application }>;
    cleanup: () => Promise<void>;
  };
  adminWithTestData: {
    admin: { uid: string; email: string; password: string; admin: Admin };
    students: Array<{ uid: string; student: Student }>;
    supervisors: Array<{ uid: string; supervisor: Supervisor }>;
    cleanup: () => Promise<void>;
  };
  studentWithPartner: {
    student1: { uid: string; email: string; password: string; student: Student };
    student2: { uid: string; student: Student };
    cleanup: () => Promise<void>;
  };
};

export const test = authTest.extend<ComposedFixtures>({
  /**
   * Authenticated student with a supervisor available
   */
  studentWithSupervisor: async ({ authenticatedStudent, page }, use) => {
    const supervisor = await seedSupervisor();
    
    await use({
      student: authenticatedStudent,
      supervisor,
      async cleanup() {
        await cleanupUser(supervisor.uid);
      },
    });
    
    // Note: authenticatedStudent cleanup is handled by the base fixture
  },

  /**
   * Authenticated student with an application
   */
  studentWithApplication: async ({ authenticatedStudent, page }, use) => {
    const supervisor = await seedSupervisor();
    const application = await seedApplication(
      authenticatedStudent.uid,
      supervisor.supervisor.id,
      { status: 'pending' }
    );
    
    await use({
      student: authenticatedStudent,
      supervisor,
      application,
      async cleanup() {
        await cleanupApplication(application.id);
        await cleanupUser(supervisor.uid);
      },
    });
  },

  /**
   * Authenticated supervisor with multiple applications
   */
  supervisorWithApplications: async ({ authenticatedSupervisor, page }, use) => {
    const applicationCount = 3;
    const students = await Promise.all(
      Array.from({ length: applicationCount }, () => 
        import('./db-helpers').then(m => m.seedStudent())
      )
    );
    
    const applications = await Promise.all(
      students.map(student =>
        seedApplication(student.uid, authenticatedSupervisor.supervisor.id, {
          status: 'pending',
        })
      )
    );
    
    await use({
      supervisor: authenticatedSupervisor,
      students,
      applications,
      async cleanup() {
        await Promise.all(applications.map(app => cleanupApplication(app.id)));
        await Promise.all(students.map(s => cleanupUser(s.uid)));
      },
    });
  },

  /**
   * Authenticated admin with seeded test data
   */
  adminWithTestData: async ({ authenticatedAdmin, page }, use) => {
    const studentCount = 5;
    const supervisorCount = 3;
    
    const students = await Promise.all(
      Array.from({ length: studentCount }, () => 
        import('./db-helpers').then(m => m.seedStudent())
      )
    );
    
    const supervisors = await Promise.all(
      Array.from({ length: supervisorCount }, () => 
        import('./db-helpers').then(m => m.seedSupervisor())
      )
    );
    
    await use({
      admin: authenticatedAdmin,
      students,
      supervisors,
      async cleanup() {
        await Promise.all(students.map(s => cleanupUser(s.uid)));
        await Promise.all(supervisors.map(s => cleanupUser(s.uid)));
      },
    });
  },

  /**
   * Authenticated student with a partner
   */
  studentWithPartner: async ({ authenticatedStudent, page }, use) => {
    const partnershipScenario = await createPartnershipScenario({
      student1Overrides: {
        email: authenticatedStudent.email,
        firstName: authenticatedStudent.student.firstName,
        lastName: authenticatedStudent.student.lastName,
      },
    });
    
    // Update the first student to match authenticated student
    const { adminDb } = await import('@/lib/firebase-admin');
    await adminDb.collection('students').doc(authenticatedStudent.uid).update({
      partnerId: partnershipScenario.student2.uid,
      hasPartner: true,
      partnerName: partnershipScenario.student2.student.fullName,
      partnerEmail: partnershipScenario.student2.student.email,
      partnershipStatus: 'paired',
    });
    
    await use({
      student1: {
        ...authenticatedStudent,
        student: {
          ...authenticatedStudent.student,
          partnerId: partnershipScenario.student2.uid,
          hasPartner: true,
          partnerName: partnershipScenario.student2.student.fullName,
          partnerEmail: partnershipScenario.student2.student.email,
          partnershipStatus: 'paired',
        },
      },
      student2: partnershipScenario.student2,
      async cleanup() {
        await cleanupUser(partnershipScenario.student2.uid);
      },
    });
  },
});

export { expect } from '@playwright/test';

