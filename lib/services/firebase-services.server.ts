// lib/services/firebase-services.server.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// DO NOT import this file in any client-side components or pages
// Firebase services for backend data operations

import { adminDb } from '@/lib/firebase-admin';
import type {
  BaseUser,
  Student,
  Supervisor,
  Admin,
  Application,
  Project,
  SupervisorCardData,
  ApplicationCardData,
  DashboardStats,
} from '@/types/database';

// ============================================
// USER SERVICES
// ============================================
export const UserService = {
  // Get current user's full profile (from users collection)
  async getUserById(userId: string): Promise<BaseUser | null> {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return { ...userDoc.data() } as BaseUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Get all users
  async getAllUsers(): Promise<BaseUser[]> {
    try {
      const querySnapshot = await adminDb.collection('users').get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as BaseUser));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },
};

// ============================================
// STUDENT SERVICES
// ============================================
export const StudentService = {
  // Get student by ID
  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const studentDoc = await adminDb.collection('students').doc(studentId).get();
      if (studentDoc.exists) {
        return { ...studentDoc.data() } as Student;
      }
      return null;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  },

  // Get all students
  async getAllStudents(): Promise<Student[]> {
    try {
      const querySnapshot = await adminDb.collection('students').get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Student));
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  // Get unmatched students
  async getUnmatchedStudents(): Promise<Student[]> {
    try {
      const querySnapshot = await adminDb.collection('students')
        .where('matchStatus', '==', 'unmatched')
        .get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Student));
    } catch (error) {
      console.error('Error fetching unmatched students:', error);
      return [];
    }
  },

  // Update student
  async updateStudent(studentId: string, data: Partial<Student>): Promise<boolean> {
    try {
      await adminDb.collection('students').doc(studentId).update({
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      return false;
    }
  },
};

// ============================================
// SUPERVISOR SERVICES
// ============================================
export const SupervisorService = {
  // Get supervisor by ID
  async getSupervisorById(supervisorId: string): Promise<Supervisor | null> {
    try {
      const supervisorDoc = await adminDb.collection('supervisors').doc(supervisorId).get();
      if (supervisorDoc.exists) {
        return { ...supervisorDoc.data() } as Supervisor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching supervisor:', error);
      return null;
    }
  },

  // Get all supervisors
  async getAllSupervisors(): Promise<Supervisor[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors').get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Supervisor));
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      return [];
    }
  },

  // Get available supervisors (with capacity)
  async getAvailableSupervisors(): Promise<SupervisorCardData[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors')
        .where('isActive', '==', true)
        .where('isApproved', '==', true)
        .get();
      
      return querySnapshot.docs
        .map((doc) => {
          const data = doc.data() as Supervisor;
          return {
            id: doc.id,
            name: data.fullName,
            department: data.department,
            bio: data.bio,
            expertiseAreas: data.expertiseAreas,
            researchInterests: data.researchInterests,
            availabilityStatus: data.availabilityStatus,
            currentCapacity: `${data.currentCapacity}/${data.maxCapacity} projects`,
            contact: data.email,
          } as SupervisorCardData;
        })
        .filter((s) => s.availabilityStatus !== 'unavailable');
    } catch (error) {
      console.error('Error fetching available supervisors:', error);
      return [];
    }
  },

  // Update supervisor
  async updateSupervisor(supervisorId: string, data: Partial<Supervisor>): Promise<boolean> {
    try {
      await adminDb.collection('supervisors').doc(supervisorId).update({
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating supervisor:', error);
      return false;
    }
  },

  // Get supervisors by department
  async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors')
        .where('department', '==', department)
        .where('isActive', '==', true)
        .get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Supervisor));
    } catch (error) {
      console.error('Error fetching supervisors by department:', error);
      return [];
    }
  },
};

// ============================================
// APPLICATION SERVICES
// ============================================
export const ApplicationService = {
  // Get application by ID
  async getApplicationById(applicationId: string): Promise<Application | null> {
    try {
      const appDoc = await adminDb.collection('applications').doc(applicationId).get();
      if (appDoc.exists) {
        const data = appDoc.data();
        return {
          id: appDoc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates
          dateApplied: data?.dateApplied?.toDate ? data.dateApplied.toDate() : data?.dateApplied,
          lastUpdated: data?.lastUpdated?.toDate ? data.lastUpdated.toDate() : data?.lastUpdated,
          responseDate: data?.responseDate?.toDate ? data.responseDate.toDate() : data?.responseDate,
        } as Application;
      }
      return null;
    } catch (error) {
      console.error('Error fetching application:', error);
      return null;
    }
  },

  // Get all applications for a student
  async getStudentApplications(studentId: string): Promise<ApplicationCardData[]> {
    try {
      const querySnapshot = await adminDb.collection('applications')
        .where('studentId', '==', studentId)
        .get();
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectTitle: data.projectTitle,
          projectDescription: data.projectDescription,
          supervisorName: data.supervisorName,
          dateApplied: data.dateApplied?.toDate?.()?.toLocaleDateString() || 'N/A',
          status: data.status,
          responseTime: data.responseTime || '5-7 business days',
          comments: data.supervisorFeedback,
        } as ApplicationCardData;
      });
    } catch (error) {
      console.error('Error fetching student applications:', error);
      return [];
    }
  },

  // Get all applications for a supervisor
  async getSupervisorApplications(supervisorId: string): Promise<Application[]> {
    try {
      const querySnapshot = await adminDb.collection('applications')
        .where('supervisorId', '==', supervisorId)
        .get();
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates
          dateApplied: data.dateApplied?.toDate ? data.dateApplied.toDate() : data.dateApplied,
          lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : data.lastUpdated,
          responseDate: data.responseDate?.toDate ? data.responseDate.toDate() : data.responseDate,
        } as Application;
      });
    } catch (error) {
      console.error('Error fetching supervisor applications:', error);
      return [];
    }
  },

  // Get pending applications for a supervisor
  async getPendingApplications(supervisorId: string): Promise<Application[]> {
    try {
      const querySnapshot = await adminDb.collection('applications')
        .where('supervisorId', '==', supervisorId)
        .where('status', 'in', ['pending', 'under_review'])
        .get();
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates
          dateApplied: data.dateApplied?.toDate ? data.dateApplied.toDate() : data.dateApplied,
          lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : data.lastUpdated,
          responseDate: data.responseDate?.toDate ? data.responseDate.toDate() : data.responseDate,
        } as Application;
      });
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      return [];
    }
  },

  // Create new application
  async createApplication(applicationData: Omit<Application, 'id'>): Promise<string | null> {
    try {
      const docRef = await adminDb.collection('applications').add({
        ...applicationData,
        dateApplied: new Date(),
        lastUpdated: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating application:', error);
      return null;
    }
  },

  // Update application status
  async updateApplicationStatus(
    applicationId: string,
    status: Application['status'],
    feedback?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        lastUpdated: new Date(),
      };
      
      if (feedback) {
        updateData.supervisorFeedback = feedback;
      }
      
      if (status === 'approved' || status === 'rejected') {
        updateData.responseDate = new Date();
      }

      await adminDb.collection('applications').doc(applicationId).update(updateData);
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      return false;
    }
  },

  // Get all applications (for admin)
  async getAllApplications(): Promise<Application[]> {
    try {
      const querySnapshot = await adminDb.collection('applications').get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates
          dateApplied: data.dateApplied?.toDate ? data.dateApplied.toDate() : data.dateApplied,
          lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : data.lastUpdated,
          responseDate: data.responseDate?.toDate ? data.responseDate.toDate() : data.responseDate,
        } as Application;
      });
    } catch (error) {
      console.error('Error fetching all applications:', error);
      return [];
    }
  },
};

// ============================================
// PROJECT SERVICES
// ============================================
export const ProjectService = {
  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await adminDb.collection('projects').doc(projectId).get();
      if (projectDoc.exists) {
        return { ...projectDoc.data(), id: projectDoc.id } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },

  // Get all projects
  async getAllProjects(): Promise<Project[]> {
    try {
      const querySnapshot = await adminDb.collection('projects').get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Get projects for a supervisor
  async getSupervisorProjects(supervisorId: string): Promise<Project[]> {
    try {
      const querySnapshot = await adminDb.collection('projects')
        .where('supervisorId', '==', supervisorId)
        .get();
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    } catch (error) {
      console.error('Error fetching supervisor projects:', error);
      return [];
    }
  },

  // Create new project
  async createProject(projectData: Omit<Project, 'id'>): Promise<string | null> {
    try {
      const docRef = await adminDb.collection('projects').add({
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  // Generate project code
  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  },
};

// ============================================
// ADMIN SERVICES
// ============================================
export const AdminService = {
  // Get admin by ID
  async getAdminById(adminId: string): Promise<Admin | null> {
    try {
      const adminDoc = await adminDb.collection('admins').doc(adminId).get();
      if (adminDoc.exists) {
        return { ...adminDoc.data() } as Admin;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin:', error);
      return null;
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [studentsSnapshot, supervisorsSnapshot] = await Promise.all([
        adminDb.collection('students').get(),
        adminDb.collection('supervisors').where('isActive', '==', true).get(),
      ]);

      const students = studentsSnapshot.docs.map((doc) => doc.data());
      const matchedStudents = students.filter((s) => s.matchStatus === 'matched').length;
      const pendingMatches = students.filter(
        (s) => s.matchStatus === 'pending' || s.matchStatus === 'unmatched'
      ).length;

      return {
        totalStudents: students.length,
        matchedStudents,
        pendingMatches,
        activeSupervisors: supervisorsSnapshot.size,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalStudents: 0,
        matchedStudents: 0,
        pendingMatches: 0,
        activeSupervisors: 0,
      };
    }
  },
};