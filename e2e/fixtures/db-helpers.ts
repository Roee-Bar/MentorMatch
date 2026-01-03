/**
 * Database Helpers for E2E Tests
 * 
 * Utilities for seeding and cleaning up test data in Firebase Emulator.
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Student, Supervisor, Admin, Application, Project } from '@/types/database';
import { generateStudentData, generateSupervisorData, generateAdminData, generateApplicationData, generateProjectData } from './test-data';

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
  await adminDb.collection('users').doc(userRecord.uid).set({
    userId: userRecord.uid,
    email: studentData.email,
    name: studentData.fullName,
    role: 'student',
    department: studentData.department,
    createdAt: new Date(),
  });

  // Create student document
  await adminDb.collection('students').doc(userRecord.uid).set(studentData);

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
  await adminDb.collection('users').doc(userRecord.uid).set({
    userId: userRecord.uid,
    email: supervisorData.email,
    name: supervisorData.fullName,
    role: 'supervisor',
    department: supervisorData.department,
    createdAt: new Date(),
  });

  // Create supervisor document
  await adminDb.collection('supervisors').doc(userRecord.uid).set(supervisorData);

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
  await adminDb.collection('users').doc(userRecord.uid).set({
    userId: userRecord.uid,
    email: adminData.email,
    name: adminData.fullName,
    role: 'admin',
    department: adminData.department,
    createdAt: new Date(),
  });

  // Create admin document
  await adminDb.collection('admins').doc(userRecord.uid).set(adminData);

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
  const docRef = await adminDb.collection('applications').add(applicationData);
  
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
  const docRef = await adminDb.collection('projects').add(projectData);
  
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
 * Clean up all test data (use with caution)
 */
export async function cleanupAllTestData(): Promise<void> {
  // This is a destructive operation - only use in test teardown
  const collections = ['users', 'students', 'supervisors', 'admins', 'applications', 'projects', 'partnership_requests', 'supervisor-partnership-requests'];
  
  for (const collection of collections) {
    const snapshot = await adminDb.collection(collection).get();
    const batch = adminDb.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }

  // Note: Auth users are cleaned up individually via cleanupUser
}

