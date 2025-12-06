// lib/services/applications/application-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Application management services

import { adminDb } from '@/lib/firebase-admin';
import type { Application, ApplicationCardData } from '@/types/database';
import { convertFirestoreTimestamps } from '@/lib/services/shared/firestore-utils';

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
        return convertFirestoreTimestamps<Application>(
          { id: appDoc.id, ...data },
          ['dateApplied', 'lastUpdated', 'responseDate']
        );
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
        return convertFirestoreTimestamps<Application>(
          { id: doc.id, ...data },
          ['dateApplied', 'lastUpdated', 'responseDate']
        );
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
        .where('status', '==', 'pending')
        .get();
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return convertFirestoreTimestamps<Application>(
          { id: doc.id, ...data },
          ['dateApplied', 'lastUpdated', 'responseDate']
        );
      });
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      return [];
    }
  },

  // Update application content
  async updateApplication(
    applicationId: string, 
    updates: Partial<Application>
  ): Promise<boolean> {
    try {
      await adminDb.collection('applications').doc(applicationId).update({
        ...updates,
        lastUpdated: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      return false;
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
        return convertFirestoreTimestamps<Application>(
          { id: doc.id, ...data },
          ['dateApplied', 'lastUpdated', 'responseDate']
        );
      });
    } catch (error) {
      console.error('Error fetching all applications:', error);
      return [];
    }
  },

  // Delete application
  async deleteApplication(applicationId: string): Promise<boolean> {
    try {
      await adminDb.collection('applications').doc(applicationId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  },
};

