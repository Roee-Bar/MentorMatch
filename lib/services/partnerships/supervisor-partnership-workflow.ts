// lib/services/partnerships/supervisor-partnership-workflow.ts
// SERVER-ONLY: Supervisor partnership workflow business logic
// Handles create/accept/reject/cancel operations with validation
//
// SUPERVISOR PARTNERSHIP SYSTEM DESIGN (PROJECT-BASED):
// =========================
// - Partnerships are formed FOR SPECIFIC PROJECTS during project creation/editing
// - Supervisors can have MULTIPLE active partnerships simultaneously (one per project)
// - Partnerships are tracked via Project.coSupervisorId, NOT on Supervisor documents
// - Partnerships automatically END when project completes or is cancelled
// - The supervisor_partnership_requests collection tracks pending requests for projects
//
// PARTNERSHIP LIFECYCLE:
// 1. Formation: Supervisor requests partnership with another supervisor for a specific project
// 2. Active: Partnership exists while Project.coSupervisorId is set
// 3. End: When project status changes to completed/cancelled, coSupervisorId is cleared
//
// TRANSACTION SAFETY:
// - Critical operations use Firestore transactions to prevent race conditions
// - Project updates are atomic with request state changes

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { ProjectService } from '@/lib/services/projects/project-service';
import { SupervisorPartnershipRequestService } from './supervisor-partnership-request-service';
import { SupervisorPartnershipPairingService } from './supervisor-partnership-pairing';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { SupervisorPartnershipRequest } from '@/types/database';

const SERVICE_NAME = 'SupervisorPartnershipWorkflowService';

// ============================================
// SUPERVISOR PARTNERSHIP WORKFLOW OPERATIONS
// ============================================
export const SupervisorPartnershipWorkflowService = {
  /**
   * Create a new supervisor partnership request for a specific project
   * 
   * Design Notes:
   * - projectId is REQUIRED - partnerships are project-specific
   * - Validates project exists and requester is the project's supervisor
   * - Validates target supervisor has available capacity
   * - Uses transaction to atomically validate and create request
   */
  async createRequest(
    requesterId: string, 
    targetSupervisorId: string,
    projectId: string // REQUIRED - partnership is for specific project
  ): Promise<ServiceResult<string>> {
    try {
      // Validate project exists and requester is project supervisor
      const project = await ProjectService.getProjectById(projectId);
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      if (project.supervisorId !== requesterId) {
        return ServiceResults.error('Only the project supervisor can request a co-supervisor partnership');
      }

      // Check if project already has a co-supervisor
      if (project.coSupervisorId) {
        return ServiceResults.error('This project already has a co-supervisor');
      }

      // Get both supervisor profiles
      const [requester, target] = await Promise.all([
        SupervisorService.getSupervisorById(requesterId),
        SupervisorService.getSupervisorById(targetSupervisorId)
      ]);

      if (!requester || !target) {
        return ServiceResults.error('One or both supervisors not found');
      }

      // Prevent self-partnership
      if (requesterId === targetSupervisorId) {
        return ServiceResults.error('You cannot send a partnership request to yourself');
      }

      // Validate target supervisor has available capacity
      if (target.currentCapacity >= target.maxCapacity) {
        return ServiceResults.error('Target supervisor has no available capacity');
      }

      // Check for duplicate requests for this project
      const existingCheck = await SupervisorPartnershipRequestService.checkExistingRequest(
        requesterId, 
        targetSupervisorId,
        projectId
      );

      if (existingCheck.exists) {
        if (existingCheck.isReverse) {
          return ServiceResults.error('This supervisor has already sent you a request for this project. Check your incoming requests.');
        }
        return ServiceResults.error('You already have a pending request with this supervisor for this project');
      }

      // Use transaction to atomically create request
      let requestId = '';
      
      await adminDb.runTransaction(async (transaction) => {
        // Verify project still exists and doesn't have co-supervisor
        const projectRef = adminDb.collection('projects').doc(projectId);
        const projectSnap = await transaction.get(projectRef);
        
        if (!projectSnap.exists) {
          throw new Error('Project not found');
        }

        const projectData = projectSnap.data();
        if (projectData?.coSupervisorId) {
          throw new Error('This project already has a co-supervisor');
        }

        if (projectData?.supervisorId !== requesterId) {
          throw new Error('Only the project supervisor can request a co-supervisor partnership');
        }

        // Create request document
        const requestData = {
          requesterId,
          requesterName: requester.fullName,
          requesterEmail: requester.email,
          requesterDepartment: requester.department,
          targetSupervisorId,
          targetSupervisorName: target.fullName,
          targetSupervisorEmail: target.email,
          targetDepartment: target.department,
          projectId, // REQUIRED
          status: 'pending',
          createdAt: new Date(),
        };

        const requestRef = adminDb.collection('supervisor_partnership_requests').doc();
        requestId = requestRef.id;
        transaction.set(requestRef, requestData);
      });

      return ServiceResults.success(requestId, 'Partnership request created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createRequest', error, { requesterId, targetSupervisorId, projectId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create partnership request'
      );
    }
  },

  /**
   * Accept or reject a supervisor partnership request
   */
  async respondToRequest(
    requestId: string,
    targetSupervisorId: string,
    action: 'accept' | 'reject'
  ): Promise<ServiceResult> {
    try {
      const request = await SupervisorPartnershipRequestService.getById(requestId);
      
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      if (request.targetSupervisorId !== targetSupervisorId) {
        return ServiceResults.error('Unauthorized to respond to this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Request already processed');
      }

      if (action === 'accept') {
        return this._acceptRequest(request, requestId, targetSupervisorId);
      } else if (action === 'reject') {
        return this._rejectRequest(request, requestId, targetSupervisorId);
      }

      return ServiceResults.error('Invalid action');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'respondToRequest', error, { requestId, targetSupervisorId, action });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to respond to partnership request'
      );
    }
  },

  /**
   * Cancel an outgoing supervisor partnership request (by requester)
   * Uses transaction to atomically verify request state and update status
   */
  async cancelRequest(
    requestId: string,
    requesterId: string
  ): Promise<ServiceResult> {
    try {
      const request = await SupervisorPartnershipRequestService.getById(requestId);
      
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      if (request.requesterId !== requesterId) {
        return ServiceResults.error('Unauthorized to cancel this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Can only cancel pending requests');
      }

      // Use transaction to atomically verify and update request status
      await adminDb.runTransaction(async (transaction) => {
        const requestRef = adminDb.collection('supervisor_partnership_requests').doc(requestId);

        // Read request document to verify it's still pending (atomic check)
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists) {
          throw new Error('Partnership request not found');
        }

        const requestData = requestSnap.data();
        if (requestData?.status !== 'pending') {
          throw new Error('Request is no longer pending');
        }

        // Update request status within transaction
        transaction.update(requestRef, {
          status: 'cancelled',
          respondedAt: new Date()
        });
      });

      return ServiceResults.success(undefined, 'Partnership request cancelled');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelRequest', error, { requestId, requesterId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cancel partnership request'
      );
    }
  },

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Handle accepting a supervisor partnership request
   * 
   * Design Notes:
   * - Sets coSupervisorId and coSupervisorName on the Project document
   * - Verifies project exists and requester is project supervisor
   * - Verifies target supervisor has available capacity
   * - Cancels all other pending requests for this project (cleanup)
   * - Uses transaction to prevent race conditions
   * 
   * Status Terminology: When a partnership is accepted, all other pending requests
   * for the same project are automatically "cancelled" (not "rejected"). This distinction
   * helps differentiate between:
   * - "Cancelled": Automatic cleanup when a partnership is accepted
   * - "Rejected": Explicit user action when a supervisor rejects a request
   */
  async _acceptRequest(
    request: SupervisorPartnershipRequest,
    requestId: string,
    targetSupervisorId: string
  ): Promise<ServiceResult> {
    // Use transaction to prevent race conditions
    await adminDb.runTransaction(async (transaction) => {
      const projectRef = adminDb.collection('projects').doc(request.projectId);
      const requestRef = adminDb.collection('supervisor_partnership_requests').doc(requestId);
      const targetSupervisorRef = adminDb.collection('supervisors').doc(targetSupervisorId);

      // Read project and target supervisor documents
      const [projectSnap, targetSupervisorSnap] = await transaction.getAll(projectRef, targetSupervisorRef);

      // Verify project exists
      if (!projectSnap.exists) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      
      // Verify requester is still the project supervisor
      if (projectData?.supervisorId !== request.requesterId) {
        throw new Error('Project supervisor has changed');
      }

      // Verify project doesn't already have a co-supervisor
      if (projectData?.coSupervisorId) {
        throw new Error('This project already has a co-supervisor');
      }

      // Verify target supervisor exists and has capacity
      if (!targetSupervisorSnap.exists) {
        throw new Error('Target supervisor not found');
      }

      const targetSupervisorData = targetSupervisorSnap.data();
      if (targetSupervisorData && targetSupervisorData.currentCapacity >= targetSupervisorData.maxCapacity) {
        throw new Error('Target supervisor has no available capacity');
      }

      // Update project with co-supervisor
      transaction.update(projectRef, {
        coSupervisorId: targetSupervisorId,
        coSupervisorName: request.targetSupervisorName,
        updatedAt: new Date()
      });

      // Update request status
      transaction.update(requestRef, {
        status: 'accepted',
        respondedAt: new Date()
      });
    });

    // Cancel all other pending requests for this project (cleanup outside transaction)
    // Note: These are marked as "cancelled" (automatic cleanup), not "rejected" (user action)
    await SupervisorPartnershipPairingService.cancelAllPendingRequestsForProject(request.projectId);

    return ServiceResults.success(undefined, 'Partnership accepted successfully');
  },

  /**
   * Handle rejecting a supervisor partnership request
   * Uses transaction to atomically verify request state and update status
   * 
   * Status Terminology: "Rejected" is used when a supervisor explicitly rejects a request.
   * This differs from "Cancelled" which is used for requests automatically cancelled when
   * a partnership is accepted (see cancelAllPendingRequestsForProject).
   */
  async _rejectRequest(
    request: SupervisorPartnershipRequest,
    requestId: string,
    targetSupervisorId: string
  ): Promise<ServiceResult> {
    // Use transaction to atomically verify and update request status
    await adminDb.runTransaction(async (transaction) => {
      const requestRef = adminDb.collection('supervisor_partnership_requests').doc(requestId);

      // Read request document to verify it's still pending (atomic check)
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists) {
        throw new Error('Partnership request not found');
      }

      const requestData = requestSnap.data();
      if (requestData?.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      // Update request status within transaction
      transaction.update(requestRef, {
        status: 'rejected',
        respondedAt: new Date()
      });
    });

    return ServiceResults.success(undefined, 'Partnership request rejected');
  },

};
