/**
 * Test Scenario Factories
 * 
 * Factories for common test scenarios to reduce setup duplication.
 * Each factory creates a complete scenario with all necessary entities.
 */

import type { Student, Supervisor, Admin, Application, Project, SupervisorPartnershipRequest } from '@/types/database';
import { 
  seedStudent, 
  seedSupervisor, 
  seedAdmin,
  seedApplication,
  seedProject,
  cleanupUser,
  cleanupApplication,
  cleanupProject
} from './db-helpers';
import { StudentBuilder, SupervisorBuilder, ApplicationBuilder, ProjectBuilder } from './test-data-builder';

/**
 * Application Scenario
 * Creates a student, supervisor, and application
 */
export interface ApplicationScenario {
  student: { uid: string; student: Student };
  supervisor: { uid: string; supervisor: Supervisor };
  application: { id: string; application: Application };
  cleanup: () => Promise<void>;
}

export async function createApplicationScenario(options?: {
  applicationStatus?: Application['status'];
  supervisorCapacity?: number;
  supervisorCurrentCapacity?: number;
  studentOverrides?: Partial<Student>;
  supervisorOverrides?: Partial<Supervisor>;
  applicationOverrides?: Partial<Application>;
}): Promise<ApplicationScenario> {
  // Create student
  const student = await seedStudent(options?.studentOverrides);
  
  // Create supervisor
  const supervisor = await seedSupervisor({
    maxCapacity: options?.supervisorCapacity ?? 5,
    currentCapacity: options?.supervisorCurrentCapacity ?? 0,
    ...options?.supervisorOverrides,
  });
  
  // Create application
  const application = await seedApplication(
    student.uid,
    supervisor.supervisor.id,
    {
      status: options?.applicationStatus ?? 'pending',
      ...options?.applicationOverrides,
    }
  );
  
  return {
    student,
    supervisor,
    application,
    async cleanup() {
      await cleanupApplication(application.id);
      await cleanupUser(student.uid);
      await cleanupUser(supervisor.uid);
    },
  };
}

/**
 * Partnership Scenario
 * Creates two students with a partnership
 */
export interface PartnershipScenario {
  student1: { uid: string; student: Student };
  student2: { uid: string; student: Student };
  cleanup: () => Promise<void>;
}

export async function createPartnershipScenario(options?: {
  student1Overrides?: Partial<Student>;
  student2Overrides?: Partial<Student>;
}): Promise<PartnershipScenario> {
  // Create first student
  const student1 = await seedStudent({
    partnershipStatus: 'paired',
    ...options?.student1Overrides,
  });
  
  // Create second student with partnership
  const student2 = await seedStudent({
    partnershipStatus: 'paired',
    partnerId: student1.uid,
    hasPartner: true,
    partnerName: student1.student.fullName,
    partnerEmail: student1.student.email,
    ...options?.student2Overrides,
  });
  
  // Update first student to have partner
  const { adminDb } = await import('@/lib/firebase-admin');
  await adminDb.collection('students').doc(student1.uid).update({
    partnerId: student2.uid,
    hasPartner: true,
    partnerName: student2.student.fullName,
    partnerEmail: student2.student.email,
  });
  
  return {
    student1,
    student2,
    async cleanup() {
      await cleanupUser(student1.uid);
      await cleanupUser(student2.uid);
    },
  };
}

/**
 * Project Scenario
 * Creates a supervisor, students, and a project
 */
export interface ProjectScenario {
  supervisor: { uid: string; supervisor: Supervisor };
  students: Array<{ uid: string; student: Student }>;
  project: { projectId: string; project: Project };
  cleanup: () => Promise<void>;
}

export async function createProjectScenario(options?: {
  studentCount?: number;
  projectStatus?: Project['status'];
  supervisorOverrides?: Partial<Supervisor>;
  studentOverrides?: Partial<Student>;
  projectOverrides?: Partial<Project>;
}): Promise<ProjectScenario> {
  const studentCount = options?.studentCount ?? 1;
  
  // Create supervisor
  const supervisor = await seedSupervisor(options?.supervisorOverrides);
  
  // Create students
  const students = await Promise.all(
    Array.from({ length: studentCount }, () => seedStudent(options?.studentOverrides))
  );
  
  // Create project
  const project = await seedProject({
    supervisorId: supervisor.supervisor.id,
    supervisorName: supervisor.supervisor.fullName,
    studentIds: students.map(s => s.uid),
    studentNames: students.map(s => s.student.fullName),
    status: options?.projectStatus ?? 'in_progress',
    ...options?.projectOverrides,
  });
  
  return {
    supervisor,
    students,
    project,
    async cleanup() {
      await cleanupProject(project.projectId);
      await cleanupUser(supervisor.uid);
      await Promise.all(students.map(s => cleanupUser(s.uid)));
    },
  };
}


/**
 * Multiple Applications Scenario
 * Creates a supervisor with multiple applications from different students
 */
export interface MultipleApplicationsScenario {
  supervisor: { uid: string; supervisor: Supervisor };
  students: Array<{ uid: string; student: Student }>;
  applications: Array<{ id: string; application: Application }>;
  cleanup: () => Promise<void>;
}

export async function createMultipleApplicationsScenario(options?: {
  applicationCount?: number;
  applicationStatuses?: Application['status'][];
  supervisorCapacity?: number;
}): Promise<MultipleApplicationsScenario> {
  const applicationCount = options?.applicationCount ?? 3;
  const statuses = options?.applicationStatuses ?? Array(applicationCount).fill('pending' as Application['status']);
  
  // Create supervisor
  const supervisor = await seedSupervisor({
    maxCapacity: options?.supervisorCapacity ?? 10,
    currentCapacity: 0,
  });
  
  // Create students
  const students = await Promise.all(
    Array.from({ length: applicationCount }, () => seedStudent())
  );
  
  // Create applications
  const applications = await Promise.all(
    students.map((student, index) =>
      seedApplication(student.uid, supervisor.supervisor.id, {
        status: statuses[index] || 'pending',
      })
    )
  );
  
  return {
    supervisor,
    students,
    applications,
    async cleanup() {
      await Promise.all(applications.map(app => cleanupApplication(app.id)));
      await cleanupUser(supervisor.uid);
      await Promise.all(students.map(s => cleanupUser(s.uid)));
    },
  };
}

