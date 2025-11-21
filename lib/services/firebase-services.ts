// lib/services/firebase-services.ts
// Firebase services to replace mock data

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
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
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as BaseUser[];
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
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
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
      const querySnapshot = await getDocs(collection(db, 'students'));
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as Student[];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  // Get unmatched students
  async getUnmatchedStudents(): Promise<Student[]> {
    try {
      const q = query(
        collection(db, 'students'),
        where('matchStatus', '==', 'unmatched')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as Student[];
    } catch (error) {
      console.error('Error fetching unmatched students:', error);
      return [];
    }
  },

  // Update student
  async updateStudent(studentId: string, data: Partial<Student>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'students', studentId), {
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
      const supervisorDoc = await getDoc(doc(db, 'supervisors', supervisorId));
      if (supervisorDoc.exists()) {
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
      const querySnapshot = await getDocs(collection(db, 'supervisors'));
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as Supervisor[];
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      return [];
    }
  },

  // Get available supervisors (with capacity)
  async getAvailableSupervisors(): Promise<SupervisorCardData[]> {
    try {
      const q = query(
        collection(db, 'supervisors'),
        where('isActive', '==', true),
        where('isApproved', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
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
      await updateDoc(doc(db, 'supervisors', supervisorId), {
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
      const q = query(
        collection(db, 'supervisors'),
        where('department', '==', department),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as Supervisor[];
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
      const appDoc = await getDoc(doc(db, 'applications', applicationId));
      if (appDoc.exists()) {
        return { id: appDoc.id, ...appDoc.data() } as Application;
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
      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', studentId)
      );
      const querySnapshot = await getDocs(q);
      
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
      const q = query(
        collection(db, 'applications'),
        where('supervisorId', '==', supervisorId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Application[];
    } catch (error) {
      console.error('Error fetching supervisor applications:', error);
      return [];
    }
  },

  // Get pending applications for a supervisor
  async getPendingApplications(supervisorId: string): Promise<Application[]> {
    try {
      const q = query(
        collection(db, 'applications'),
        where('supervisorId', '==', supervisorId),
        where('status', 'in', ['pending', 'under_review'])
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Application[];
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      return [];
    }
  },

  // Create new application
  async createApplication(applicationData: Omit<Application, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'applications'), {
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

      await updateDoc(doc(db, 'applications', applicationId), updateData);
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      return false;
    }
  },

  // Get all applications (for admin)
  async getAllApplications(): Promise<Application[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'applications'));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Application[];
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
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        return { id: projectDoc.id, ...projectDoc.data() } as Project;
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
      const querySnapshot = await getDocs(collection(db, 'projects'));
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
      const q = query(
        collection(db, 'projects'),
        where('supervisorId', '==', supervisorId)
      );
      const querySnapshot = await getDocs(q);
      
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
      const docRef = await addDoc(collection(db, 'projects'), {
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
      const adminDoc = await getDoc(doc(db, 'admins', adminId));
      if (adminDoc.exists()) {
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
        getDocs(collection(db, 'students')),
        getDocs(query(collection(db, 'supervisors'), where('isActive', '==', true))),
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