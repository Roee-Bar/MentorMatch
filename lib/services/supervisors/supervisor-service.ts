// lib/services/supervisors/supervisor-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Supervisor management services

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { Supervisor, SupervisorCardData } from '@/types/database';

// ============================================
// SUPERVISOR SERVICES
// ============================================
export const SupervisorService = {
  // Get supervisor by ID
  async getSupervisorById(supervisorId: string): Promise<Supervisor | null> {
    try {
      const supervisorDoc = await adminDb.collection('supervisors').doc(supervisorId).get();
      if (supervisorDoc.exists) {
        return { id: supervisorDoc.id, ...supervisorDoc.data() } as unknown as Supervisor;
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

  // Create supervisor (Admin only)
  async createSupervisor(email: string): Promise<{ success: boolean; supervisorId?: string; error?: string }> {
    try {
      // Check if email already exists
      const existingUsers = await adminDb.collection('users')
        .where('email', '==', email)
        .get();
      
      if (!existingUsers.empty) {
        return { success: false, error: 'Email already exists in the system' };
      }

      // Create user in Firebase Auth using Admin SDK
      const userRecord = await adminAuth.createUser({
        email: email,
        password: 'Supervisor123',
        displayName: email.split('@')[0],
        emailVerified: false,
      });

      // Create user document in 'users' collection
      await adminDb.collection('users').doc(userRecord.uid).set({
        userId: userRecord.uid,
        email: email,
        name: email.split('@')[0],
        role: 'supervisor',
        department: '',
        createdAt: new Date(),
      });

      // Create minimal supervisor profile in 'supervisors' collection
      await adminDb.collection('supervisors').doc(userRecord.uid).set({
        id: userRecord.uid,
        
        // Personal Information - minimal
        firstName: '',
        lastName: '',
        fullName: email.split('@')[0],
        email: email,
        phone: '',
        department: '',
        title: '',
        
        // Professional Information - defaults
        bio: '',
        researchInterests: [],
        expertiseAreas: [],
        officeLocation: '',
        officeHours: '',
        
        // Capacity Management - defaults
        maxCapacity: 5,
        currentCapacity: 0,
        availabilityStatus: 'available',
        
        // Notification Preferences - defaults
        notificationPreference: 'immediate',
        
        // Status
        isApproved: false,
        isActive: true,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Supervisor created successfully: ${userRecord.uid}`);
      return { success: true, supervisorId: userRecord.uid };

    } catch (error: any) {
      console.error('Error creating supervisor:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-exists') {
        return { success: false, error: 'Email already in use' };
      }
      
      if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address' };
      }
      
      return { success: false, error: error.message || 'Failed to create supervisor' };
    }
  },

  // Delete supervisor and all related data (Admin only)
  async deleteSupervisor(supervisorId: string): Promise<{ 
    success: boolean; 
    error?: string;
    deletedCounts?: {
      applications: number;
      projects: number;
      studentsUpdated: number;
    }
  }> {
    try {
      // Use Firestore transaction to ensure atomicity
      const result = await adminDb.runTransaction(async (transaction) => {
        // 1. Get all applications for this supervisor
        const applicationsSnapshot = await adminDb
          .collection('applications')
          .where('supervisorId', '==', supervisorId)
          .get();

        // 2. Get all projects for this supervisor
        const projectsSnapshot = await adminDb
          .collection('projects')
          .where('supervisorId', '==', supervisorId)
          .get();

        // 3. Get all students assigned to this supervisor
        const studentsSnapshot = await adminDb
          .collection('students')
          .where('assignedSupervisorId', '==', supervisorId)
          .get();

        // Count for feedback
        const counts = {
          applications: applicationsSnapshot.size,
          projects: projectsSnapshot.size,
          studentsUpdated: studentsSnapshot.size,
        };

        // Delete all applications
        applicationsSnapshot.forEach(doc => {
          transaction.delete(doc.ref);
        });

        // Delete all projects
        projectsSnapshot.forEach(doc => {
          transaction.delete(doc.ref);
        });

        // Update students (remove supervisor assignment)
        studentsSnapshot.forEach(doc => {
          transaction.update(doc.ref, {
            assignedSupervisorId: null,
            matchStatus: 'unmatched',
            updatedAt: new Date(),
          });
        });

        // Delete supervisor document
        const supervisorRef = adminDb.collection('supervisors').doc(supervisorId);
        transaction.delete(supervisorRef);

        // Delete user document
        const userRef = adminDb.collection('users').doc(supervisorId);
        transaction.delete(userRef);

        return counts;
      });

      // Delete from Firebase Auth (outside transaction)
      try {
        await adminAuth.deleteUser(supervisorId);
      } catch (authError: any) {
        console.error('Error deleting from Firebase Auth:', authError);
        // Continue even if auth deletion fails (user might not exist in auth)
      }

      console.log(`Supervisor deleted successfully: ${supervisorId}`, result);
      return { success: true, deletedCounts: result };

    } catch (error: any) {
      console.error('Error deleting supervisor:', error);
      return { success: false, error: error.message || 'Failed to delete supervisor' };
    }
  },
};

