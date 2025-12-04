/**
 * Application Workflow Service
 * 
 * Business logic for application status management, resubmission, and validation.
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 */

import { adminDb } from '@/lib/firebase-admin';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import type { Application, ApplicationStatus } from '@/types/database';

export const ApplicationWorkflowService = {
  /**
   * Validate and update application status with capacity management
   * Handles: status transitions, linked applications, supervisor capacity
   */
  async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    feedback?: string,
    currentUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch application
      const application = await ApplicationService.getApplicationById(applicationId);
      
      if (!application) {
        return { success: false, error: 'Application not found. It may have been deleted.' };
      }

      // Authorization check
      const isSupervisor = currentUserId === application.supervisorId;
      const isAdmin = false; // Role check should be done at route level
      
      // This check is just for safety, authorization should be handled by route
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
                `Cannot approve: Supervisor has reached maximum capacity (${currentCapacity}/${maxCapacity} projects). Please contact admin to increase capacity or select a different supervisor.`
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
          const applicationRef = adminDb.collection('applications').doc(applicationId);
          const updateData: any = {
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

      } else {
        // No capacity change needed - update normally
        const success = await ApplicationService.updateApplicationStatus(
          applicationId,
          newStatus,
          feedback
        );

        if (!success) {
          return { success: false, error: 'Failed to update application status' };
        }
      }

      return { success: true };
      
    } catch (error: any) {
      console.error('Error in updateApplicationStatus:', error);
      return { success: false, error: error.message || 'Internal server error' };
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
      const updateData: any = {
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

      return { 
        success: true,
        message: 'Application resubmitted successfully. The supervisor will review your changes.' 
      };
      
    } catch (error: any) {
      console.error('Error in resubmitApplication:', error);
      return { success: false, error: error.message || 'An error occurred while resubmitting the application. Please try again.' };
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
      console.error('Error checking duplicate application:', error);
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
        
        // Update partner's application to link back
        await adminDb.collection('applications').doc(linkedApplicationId).update({
          linkedApplicationId: 'pending', // Will be updated with this application's ID after creation
          lastUpdated: new Date()
        });

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
      console.error('Error handling partner application link:', error);
      // On error, treat as solo application
      return {
        linkedApplicationId: undefined,
        isLeadApplication: true
      };
    }
  },
};

