// lib/services/applications/application-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Application management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toApplication } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Application, ApplicationCardData } from '@/types/database';

const SERVICE_NAME = 'ApplicationService';

// ============================================
// APPLICATION SERVICES
// ============================================
export const ApplicationService = {
  // Get application by ID
  async getApplicationById(applicationId: string): Promise<Application | null> {
    try {
      const appDoc = await adminDb.collection('applications').doc(applicationId).get();
      if (appDoc.exists) {
        return toApplication(appDoc.id, appDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getApplicationById', error, { applicationId });
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
      logger.service.error(SERVICE_NAME, 'getStudentApplications', error, { studentId });
      return [];
    }
  },

  // Get all applications for a supervisor
  async getSupervisorApplications(supervisorId: string): Promise<Application[]> {
    try {
      const querySnapshot = await adminDb.collection('applications')
        .where('supervisorId', '==', supervisorId)
        .get();
      
      return querySnapshot.docs.map((doc) => toApplication(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getSupervisorApplications', error, { supervisorId });
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
      
      return querySnapshot.docs.map((doc) => toApplication(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPendingApplications', error, { supervisorId });
      return [];
    }
  },

  // Update application content
  async updateApplication(
    applicationId: string, 
    updates: Partial<Application>
  ): Promise<ServiceResult> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );
      
      await adminDb.collection('applications').doc(applicationId).update({
        ...cleanUpdates,
        lastUpdated: new Date(),
      });
      return ServiceResults.success(undefined, 'Application updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateApplication', error, { applicationId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update application'
      );
    }
  },

  // Create new application
  async createApplication(applicationData: Omit<Application, 'id'>): Promise<ServiceResult<string>> {
    try {
      // Log incoming data for debugging
      logger.service.operation(SERVICE_NAME, 'createApplication', { 
        supervisorId: applicationData.supervisorId,
        studentId: applicationData.studentId 
      });
      
      // Filter out undefined values to prevent Firestore errors
      // Firestore rejects undefined but accepts null
      const cleanData = Object.fromEntries(
        Object.entries(applicationData).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await adminDb.collection('applications').add({
        ...cleanData,
        dateApplied: new Date(),
        lastUpdated: new Date(),
      });
      return ServiceResults.success(docRef.id, 'Application created successfully');
    } catch (error) {
      // Enhanced error logging with context
      logger.service.error(SERVICE_NAME, 'createApplication', error, {
        studentId: applicationData.studentId,
        supervisorId: applicationData.supervisorId,
        errorType: error instanceof Error ? error.name : 'Unknown'
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create application'
      );
    }
  },

  // Update application status
  async updateApplicationStatus(
    applicationId: string,
    status: Application['status'],
    feedback?: string
  ): Promise<ServiceResult> {
    try {
      const updateData: Record<string, unknown> = {
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
      return ServiceResults.success(undefined, 'Application status updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateApplicationStatus', error, { applicationId, status });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update application status'
      );
    }
  },

  // Get all applications (for admin)
  async getAllApplications(): Promise<Application[]> {
    try {
      const querySnapshot = await adminDb.collection('applications').get();
      return querySnapshot.docs.map((doc) => toApplication(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAllApplications', error);
      return [];
    }
  },

  // Delete application
  async deleteApplication(applicationId: string): Promise<ServiceResult> {
    try {
      await adminDb.collection('applications').doc(applicationId).delete();
      return ServiceResults.success(undefined, 'Application deleted successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'deleteApplication', error, { applicationId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to delete application'
      );
    }
  },
};
