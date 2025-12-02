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
  StudentPartnershipRequest,
  StudentCardData,
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
        return { id: userDoc.id, ...userDoc.data() } as BaseUser;
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
        return { id: studentDoc.id, ...studentDoc.data() } as Student;
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
        return { id: supervisorDoc.id, ...supervisorDoc.data() } as Supervisor;
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
// STUDENT PARTNERSHIP SERVICES
// ============================================
export const StudentPartnershipService = {
  // Get available students (not paired, excluding current user)
  async getAvailableStudents(currentUserId: string): Promise<Student[]> {
    try {
      const studentsRef = adminDb.collection('students');
      const snapshot = await studentsRef
        .where('partnershipStatus', '==', 'none')
        .get();
      
      return snapshot.docs
        .filter(doc => doc.id !== currentUserId)
        .map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
      console.error('Error fetching available students:', error);
      return [];
    }
  },

  // Create partnership request
  async createPartnershipRequest(
    requesterId: string, 
    targetStudentId: string
  ): Promise<string> {
    try {
      // Get both student profiles
      const [requester, target] = await Promise.all([
        StudentService.getStudentById(requesterId),
        StudentService.getStudentById(targetStudentId)
      ]);

      if (!requester || !target) {
        throw new Error('One or both students not found');
      }

      if (target.partnershipStatus === 'paired') {
        throw new Error('Target student is already paired');
      }

      // Validate requester status
      if (requester.partnershipStatus === 'paired') {
        throw new Error('You are already paired with another student');
      }

      if (requester.partnershipStatus === 'pending_sent') {
        throw new Error('You already have a pending outgoing request. Cancel it before sending another.');
      }

      // Check if request already exists
      const existingRequest = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', requesterId)
        .where('targetStudentId', '==', targetStudentId)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        throw new Error('Partnership request already exists');
      }

      // Check if reverse request exists (target → requester)
      const reverseRequest = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', targetStudentId)
        .where('targetStudentId', '==', requesterId)
        .where('status', '==', 'pending')
        .get();

      if (!reverseRequest.empty) {
        throw new Error('This student has already sent you a partnership request. Please check your incoming requests.');
      }

      // Create request document
      const requestData = {
        requesterId,
        requesterName: requester.fullName,
        requesterEmail: requester.email,
        requesterStudentId: requester.studentId,
        requesterDepartment: requester.department,
        targetStudentId,
        targetStudentName: target.fullName,
        targetStudentEmail: target.email,
        targetDepartment: target.department,
        status: 'pending',
        createdAt: new Date(),
      };

      const docRef = await adminDb.collection('partnership_requests').add(requestData);

      // Update both students' partnership status
      await Promise.all([
        adminDb.collection('students').doc(requesterId).update({
          partnershipStatus: 'pending_sent',
          updatedAt: new Date()
        }),
        adminDb.collection('students').doc(targetStudentId).update({
          partnershipStatus: 'pending_received',
          updatedAt: new Date()
        })
      ]);

      return docRef.id;
    } catch (error) {
      console.error('Error creating partnership request:', error);
      throw error;
    }
  },

  // Get partnership requests for a student
  async getPartnershipRequests(
    studentId: string, 
    type: 'incoming' | 'outgoing' | 'all'
  ): Promise<any[]> {
    try {
      let query = adminDb.collection('partnership_requests')
        .where('status', '==', 'pending');

      if (type === 'incoming') {
        query = query.where('targetStudentId', '==', studentId);
      } else if (type === 'outgoing') {
        query = query.where('requesterId', '==', studentId);
      }
      // For 'all', we need to do two queries and merge
      
      const snapshot = await query.get();
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If type is 'all', also fetch the other direction
      if (type === 'all') {
        const otherQuery = adminDb.collection('partnership_requests')
          .where('status', '==', 'pending')
          .where('requesterId', '==', studentId);
        
        const otherSnapshot = await otherQuery.get();
        const otherRequests = otherSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return [...requests, ...otherRequests];
      }

      return requests;
    } catch (error) {
      console.error('Error fetching partnership requests:', error);
      return [];
    }
  },

  // Get specific partnership request
  async getPartnershipRequest(requestId: string): Promise<any | null> {
    try {
      const requestDoc = await adminDb.collection('partnership_requests').doc(requestId).get();
      if (requestDoc.exists) {
        return { id: requestDoc.id, ...requestDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching partnership request:', error);
      return null;
    }
  },

  // Respond to partnership request (accept/reject)
  async respondToPartnershipRequest(
    requestId: string,
    targetStudentId: string,
    action: 'accept' | 'reject'
  ): Promise<void> {
    try {
      // Get request
      const request = await this.getPartnershipRequest(requestId);
      if (!request) {
        throw new Error('Partnership request not found');
      }

      // Verify target student
      if (request.targetStudentId !== targetStudentId) {
        throw new Error('Unauthorized to respond to this request');
      }

      if (request.status !== 'pending') {
        throw new Error('Request already processed');
      }

      if (action === 'accept') {
        // Update both students to paired
        await Promise.all([
          adminDb.collection('students').doc(request.requesterId).update({
            partnerId: targetStudentId,
            partnershipStatus: 'paired',
            updatedAt: new Date()
          }),
          adminDb.collection('students').doc(targetStudentId).update({
            partnerId: request.requesterId,
            partnershipStatus: 'paired',
            updatedAt: new Date()
          })
        ]);

        // Update request status
        await adminDb.collection('partnership_requests').doc(requestId).update({
          status: 'accepted',
          respondedAt: new Date()
        });

        // Cancel all other pending requests for both students
        await this.cancelAllPendingRequests(request.requesterId);
        await this.cancelAllPendingRequests(targetStudentId);

      } else if (action === 'reject') {
        // Update request status
        await adminDb.collection('partnership_requests').doc(requestId).update({
          status: 'rejected',
          respondedAt: new Date()
        });

        // Reset target's partnership status to 'none'
        await adminDb.collection('students').doc(targetStudentId).update({
          partnershipStatus: 'none',
          updatedAt: new Date()
        });

        // Reset requester's partnership status to 'none'
        await adminDb.collection('students').doc(request.requesterId).update({
          partnershipStatus: 'none',
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error responding to partnership request:', error);
      throw error;
    }
  },

  // Cancel partnership request (by requester)
  async cancelPartnershipRequest(
    requestId: string,
    requesterId: string
  ): Promise<void> {
    try {
      const request = await this.getPartnershipRequest(requestId);
      if (!request) {
        throw new Error('Partnership request not found');
      }

      // Verify requester owns the request
      if (request.requesterId !== requesterId) {
        throw new Error('Unauthorized to cancel this request');
      }

      if (request.status !== 'pending') {
        throw new Error('Can only cancel pending requests');
      }

      // Update request status
      await adminDb.collection('partnership_requests').doc(requestId).update({
        status: 'cancelled',
        respondedAt: new Date()
      });

      // Reset requester's partnership status to 'none'
      await adminDb.collection('students').doc(requesterId).update({
        partnershipStatus: 'none',
        updatedAt: new Date()
      });

      // Reset target's partnership status to 'none'
      await adminDb.collection('students').doc(request.targetStudentId).update({
        partnershipStatus: 'none',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error cancelling partnership request:', error);
      throw error;
    }
  },

  // Cancel all pending requests for a student (used when accepting a partnership)
  async cancelAllPendingRequests(studentId: string): Promise<void> {
    try {
      // Get all pending requests where student is requester or target
      const [requestsAsRequester, requestsAsTarget] = await Promise.all([
        adminDb.collection('partnership_requests')
          .where('requesterId', '==', studentId)
          .where('status', '==', 'pending')
          .get(),
        adminDb.collection('partnership_requests')
          .where('targetStudentId', '==', studentId)
          .where('status', '==', 'pending')
          .get()
      ]);

      const batch = adminDb.batch();

      // Cancel all requests as requester
      requestsAsRequester.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          respondedAt: new Date()
        });
      });

      // Cancel all requests as target
      requestsAsTarget.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          respondedAt: new Date()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error cancelling all pending requests:', error);
      throw error;
    }
  },

  // Unpair students
  async unpairStudents(studentId1: string, studentId2: string): Promise<void> {
    try {
      // Verify both students are actually paired with each other
      const [student1, student2] = await Promise.all([
        StudentService.getStudentById(studentId1),
        StudentService.getStudentById(studentId2)
      ]);

      if (!student1 || !student2) {
        throw new Error('One or both students not found');
      }

      if (student1.partnerId !== studentId2 || student2.partnerId !== studentId1) {
        throw new Error('Students are not paired with each other');
      }

      // Reset both students' partnership fields
      await Promise.all([
        adminDb.collection('students').doc(studentId1).update({
          partnerId: null,
          partnershipStatus: 'none',
          updatedAt: new Date()
        }),
        adminDb.collection('students').doc(studentId2).update({
          partnerId: null,
          partnershipStatus: 'none',
          updatedAt: new Date()
        })
      ]);

      // Note: Applications remain as-is with partner info for historical record
      // Future applications will not include the partner
    } catch (error) {
      console.error('Error unpairing students:', error);
      throw error;
    }
  },

  // Get current partner details
  async getPartnerDetails(partnerId: string): Promise<Student | null> {
    try {
      const partner = await StudentService.getStudentById(partnerId);
      if (!partner) {
        console.warn(`Partner not found: ${partnerId} - possible orphaned reference`);
      }
      return partner;
    } catch (error) {
      console.error('Error fetching partner details:', error);
      return null;
    }
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
        return { id: adminDoc.id, ...adminDoc.data() } as Admin;
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