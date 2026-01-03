// lib/services/applications/application-service.ts

import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { applicationRepository } from '@/lib/repositories/application-repository';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Application, ApplicationCardData } from '@/types/database';
import { DateFormatter } from '@/lib/utils/date-formatter';

class ApplicationServiceClass extends BaseService<Application> {
  protected serviceName = 'ApplicationService';
  protected repository = applicationRepository;

  protected async validateBeforeCreate(data: Omit<Application, 'id'>): Promise<void> {
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
    logger.service.operation(this.serviceName, 'createApplication', { 
      supervisorId: applicationData.supervisorId,
      studentId: applicationData.studentId 
    });
    
    const { dateApplied, lastUpdated, ...dataWithoutTimestamps } = applicationData;
    
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
      const primaryApplications = await this.repository.findByStudentId(studentId);
      const partnerApplications = await this.repository.findByPartnerId(studentId);
      
      const applicationMap = new Map<string, ApplicationCardData>();
      
      [...primaryApplications, ...partnerApplications].forEach(app => {
        if (!applicationMap.has(app.id)) {
          applicationMap.set(app.id, {
            id: app.id,
            projectTitle: app.projectTitle,
            projectDescription: app.projectDescription,
            supervisorName: app.supervisorName,
            dateApplied: DateFormatter.formatForTable(app.dateApplied),
            status: app.status,
            responseTime: app.responseTime || '5-7 business days',
            comments: app.supervisorFeedback,
            hasPartner: app.hasPartner,
            partnerName: app.partnerName,
            studentName: app.studentName,
            studentEmail: app.studentEmail,
          });
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
      const updateData: Partial<Application> = {
        status,
      };
      
      if (feedback) {
        updateData.supervisorFeedback = feedback;
      }
      
      if (status === 'approved' || status === 'rejected') {
        updateData.responseDate = new Date();
      }

      await this.repository.update(applicationId, updateData);
      return ServiceResults.success(undefined, 'Application status updated successfully');
    } catch (error) {
      logger.service.error(this.serviceName, 'updateApplicationStatus', error, { applicationId, status });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update application status'
      );
    }
  }
}

export const applicationService = new ApplicationServiceClass();
