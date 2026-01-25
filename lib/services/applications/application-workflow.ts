/**
 * Application Workflow Service
 * 
 * Business logic for application status management, resubmission, and validation.
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 */

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ApplicationService } from '@/lib/services/applications/application-service';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { serviceEvents } from '@/lib/services/shared/events';
import type { Application, ApplicationStatus } from '@/types/database';

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
      const application = await ApplicationService.getApplicationById(applicationId);
      
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

      // Handle linked partner application rejection
      if (newStatus === 'rejected' && application.isLeadApplication && application.linkedApplicationId) {
        const linkedAppRef = adminDb.collection('applications').doc(application.linkedApplicationId);
        const linkedAppSnap = await linkedAppRef.get();
        
        if (linkedAppSnap.exists) {
          const linkedAppData = linkedAppSnap.data();
          if (linkedAppData?.status === 'pending') {
            await linkedAppRef.update({
              status: 'rejected',
              supervisorFeedback: feedback ? `${feedback} (Linked partner application was rejected)` : 'Linked partner application was rejected',
              lastUpdated: new Date(),
              responseDate: new Date()
            });
          }
        }
      }

      // Check if capacity needs to be updated
      const isApproving = newStatus === 'approved' && previousStatus !== 'approved';
      const isUnapproving = previousStatus === 'approved' && newStatus !== 'approved';
      const shouldUpdateCapacity = application.isLeadApplication || !application.linkedApplicationId;
      
      if ((isApproving || isUnapproving) && shouldUpdateCapacity) {
        await adminDb.runTransaction(async (transaction) => {
          const supervisorRef = adminDb.collection('supervisors').doc(application.supervisorId);
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

            // Update student's matchStatus to 'matched'
            const studentRef = adminDb.collection('students').doc(application.studentId);
            transaction.update(studentRef, {
              matchStatus: 'matched',
              assignedSupervisorId: application.supervisorId,
              updatedAt: new Date()
            });

            // If student has a partner, update partner's matchStatus too
            if (application.hasPartner && application.linkedApplicationId) {
              const linkedApp = await ApplicationService.getApplicationById(application.linkedApplicationId);
              if (linkedApp) {
                const partnerRef = adminDb.collection('students').doc(linkedApp.studentId);
                transaction.update(partnerRef, {
                  matchStatus: 'matched',
                  assignedSupervisorId: application.supervisorId,
                  updatedAt: new Date()
                });
              }
            }

          } else if (isUnapproving) {
            const newCapacity = Math.max(0, currentCapacity - 1);
            transaction.update(supervisorRef, {
              currentCapacity: newCapacity,
              updatedAt: new Date()
            });

            // Update student's matchStatus back to 'unmatched'
            const studentRef = adminDb.collection('students').doc(application.studentId);
            transaction.update(studentRef, {
              matchStatus: 'unmatched',
              assignedSupervisorId: null,
              updatedAt: new Date()
            });

            // If student has a partner, update partner's matchStatus too
            if (application.hasPartner && application.linkedApplicationId) {
              const linkedApp = await ApplicationService.getApplicationById(application.linkedApplicationId);
              if (linkedApp) {
                const partnerRef = adminDb.collection('students').doc(linkedApp.studentId);
                transaction.update(partnerRef, {
                  matchStatus: 'unmatched',
                  assignedSupervisorId: null,
                  updatedAt: new Date()
                });
              }
            }
          }

          // Update application status
          const applicationRef = adminDb.collection('applications').doc(applicationId);
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

        // ============================================
        // AFTER APPROVAL: Withdraw all other pending applications
        // ============================================
        // This runs AFTER the transaction succeeds to ensure the approval
        // is committed before we clean up other applications.
        // We do this outside the transaction because:
        // 1. It's a cleanup operation that shouldn't block approval
        // 2. It may involve many documents which could cause transaction limits
        if (isApproving) {
          // Get partner ID if this is a paired application
          let partnerId: string | undefined;
          if (application.hasPartner && application.linkedApplicationId) {
            const linkedApp = await ApplicationService.getApplicationById(application.linkedApplicationId);
            if (linkedApp) {
              partnerId = linkedApp.studentId;
            }
          }

          // Withdraw all other pending applications for this student (and partner)
          await this.withdrawOtherPendingApplications(
            applicationId,
            application.studentId,
            partnerId
          );
        }

      } else {
        // No capacity change needed - update normally
        const result = await ApplicationService.updateApplicationStatus(
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
      const application = await ApplicationService.getApplicationById(applicationId);
      
      if (!application) {
        return { success: false, error: 'Application not found. It may have been deleted.' };
      }

      // Authorization check
      const isOwner = studentId === application.studentId;
      
      if (!isOwner) {
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

      // Handle linked applications
      if (application.linkedApplicationId) {
        const linkedAppRef = adminDb.collection('applications').doc(application.linkedApplicationId);
        const linkedAppSnap = await linkedAppRef.get();
        
        if (linkedAppSnap.exists) {
          const linkedAppData = linkedAppSnap.data();
          
          // If partner is also in revision_requested, transition both
          if (linkedAppData?.status === 'revision_requested') {
            await linkedAppRef.update({
              status: 'pending',
              lastUpdated: new Date(),
              resubmittedDate: new Date(),
            });
          }
        }
      }

      // Update the application
      const applicationRef = adminDb.collection('applications').doc(applicationId);
      await applicationRef.update(updateData);

      // Get supervisor email for event
      const supervisor = await SupervisorService.getSupervisorById(application.supervisorId);

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
   */
  async checkDuplicateApplication(
    studentId: string,
    supervisorId: string
  ): Promise<{ isDuplicate: boolean; existingApplicationId?: string }> {
    try {
      const existingApplicationsSnapshot = await adminDb
        .collection('applications')
        .where('studentId', '==', studentId)
        .where('supervisorId', '==', supervisorId)
        .where('status', 'in', ['pending', 'approved'])
        .get();

      if (!existingApplicationsSnapshot.empty) {
        return { 
          isDuplicate: true, 
          existingApplicationId: existingApplicationsSnapshot.docs[0].id 
        };
      }

      return { isDuplicate: false };
      
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'checkDuplicateApplication', error, { studentId, supervisorId });
      // On error, assume no duplicate to avoid blocking legitimate applications
      return { isDuplicate: false };
    }
  },

  /**
   * Handle linked partner application logic
   * Returns partner application info if exists
   */
  async handlePartnerApplicationLink(
    studentId: string,
    partnerId: string,
    supervisorId: string
  ): Promise<{
    linkedApplicationId?: string;
    isLeadApplication: boolean;
  }> {
    try {
      // Check if partner already has an application to the same supervisor
      const partnerApplicationsSnapshot = await adminDb
        .collection('applications')
        .where('studentId', '==', partnerId)
        .where('supervisorId', '==', supervisorId)
        .where('status', 'in', ['pending', 'approved'])
        .get();

      if (!partnerApplicationsSnapshot.empty) {
        // Partner has an existing application - link to it
        const partnerApplication = partnerApplicationsSnapshot.docs[0];
        const linkedApplicationId = partnerApplication.id;
        
        // Note: The partner's application will be updated to link back after this application is created
        // This is handled in the API route to ensure we have the new application ID

        return {
          linkedApplicationId,
          isLeadApplication: false // This is the second application in the pair
        };
      }

      // No partner application found - this will be the lead
      return {
        linkedApplicationId: undefined,
        isLeadApplication: true
      };
      
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'handlePartnerApplicationLink', error, { studentId, partnerId, supervisorId });
      // On error, treat as solo application
      return {
        linkedApplicationId: undefined,
        isLeadApplication: true
      };
    }
  },

  /**
   * Withdraw all other pending applications for a student (and their partner)
   * Called when an application is approved to clean up other pending applications.
   *
   * This prevents:
   * - Supervisors wasting time reviewing applications from already-matched students
   * - Students being approved by multiple supervisors
   * - Confusion in the system with orphaned pending applications
   *
   * @param approvedApplicationId - The application that was just approved (to exclude from withdrawal)
   * @param studentId - The student whose other applications should be withdrawn
   * @param partnerId - Optional partner's ID to also withdraw their applications
   */
  async withdrawOtherPendingApplications(
    approvedApplicationId: string,
    studentId: string,
    partnerId?: string
  ): Promise<{ withdrawnCount: number; withdrawnApplicationIds: string[] }> {
    const withdrawnApplicationIds: string[] = [];

    try {
      // ============================================
      // STEP 1: Find all pending applications for this student
      // ============================================
      // We look for applications with status 'pending' or 'revision_requested'
      // because both represent applications that haven't been finalized yet
      const studentPendingApps = await adminDb
        .collection('applications')
        .where('studentId', '==', studentId)
        .where('status', 'in', ['pending', 'revision_requested'])
        .get();

      // ============================================
      // STEP 2: Withdraw each pending application (except the approved one)
      // ============================================
      for (const appDoc of studentPendingApps.docs) {
        // Skip the application that was just approved
        if (appDoc.id === approvedApplicationId) {
          continue;
        }

        // Update the application status to 'withdrawn'
        // We use 'withdrawn' instead of deleting to maintain history
        await adminDb.collection('applications').doc(appDoc.id).update({
          status: 'withdrawn',
          supervisorFeedback: 'Automatically withdrawn: Student was approved for another project.',
          lastUpdated: new Date(),
          responseDate: new Date()
        });

        withdrawnApplicationIds.push(appDoc.id);
      }

      // ============================================
      // STEP 3: If student has a partner, withdraw partner's pending applications too
      // ============================================
      // Partners share the same project approval, so all their other
      // pending applications should also be withdrawn
      if (partnerId) {
        const partnerPendingApps = await adminDb
          .collection('applications')
          .where('studentId', '==', partnerId)
          .where('status', 'in', ['pending', 'revision_requested'])
          .get();

        for (const appDoc of partnerPendingApps.docs) {
          // Skip if this is linked to the approved application (same project)
          const appData = appDoc.data();
          if (appData.linkedApplicationId === approvedApplicationId) {
            continue;
          }

          await adminDb.collection('applications').doc(appDoc.id).update({
            status: 'withdrawn',
            supervisorFeedback: 'Automatically withdrawn: Partner was approved for another project.',
            lastUpdated: new Date(),
            responseDate: new Date()
          });

          withdrawnApplicationIds.push(appDoc.id);
        }
      }

      logger.service.success(SERVICE_NAME, 'withdrawOtherPendingApplications', {
        withdrawnCount: withdrawnApplicationIds.length,
        studentId,
        partnerId
      });

      return {
        withdrawnCount: withdrawnApplicationIds.length,
        withdrawnApplicationIds
      };

    } catch (error) {
      logger.service.error(SERVICE_NAME, 'withdrawOtherPendingApplications', error, {
        approvedApplicationId,
        studentId,
        partnerId
      });
      // Don't fail the approval if withdrawal fails - just log it
      return {
        withdrawnCount: withdrawnApplicationIds.length,
        withdrawnApplicationIds
      };
    }
  },
};
