// lib/services/supervisor-partnerships/supervisor-partnership-workflow.ts

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { projectService } from '@/lib/services/projects/project-service';
import { supervisorRepository } from '@/lib/repositories/supervisor-repository';
import { projectRepository } from '@/lib/repositories/project-repository';
import { supervisorPartnershipRequestRepository } from '@/lib/repositories/supervisor-partnership-request-repository';
import { SupervisorPartnershipRequestService } from './supervisor-partnership-request-service';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { SupervisorPartnershipRequest } from '@/types/database';
import { ERROR_MESSAGES } from '@/lib/constants/error-messages';

const SERVICE_NAME = 'SupervisorPartnershipWorkflowService';

export const SupervisorPartnershipWorkflowService = {
  /**
   * Create a new supervisor partnership request with validation
   */
  async createRequest(
    requestingSupervisorId: string, 
    targetSupervisorId: string,
    projectId: string
  ): Promise<ServiceResult<string>> {
    try {
      // Validate self-partnership attempt
      if (requestingSupervisorId === targetSupervisorId) {
        logger.warn('Self-partnership attempt blocked', {
          context: SERVICE_NAME,
          data: { requestingSupervisorId, targetSupervisorId, projectId }
        });
        return ServiceResults.error(ERROR_MESSAGES.SELF_PARTNERSHIP_BLOCKED);
      }

      // Get both supervisor profiles and project
      const [requestingSupervisor, targetSupervisor, project] = await Promise.all([
        supervisorService.getSupervisorById(requestingSupervisorId),
        supervisorService.getSupervisorById(targetSupervisorId),
        projectService.getProjectById(projectId)
      ]);

      if (!requestingSupervisor || !targetSupervisor) {
        return ServiceResults.error('One or both supervisors not found');
      }

      if (!project) {
        return ServiceResults.error('Project not found');
      }

      // Validate that requesting supervisor is the project supervisor
      if (project.supervisorId !== requestingSupervisorId) {
        return ServiceResults.error('Only the project supervisor can request a co-supervisor');
      }

      // Validate that project doesn't already have a co-supervisor
      if (project.coSupervisorId) {
        return ServiceResults.error('Project already has a co-supervisor');
      }

      // Validate that target supervisor has available capacity
      const availableCapacity = targetSupervisor.maxCapacity - targetSupervisor.currentCapacity;
      if (availableCapacity <= 0) {
        return ServiceResults.error('Target supervisor has no available capacity');
      }

      // Check for existing pending request
      const existingRequest = await SupervisorPartnershipRequestService.checkExistingRequest(
        requestingSupervisorId,
        targetSupervisorId,
        projectId
      );

      if (existingRequest) {
        return ServiceResults.error('Partnership request already exists for this project');
      }

      // Create request document
      let requestId = '';
      
      await adminDb.runTransaction(async (transaction) => {
        const requestRef = supervisorPartnershipRequestRepository.getNewDocumentRef();
        requestId = requestRef.id;

        const requestData = {
          requestingSupervisorId,
          requestingSupervisorName: requestingSupervisor.fullName,
          targetSupervisorId,
          targetSupervisorName: targetSupervisor.fullName,
          projectId,
          projectTitle: project.title,
          status: 'pending',
          createdAt: new Date(),
        };

        transaction.set(requestRef, requestData);
      });

      return ServiceResults.success(requestId, 'Partnership request created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createRequest', error, { requestingSupervisorId, targetSupervisorId, projectId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create partnership request'
      );
    }
  },

  /**
   * Accept or reject a partnership request
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
        return this._rejectRequest(request, requestId);
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
   * Cancel an outgoing partnership request (by requester)
   */
  async cancelRequest(
    requestId: string,
    requestingSupervisorId: string
  ): Promise<ServiceResult> {
    try {
      const request = await SupervisorPartnershipRequestService.getById(requestId);
      
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      if (request.requestingSupervisorId !== requestingSupervisorId) {
        return ServiceResults.error('Unauthorized to cancel this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Can only cancel pending requests');
      }

      // Update request status
      await SupervisorPartnershipRequestService.updateStatus(requestId, 'cancelled');

      return ServiceResults.success(undefined, 'Partnership request cancelled');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelRequest', error, { requestId, requestingSupervisorId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cancel partnership request'
      );
    }
  },

  /**
   * Handle accepting a partnership request
   */
  async _acceptRequest(
    request: SupervisorPartnershipRequest,
    requestId: string,
    targetSupervisorId: string
  ): Promise<ServiceResult> {
    try {
      // Get project and target supervisor to validate capacity
      const [project, targetSupervisor] = await Promise.all([
        projectService.getProjectById(request.projectId),
        supervisorService.getSupervisorById(targetSupervisorId)
      ]);

      if (!project) {
        return ServiceResults.error('Project not found');
      }

      if (!targetSupervisor) {
        return ServiceResults.error('Target supervisor not found');
      }

      // Check capacity again (may have changed)
      const availableCapacity = targetSupervisor.maxCapacity - targetSupervisor.currentCapacity;
      if (availableCapacity <= 0) {
        return ServiceResults.error('Target supervisor no longer has available capacity');
      }

      await adminDb.runTransaction(async (transaction) => {
        const projectRef = projectRepository.getDocumentRef(request.projectId);
        const requestRef = supervisorPartnershipRequestRepository.getDocumentRef(requestId);
        const targetSupervisorRef = supervisorRepository.getDocumentRef(targetSupervisorId);

        transaction.update(projectRef, {
          coSupervisorId: targetSupervisorId,
          coSupervisorName: request.targetSupervisorName,
          updatedAt: new Date()
        });

        // Update target supervisor capacity
        transaction.update(targetSupervisorRef, {
          currentCapacity: FieldValue.increment(1),
          updatedAt: new Date()
        });

        // Update request status
        transaction.update(requestRef, {
          status: 'accepted',
          respondedAt: new Date()
        });
      });

      // Cancel all other pending requests for this project (cleanup outside transaction)
      const allRequests = await SupervisorPartnershipRequestService.getBySupervisor(
        request.requestingSupervisorId,
        'all'
      );
      
      const projectRequests = allRequests.filter(
        r => r.projectId === request.projectId && r.id !== requestId && r.status === 'pending'
      );

      await Promise.all(
        projectRequests.map(r => SupervisorPartnershipRequestService.updateStatus(r.id, 'cancelled'))
      );

      return ServiceResults.success(undefined, 'Partnership accepted successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, '_acceptRequest', error, { requestId, targetSupervisorId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to accept partnership request'
      );
    }
  },

  /**
   * Handle rejecting a partnership request
   */
  async _rejectRequest(
    request: SupervisorPartnershipRequest,
    requestId: string
  ): Promise<ServiceResult> {
    try {
      // Update request status
      await SupervisorPartnershipRequestService.updateStatus(requestId, 'rejected');

      return ServiceResults.success(undefined, 'Partnership request rejected');
    } catch (error) {
      logger.service.error(SERVICE_NAME, '_rejectRequest', error, { requestId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to reject partnership request'
      );
    }
  },
};

