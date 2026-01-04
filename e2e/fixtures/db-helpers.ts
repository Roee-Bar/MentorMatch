/**
 * Database Helpers for E2E Tests
 * 
 * Utilities for seeding and cleaning up test data in in-memory test database.
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Student, Supervisor, Admin, Application, Project, SupervisorPartnershipRequest } from '@/types/database';
import { generateStudentData, generateSupervisorData, generateAdminData, generateApplicationData, generateProjectData } from './test-data';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Seed a test student in Firestore
 */
export async function seedStudent(overrides?: Partial<Student>): Promise<{ uid: string; student: Student }> {
  const studentData = generateStudentData(overrides);
  
  // Create auth user first
  const userRecord = await adminAuth.createUser({
    email: studentData.email,
    password: 'TestPassword123!',
    displayName: studentData.fullName,
    emailVerified: true,
  });

  // Create user document
  // Note: Don't include userId field - the document ID is used as the id
  await adminDb.collection('users').doc(userRecord.uid).set({
    email: studentData.email,
    name: studentData.fullName,
    role: 'student',
    department: studentData.department,
    createdAt: new Date(),
  });

  // Create student document
  // Remove undefined values to avoid Firestore errors
  const cleanStudentData = Object.fromEntries(
    Object.entries(studentData).filter(([_, value]) => value !== undefined)
  ) as typeof studentData;
  await adminDb.collection('students').doc(userRecord.uid).set(cleanStudentData);

  return {
    uid: userRecord.uid,
    student: { id: userRecord.uid, ...studentData } as Student,
  };
}

/**
 * Seed a test supervisor in Firestore
 */
export async function seedSupervisor(overrides?: Partial<Supervisor>): Promise<{ uid: string; supervisor: Supervisor }> {
  const supervisorData = generateSupervisorData(overrides);
  
  // Create auth user first
  const userRecord = await adminAuth.createUser({
    email: supervisorData.email,
    password: 'TestPassword123!',
    displayName: supervisorData.fullName,
    emailVerified: true,
  });

  // Create user document
  // Note: Don't include userId field - the document ID is used as the id
  await adminDb.collection('users').doc(userRecord.uid).set({
    email: supervisorData.email,
    name: supervisorData.fullName,
    role: 'supervisor',
    department: supervisorData.department,
    createdAt: new Date(),
  });

  // Create supervisor document
  // Remove undefined values to avoid Firestore errors
  const cleanSupervisorData = Object.fromEntries(
    Object.entries(supervisorData).filter(([_, value]) => value !== undefined)
  ) as typeof supervisorData;
  await adminDb.collection('supervisors').doc(userRecord.uid).set(cleanSupervisorData);

  return {
    uid: userRecord.uid,
    supervisor: { id: userRecord.uid, ...supervisorData } as Supervisor,
  };
}

/**
 * Seed a test admin in Firestore
 */
export async function seedAdmin(overrides?: Partial<Admin>): Promise<{ uid: string; admin: Admin }> {
  const adminData = generateAdminData(overrides);
  
  // Create auth user first
  const userRecord = await adminAuth.createUser({
    email: adminData.email,
    password: 'TestPassword123!',
    displayName: adminData.fullName,
    emailVerified: true,
  });

  // Create user document
  // Note: Don't include userId field - the document ID is used as the id
  await adminDb.collection('users').doc(userRecord.uid).set({
    email: adminData.email,
    name: adminData.fullName,
    role: 'admin',
    department: adminData.department,
    createdAt: new Date(),
  });

  // Create admin document
  // Remove undefined values to avoid Firestore errors
  const cleanAdminData = Object.fromEntries(
    Object.entries(adminData).filter(([_, value]) => value !== undefined)
  ) as typeof adminData;
  await adminDb.collection('admins').doc(userRecord.uid).set(cleanAdminData);

  return {
    uid: userRecord.uid,
    admin: { id: userRecord.uid, ...adminData } as Admin,
  };
}

/**
 * Seed a test application in Firestore
 */
export async function seedApplication(
  studentId: string,
  supervisorId: string,
  overrides?: Partial<Application>
): Promise<{ id: string; application: Application }> {
  const applicationData = generateApplicationData(studentId, supervisorId, overrides);
  // Remove undefined values to avoid Firestore errors
  const cleanApplicationData = Object.fromEntries(
    Object.entries(applicationData).filter(([_, value]) => value !== undefined)
  ) as typeof applicationData;
  const docRef = await adminDb.collection('applications').add(cleanApplicationData);
  
  return {
    id: docRef.id,
    application: { id: docRef.id, ...applicationData } as Application,
  };
}

/**
 * Seed a test project in Firestore
 */
export async function seedProject(overrides?: Partial<Project>): Promise<{ projectId: string; project: Project }> {
  const projectData = generateProjectData(overrides);
  // Remove undefined values to avoid Firestore errors
  const cleanProjectData = Object.fromEntries(
    Object.entries(projectData).filter(([_, value]) => value !== undefined)
  ) as typeof projectData;
  const docRef = await adminDb.collection('projects').add(cleanProjectData);
  
  return {
    projectId: docRef.id,
    project: { id: docRef.id, ...projectData } as Project,
  };
}

/**
 * Clean up a user and all related data
 */
export async function cleanupUser(uid: string): Promise<void> {
  // Delete from all collections
  const collections = ['users', 'students', 'supervisors', 'admins'];
  
  for (const collection of collections) {
    try {
      await adminDb.collection(collection).doc(uid).delete();
    } catch (error) {
      // Document might not exist, ignore
    }
  }

  // Delete auth user
  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    // User might not exist, ignore
  }
}

/**
 * Clean up an application
 */
export async function cleanupApplication(applicationId: string): Promise<void> {
  try {
    await adminDb.collection('applications').doc(applicationId).delete();
  } catch (error) {
    // Document might not exist, ignore
  }
}

/**
 * Clean up a project
 */
export async function cleanupProject(projectId: string): Promise<void> {
  try {
    await adminDb.collection('projects').doc(projectId).delete();
  } catch (error) {
    // Document might not exist, ignore
  }
}

/**
 * Seed multiple students with various partnership statuses
 */
export async function seedMultipleStudentsWithPartnerships(
  count: number,
  options?: {
    pairedCount?: number;
    pendingSentCount?: number;
    pendingReceivedCount?: number;
    noneCount?: number;
  }
): Promise<Array<{ uid: string; student: Student }>> {
  const students: Array<{ uid: string; student: Student }> = [];
  
  // Seed paired students
  const pairedCount = options?.pairedCount || 0;
  for (let i = 0; i < pairedCount; i++) {
    const student1 = await seedStudent({ partnershipStatus: 'paired' });
    const student2 = await seedStudent({ 
      partnershipStatus: 'paired',
      partnerId: student1.uid,
      hasPartner: true,
      partnerName: student1.student.fullName,
      partnerEmail: student1.student.email,
    });
    // Update student1 to have partner
    await adminDb.collection('students').doc(student1.uid).update({
      partnerId: student2.uid,
      hasPartner: true,
      partnerName: student2.student.fullName,
      partnerEmail: student2.student.email,
    });
    students.push(student1, student2);
  }
  
  // Seed students with pending sent status
  const pendingSentCount = options?.pendingSentCount || 0;
  for (let i = 0; i < pendingSentCount; i++) {
    students.push(await seedStudent({ partnershipStatus: 'pending_sent' }));
  }
  
  // Seed students with pending received status
  const pendingReceivedCount = options?.pendingReceivedCount || 0;
  for (let i = 0; i < pendingReceivedCount; i++) {
    students.push(await seedStudent({ partnershipStatus: 'pending_received' }));
  }
  
  // Seed students with none status
  const noneCount = options?.noneCount || (count - pairedCount * 2 - pendingSentCount - pendingReceivedCount);
  for (let i = 0; i < noneCount; i++) {
    students.push(await seedStudent({ partnershipStatus: 'none' }));
  }
  
  return students;
}

/**
 * Seed multiple students in parallel
 */
export async function seedMultipleStudents(
  count: number,
  overrides?: Partial<Student>
): Promise<Array<{ uid: string; student: Student }>> {
  return Promise.all(
    Array.from({ length: count }, () => seedStudent(overrides))
  );
}

/**
 * Seed multiple supervisors in parallel
 */
export async function seedMultipleSupervisors(
  count: number,
  overrides?: Partial<Supervisor>
): Promise<Array<{ uid: string; supervisor: Supervisor }>> {
  return Promise.all(
    Array.from({ length: count }, () => seedSupervisor(overrides))
  );
}

/**
 * Seed multiple admins in parallel
 */
export async function seedMultipleAdmins(
  count: number,
  overrides?: Partial<Admin>
): Promise<Array<{ uid: string; admin: Admin }>> {
  return Promise.all(
    Array.from({ length: count }, () => seedAdmin(overrides))
  );
}

/**
 * Clean up all test data (use with caution)
 */
export async function cleanupAllTestData(): Promise<void> {
  // This is a destructive operation - only use in test teardown
  const collections = ['users', 'students', 'supervisors', 'admins', 'applications', 'projects', 'partnership_requests', 'supervisor-partnership-requests'];
  
  for (const collection of collections) {
    const snapshot = await adminDb.collection(collection).get();
    const batch = adminDb.batch();
    
    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }

  // Note: Auth users are cleaned up individually via cleanupUser
}

