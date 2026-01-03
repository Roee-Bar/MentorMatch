// lib/services/applications/application-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Application management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { toApplication } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Application, ApplicationCardData } from '@/types/database';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Helper function to map Firestore document to ApplicationCardData
 * Eliminates code duplication in getStudentApplications
 */
const mapDocToApplicationCardData = (doc: QueryDocumentSnapshot): ApplicationCardData => {
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
    hasPartner: data.hasPartner,
    partnerName: data.partnerName,
    studentName: data.studentName,
    studentEmail: data.studentEmail,
  } as ApplicationCardData;
};

// ============================================
// APPLICATION SERVICE CLASS
// ============================================
class ApplicationServiceClass extends BaseService<Application> {
  protected collectionName = 'applications';
  protected serviceName = 'ApplicationService';
  
  protected toEntity(id: string, data: any): Application {
    return toApplication(id, data);
  }

  protected async validateBeforeCreate(data: Omit<Application, 'id'>): Promise<void> {
    // Required fields validation
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }
    if (!data.supervisorId) {
      throw new Error('Supervisor ID is required');
    }
    if (!data.projectTitle) {
      throw new Error('Project title is required');
    }
    if (!data.projectDescription) {
      throw new Error('Project description is required');
    }

    // Status validation - new applications should start as 'pending'
    if (data.status && data.status !== 'pending') {
      throw new Error('New applications must have status "pending"');
    }
  }

  async getApplicationById(applicationId: string): Promise<Application | null> {
    return this.getById(applicationId);
  }

  async getAllApplications(): Promise<Application[]> {
    return this.getAll();
  }

  async getSupervisorApplications(supervisorId: string): Promise<Application[]> {
    return this.query([
      { field: 'supervisorId', operator: '==', value: supervisorId }
    ]);
  }

  async getPendingApplications(supervisorId: string): Promise<Application[]> {
    return this.query([
      { field: 'supervisorId', operator: '==', value: supervisorId },
      { field: 'status', operator: '==', value: 'pending' }
    ]);
  }

  async createApplication(applicationData: Omit<Application, 'id'>): Promise<ServiceResult<string>> {
    // Log incoming data for debugging
    logger.service.operation(this.serviceName, 'createApplication', { 
      supervisorId: applicationData.supervisorId,
      studentId: applicationData.studentId 
    });
    
    // Exclude timestamp fields - they will be set by base create() method
    const { dateApplied, lastUpdated, ...dataWithoutTimestamps } = applicationData;
    
    // Use custom timestamp fields: dateApplied/lastUpdated instead of createdAt/updatedAt
    return this.create(dataWithoutTimestamps, {
      createdAt: 'dateApplied',
      updatedAt: 'lastUpdated'
    });
  }

  async updateApplication(
    applicationId: string, 
    updates: Partial<Application>
  ): Promise<ServiceResult> {
    return this.update(applicationId, updates, 'lastUpdated');
  }

  async deleteApplication(applicationId: string): Promise<ServiceResult> {
    return this.delete(applicationId);
  }

  async getStudentApplications(studentId: string): Promise<ApplicationCardData[]> {
    try {
      // Query applications where student is the primary applicant
      const primaryQuerySnapshot = await this.getCollection()
        .where('studentId', '==', studentId)
        .get();
      
      // Query applications where student is the partner
      const partnerQuerySnapshot = await this.getCollection()
        .where('partnerId', '==', studentId)
        .get();
      
      // Combine and deduplicate results (in case an application has both studentId and partnerId matching)
      const applicationMap = new Map<string, ApplicationCardData>();
      
      // Process primary applications
      primaryQuerySnapshot.docs.forEach((doc) => {
        applicationMap.set(doc.id, mapDocToApplicationCardData(doc));
      });
      
      // Process partner applications (only add if not already in map)
      partnerQuerySnapshot.docs.forEach((doc) => {
        if (!applicationMap.has(doc.id)) {
          applicationMap.set(doc.id, mapDocToApplicationCardData(doc));
        }
      });
      
      return Array.from(applicationMap.values());
    } catch (error) {
      logger.service.error(this.serviceName, 'getStudentApplications', error, { 
        studentId,
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

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

      await this.getCollection().doc(applicationId).update(updateData);
      return ServiceResults.success(undefined, 'Application status updated successfully');
    } catch (error) {
      logger.service.error(this.serviceName, 'updateApplicationStatus', error, { applicationId, status });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update application status'
      );
    }
  }
}

// Create singleton instance and export
export const applicationService = new ApplicationServiceClass();
