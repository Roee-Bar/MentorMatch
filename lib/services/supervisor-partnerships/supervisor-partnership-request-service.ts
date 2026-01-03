// lib/services/supervisor-partnerships/supervisor-partnership-request-service.ts

import { logger } from '@/lib/logger';
import { supervisorPartnershipRequestRepository } from '@/lib/repositories/supervisor-partnership-request-repository';
import type { SupervisorPartnershipRequest } from '@/types/database';

const SERVICE_NAME = 'SupervisorPartnershipRequestService';

export const SupervisorPartnershipRequestService = {
  async getById(requestId: string): Promise<SupervisorPartnershipRequest | null> {
    try {
      return await supervisorPartnershipRequestRepository.findById(requestId);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getById', error, { requestId });
      return null;
    }
  },

  /**
   * Get partnership requests for a supervisor
   * @param supervisorId - The supervisor's ID
   * @param type - 'incoming' for requests received, 'outgoing' for sent, 'all' for both
   */
  async getBySupervisor(
    supervisorId: string, 
    type: 'incoming' | 'outgoing' | 'all'
  ): Promise<SupervisorPartnershipRequest[]> {
    try {
      if (type === 'all') {
        const [incomingRequests, outgoingRequests] = await Promise.all([
          supervisorPartnershipRequestRepository.findAll([
            { field: 'status', operator: '==', value: 'pending' },
            { field: 'targetSupervisorId', operator: '==', value: supervisorId }
          ]),
          supervisorPartnershipRequestRepository.findAll([
            { field: 'status', operator: '==', value: 'pending' },
            { field: 'requestingSupervisorId', operator: '==', value: supervisorId }
          ])
        ]);

        const requestMap = new Map<string, SupervisorPartnershipRequest>();
        
        incomingRequests.forEach(request => {
          requestMap.set(request.id, request);
        });
        
        outgoingRequests.forEach(request => {
          requestMap.set(request.id, request);
        });

        return Array.from(requestMap.values());
      }

      if (type === 'incoming') {
        return supervisorPartnershipRequestRepository.findAll([
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'targetSupervisorId', operator: '==', value: supervisorId }
        ]);
      } else {
        return supervisorPartnershipRequestRepository.findAll([
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'requestingSupervisorId', operator: '==', value: supervisorId }
        ]);
      }
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getBySupervisor', error, { supervisorId, type });
      return [];
    }
  },

  /**
   * Check for existing pending request between two supervisors for a project
   * Returns whether a request exists
   */
  async checkExistingRequest(
    requestingSupervisorId: string, 
    targetSupervisorId: string,
    projectId: string
  ): Promise<boolean> {
    try {
      const existingRequests = await supervisorPartnershipRequestRepository.findAll([
        { field: 'requestingSupervisorId', operator: '==', value: requestingSupervisorId },
        { field: 'targetSupervisorId', operator: '==', value: targetSupervisorId },
        { field: 'projectId', operator: '==', value: projectId },
        { field: 'status', operator: '==', value: 'pending' }
      ]);

      return existingRequests.length > 0;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'checkExistingRequest', error, { requestingSupervisorId, targetSupervisorId, projectId });
      return false;
    }
  },

  /**
   * Update request status
   */
  async updateStatus(
    requestId: string, 
    status: 'accepted' | 'rejected' | 'cancelled'
  ): Promise<void> {
    await supervisorPartnershipRequestRepository.update(requestId, {
      status,
      respondedAt: new Date()
    } as Partial<SupervisorPartnershipRequest>);
  },
};

