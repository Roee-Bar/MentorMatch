/**
 * Firebase Admin Services
 * 
 * SERVER-ONLY: These services use the Firebase Admin SDK
 * which bypasses security rules and should ONLY be used in:
 * - API routes
 * - Middleware
 * - Server-side functions
 * 
 * DO NOT import this file in client-side components!
 */

import { adminDb } from '@/lib/firebase-admin';
import type { 
  BaseUser, 
  Supervisor, 
  SupervisorCardData, 
  Student, 
  Application,
  ApplicationCardData 
} from '@/types/database';

// ============================================
// ADMIN USER SERVICES
// ============================================
export const AdminUserService = {
  /**
   * Get user by ID using Admin SDK (bypasses security rules)
   * Use this in middleware and server-side operations
   */
  async getUserById(userId: string): Promise<BaseUser | null> {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }
      
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as BaseUser;
    } catch (error) {
      console.error('Admin: Error fetching user:', error);
      return null;
    }
  },

  /**
   * Get all users using Admin SDK
   */
  async getAllUsers(): Promise<BaseUser[]> {
    try {
      const snapshot = await adminDb.collection('users').get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as BaseUser));
    } catch (error) {
      console.error('Admin: Error fetching all users:', error);
      return [];
    }
  },

  /**
   * Update user using Admin SDK
   */
  async updateUser(userId: string, data: Partial<BaseUser>): Promise<boolean> {
    try {
      await adminDb.collection('users').doc(userId).update({
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Admin: Error updating user:', error);
      return false;
    }
  },
};

// ============================================
// ADMIN SUPERVISOR SERVICES
// ============================================
export const AdminSupervisorService = {
  /**
   * Get supervisor by ID using Admin SDK
   */
  async getSupervisorById(supervisorId: string): Promise<Supervisor | null> {
    try {
      const supervisorDoc = await adminDb.collection('supervisors').doc(supervisorId).get();
      
      if (!supervisorDoc.exists) {
        return null;
      }
      
      return {
        id: supervisorDoc.id,
        ...supervisorDoc.data(),
      } as unknown as Supervisor;
    } catch (error) {
      console.error('Admin: Error fetching supervisor:', error);
      return null;
    }
  },

  /**
   * Get all supervisors using Admin SDK
   */
  async getAllSupervisors(): Promise<Supervisor[]> {
    try {
      const snapshot = await adminDb.collection('supervisors').get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Supervisor));
    } catch (error) {
      console.error('Admin: Error fetching all supervisors:', error);
      return [];
    }
  },

  /**
   * Get available supervisors (active and approved)
   */
  async getAvailableSupervisors(): Promise<SupervisorCardData[]> {
    try {
      const snapshot = await adminDb
        .collection('supervisors')
        .where('isActive', '==', true)
        .where('isApproved', '==', true)
        .get();
      
      return snapshot.docs
        .map((doc) => {
          const data = doc.data() as Supervisor;
          return {
            id: doc.id,
            name: data.fullName,
            department: data.department,
            bio: data.bio,
            expertiseAreas: data.expertiseAreas || [],
            researchInterests: data.researchInterests || [],
            availabilityStatus: data.availabilityStatus,
            currentCapacity: `${data.currentCapacity || 0}/${data.maxCapacity || 0} projects`,
            contact: data.email,
          } as SupervisorCardData;
        })
        .filter((s) => s.availabilityStatus !== 'unavailable');
    } catch (error) {
      console.error('Admin: Error fetching available supervisors:', error);
      return [];
    }
  },

  /**
   * Get supervisors by department using Admin SDK
   */
  async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    try {
      const snapshot = await adminDb
        .collection('supervisors')
        .where('department', '==', department)
        .where('isActive', '==', true)
        .get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Supervisor));
    } catch (error) {
      console.error('Admin: Error fetching supervisors by department:', error);
      return [];
    }
  },
};

// ============================================
// ADMIN STUDENT SERVICES
// ============================================
export const AdminStudentService = {
  /**
   * Get student by ID using Admin SDK
   */
  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const studentDoc = await adminDb.collection('students').doc(studentId).get();
      
      if (!studentDoc.exists) {
        return null;
      }
      
      return {
        id: studentDoc.id,
        ...studentDoc.data(),
      } as unknown as Student;
    } catch (error) {
      console.error('Admin: Error fetching student:', error);
      return null;
    }
  },

  /**
   * Get all students using Admin SDK
   */
  async getAllStudents(): Promise<Student[]> {
    try {
      const snapshot = await adminDb.collection('students').get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Student));
    } catch (error) {
      console.error('Admin: Error fetching all students:', error);
      return [];
    }
  },

  /**
   * Update student using Admin SDK
   */
  async updateStudent(studentId: string, data: Partial<Student>): Promise<boolean> {
    try {
      await adminDb.collection('students').doc(studentId).update({
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Admin: Error updating student:', error);
      return false;
    }
  },
};

// ============================================
// ADMIN APPLICATION SERVICES
// ============================================
export const AdminApplicationService = {
  /**
   * Get application by ID using Admin SDK
   */
  async getApplicationById(applicationId: string): Promise<Application | null> {
    try {
      const appDoc = await adminDb.collection('applications').doc(applicationId).get();
      
      if (!appDoc.exists) {
        return null;
      }
      
      const data = appDoc.data();
      return {
        id: appDoc.id,
        ...data,
        dateApplied: data?.dateApplied?.toDate ? data.dateApplied.toDate() : data?.dateApplied,
        lastUpdated: data?.lastUpdated?.toDate ? data.lastUpdated.toDate() : data?.lastUpdated,
        responseDate: data?.responseDate?.toDate ? data.responseDate.toDate() : data?.responseDate,
      } as unknown as Application;
    } catch (error) {
      console.error('Admin: Error fetching application:', error);
      return null;
    }
  },

  /**
   * Get all applications using Admin SDK
   */
  async getAllApplications(): Promise<Application[]> {
    try {
      const snapshot = await adminDb.collection('applications').get();
      
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateApplied: data?.dateApplied?.toDate ? data.dateApplied.toDate() : data?.dateApplied,
          lastUpdated: data?.lastUpdated?.toDate ? data.lastUpdated.toDate() : data?.lastUpdated,
          responseDate: data?.responseDate?.toDate ? data.responseDate.toDate() : data?.responseDate,
        } as unknown as Application;
      });
    } catch (error) {
      console.error('Admin: Error fetching all applications:', error);
      return [];
    }
  },

  /**
   * Get applications for a specific student using Admin SDK
   */
  async getStudentApplications(studentId: string): Promise<ApplicationCardData[]> {
    try {
      const snapshot = await adminDb
        .collection('applications')
        .where('studentId', '==', studentId)
        .get();
      
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectTitle: data.projectTitle,
          supervisorName: data.supervisorName,
          status: data.status,
          dateApplied: data?.dateApplied?.toDate ? data.dateApplied.toDate() : new Date(),
        } as ApplicationCardData;
      });
    } catch (error) {
      console.error('Admin: Error fetching student applications:', error);
      return [];
    }
  },

  /**
   * Get applications for a specific supervisor using Admin SDK
   */
  async getSupervisorApplications(supervisorId: string): Promise<ApplicationCardData[]> {
    try {
      const snapshot = await adminDb
        .collection('applications')
        .where('supervisorId', '==', supervisorId)
        .get();
      
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectTitle: data.projectTitle,
          studentName: data.studentName,
          status: data.status,
          dateApplied: data?.dateApplied?.toDate ? data.dateApplied.toDate() : new Date(),
        } as unknown as ApplicationCardData;
      });
    } catch (error) {
      console.error('Admin: Error fetching supervisor applications:', error);
      return [];
    }
  },

  /**
   * Create new application using Admin SDK
   */
  async createApplication(applicationData: any): Promise<string | null> {
    try {
      const docRef = await adminDb.collection('applications').add({
        ...applicationData,
        dateApplied: new Date(),
        lastUpdated: new Date(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Admin: Error creating application:', error);
      return null;
    }
  },

  /**
   * Delete application using Admin SDK
   */
  async deleteApplication(applicationId: string): Promise<boolean> {
    try {
      await adminDb.collection('applications').doc(applicationId).delete();
      return true;
    } catch (error) {
      console.error('Admin: Error deleting application:', error);
      return false;
    }
  },
};


