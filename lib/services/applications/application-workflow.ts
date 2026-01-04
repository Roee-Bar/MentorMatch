/**
 * Application Workflow Service
 * 
 * Business logic for application status management, resubmission, and validation.
 */

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { applicationService } from '@/lib/services/applications/application-service';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { supervisorRepository } from '@/lib/repositories/supervisor-repository';
import { applicationRepository } from '@/lib/repositories/application-repository';
import { serviceEvents } from '@/lib/services/shared/events';
import type { Application, ApplicationStatus } from '@/types/database';
import type { Transaction } from 'firebase-admin/firestore';

const SERVICE_NAME = 'ApplicationWorkflowService';

export const ApplicationWorkflowService = {
  /**
   * Validate and update application status with capacity management
   * Handles: status transitions, linked applications, supervisor capacity
   */
  async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    feedback?: string,
    currentUserId?: string,
    userRole?: 'admin' | 'supervisor' | 'student'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch application
      const application = await applicationService.getApplicationById(applicationId);
      
      if (!application) {
        return { success: false, error: 'Application not found. It may have been deleted.' };
      }

      // Authorization check
      const isAdmin = userRole === 'admin';
      const isSupervisor = currentUserId === application.supervisorId;
      
      if (!isSupervisor && !isAdmin) {
        return { success: false, error: 'You don\'t have permission to update this application.' };
      }

      const previousStatus = application.status;

      // Validate status transition
      if (newStatus === 'pending' && ['approved', 'rejected', 'revision_requested'].includes(previousStatus)) {
        return { success: false, error: 'Cannot revert application back to pending status after a decision has been made.' };
      }

      // Check if capacity needs to be updated
      const isApproving = newStatus === 'approved' && previousStatus !== 'approved';
      const isUnapproving = previousStatus === 'approved' && newStatus !== 'approved';
      // For backward compatibility with old linked applications, only update if it's a lead or has no link
      const shouldUpdateCapacity = application.isLeadApplication || !application.linkedApplicationId;
      
      if ((isApproving || isUnapproving) && shouldUpdateCapacity) {
        try {
          await adminDb.runTransaction(async (transaction: Transaction) => {
            const supervisorRef = supervisorRepository.getDocumentRef(application.supervisorId);
            const supervisorSnap = await transaction.get(supervisorRef);

            if (!supervisorSnap.exists) {
              throw new Error('Supervisor not found');
            }

            const supervisorData = supervisorSnap.data();
            const currentCapacity = supervisorData?.currentCapacity || 0;
            const maxCapacity = supervisorData?.maxCapacity || 0;

            if (isApproving) {
              if (currentCapacity >= maxCapacity) {
                throw new Error(
                  `Cannot approve: Maximum capacity reached (${currentCapacity}/${maxCapacity} projects). Please contact an administrator to increase capacity.`
                );
              }

              transaction.update(supervisorRef, {
                currentCapacity: currentCapacity + 1,
                updatedAt: new Date()
              });

            } else if (isUnapproving) {
              const newCapacity = Math.max(0, currentCapacity - 1);
              transaction.update(supervisorRef, {
                currentCapacity: newCapacity,
                updatedAt: new Date()
              });
            }

            // Update application status
            const applicationRef = applicationRepository.getDocumentRef(applicationId);
            const updateData: Record<string, unknown> = {
              status: newStatus,
              lastUpdated: new Date(),
            };
            
            if (feedback) {
              updateData.supervisorFeedback = feedback;
            }
            
            if (newStatus === 'approved' || newStatus === 'rejected') {
              updateData.responseDate = new Date();
            }

            transaction.update(applicationRef, updateData);
          });
        } catch (transactionError: unknown) {
          logger.service.error(SERVICE_NAME, 'updateApplicationStatus - transaction failed', transactionError, {
            applicationId,
            newStatus,
            supervisorId: application.supervisorId
          });
          // Re-throw to be caught by outer try-catch with proper error message
          throw transactionError;
        }

      } else {
        // No capacity change needed - update normally
        const result = await applicationService.updateApplicationStatus(
          applicationId,
          newStatus,
          feedback
        );

        if (!result.success) {
          return { success: false, error: result.error || 'Failed to update application status' };
        }
      }

      // Emit status changed event for side effects (e.g., email notifications)
      await serviceEvents.emit({
        type: 'application:status_changed',
        applicationId,
        studentId: application.studentId,
        studentName: application.studentName,
        studentEmail: application.studentEmail,
        supervisorId: application.supervisorId,
        supervisorName: application.supervisorName,
        projectTitle: application.projectTitle,
        previousStatus,
        newStatus,
        feedback,
        hasPartner: application.hasPartner,
        partnerName: application.partnerName,
        partnerEmail: application.partnerEmail,
        triggeredByUserId: currentUserId,
      });

      return { success: true };
      
    } catch (error: unknown) {
      logger.service.error(SERVICE_NAME, 'updateApplicationStatus', error, { applicationId, newStatus });
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Resubmit application after revision
   * Handles: status transition validation, linked partner resubmission
   */
  async resubmitApplication(
    applicationId: string,
    studentId: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const application = await applicationService.getApplicationById(applicationId);
      
      if (!application) {
        return { success: false, error: 'Application not found. It may have been deleted.' };
      }

      // Authorization check - allow student or partner
      const isOwner = studentId === application.studentId;
      const isPartner = application.partnerId && studentId === application.partnerId;
      
      if (!isOwner && !isPartner) {
        return { success: false, error: 'You don\'t have permission to resubmit this application.' };
      }

      // Validation
      if (application.status !== 'revision_requested') {
        return { success: false, error: 'Application can only be resubmitted when in revision_requested status.' };
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        status: 'pending',
        lastUpdated: new Date(),
        resubmittedDate: new Date(),
      };

      // Update the application
      await applicationRepository.update(applicationId, updateData as Partial<Application>);

      // Get supervisor email for event
      const supervisor = await supervisorService.getSupervisorById(application.supervisorId);

      // Emit resubmitted event for side effects (e.g., email notifications)
      await serviceEvents.emit({
        type: 'application:resubmitted',
        applicationId,
        studentId: application.studentId,
        studentName: application.studentName,
        studentEmail: application.studentEmail,
        supervisorId: application.supervisorId,
        supervisorName: application.supervisorName,
        supervisorEmail: supervisor?.email || '',
        projectTitle: application.projectTitle,
        hasPartner: application.hasPartner,
        partnerName: application.partnerName,
        partnerEmail: application.partnerEmail,
      });

      return { 
        success: true,
        message: 'Application resubmitted successfully. The supervisor will review your changes.' 
      };
      
    } catch (error: unknown) {
      logger.service.error(SERVICE_NAME, 'resubmitApplication', error, { applicationId, studentId });
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while resubmitting the application. Please try again.';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Check for duplicate applications before creation
   * Checks both studentId and partnerId to prevent duplicates
   */
  async checkDuplicateApplication(
    studentId: string,
    supervisorId: string
  ): Promise<{ isDuplicate: boolean; existingApplicationId?: string }> {
    try {
      // Check if student already has an application to this supervisor
      const studentApplications = await applicationRepository.findAll([
        { field: 'studentId', operator: '==', value: studentId },
        { field: 'supervisorId', operator: '==', value: supervisorId }
      ]);

      const pendingOrApprovedStudentApps = studentApplications.filter(
        app => app.status === 'pending' || app.status === 'approved'
      );

      if (pendingOrApprovedStudentApps.length > 0) {
        return { 
          isDuplicate: true, 
          existingApplicationId: pendingOrApprovedStudentApps[0].id 
        };
      }

      // Check if student is already a partner in an application to this supervisor
      const partnerApplications = await applicationRepository.findAll([
        { field: 'partnerId', operator: '==', value: studentId },
        { field: 'supervisorId', operator: '==', value: supervisorId }
      ]);

      const pendingOrApprovedPartnerApps = partnerApplications.filter(
        app => app.status === 'pending' || app.status === 'approved'
      );

      if (pendingOrApprovedPartnerApps.length > 0) {
        return { 
          isDuplicate: true, 
          existingApplicationId: pendingOrApprovedPartnerApps[0].id 
        };
      }

      return { isDuplicate: false };
      
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'checkDuplicateApplication', error, { studentId, supervisorId });
      // On error, assume no duplicate to avoid blocking legitimate applications
      return { isDuplicate: false };
    }
  },
};
