// lib/services/partnerships/partnership-request-service.ts

import { logger } from '@/lib/logger';
import { partnershipRequestRepository } from '@/lib/repositories/partnership-request-repository';
import type { StudentPartnershipRequest } from '@/types/database';

const SERVICE_NAME = 'PartnershipRequestService';

export const PartnershipRequestService = {
  async getById(requestId: string): Promise<StudentPartnershipRequest | null> {
    try {
      return await partnershipRequestRepository.findById(requestId);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getById', error, { requestId });
      return null;
    }
  },

  /**
   * Get partnership requests for a student
   * @param studentId - The student's ID
   * @param type - 'incoming' for requests received, 'outgoing' for sent, 'all' for both
   */
  async getByStudent(
    studentId: string, 
    type: 'incoming' | 'outgoing' | 'all'
  ): Promise<StudentPartnershipRequest[]> {
    try {
      if (type === 'all') {
        const [incomingRequests, outgoingRequests] = await Promise.all([
          partnershipRequestRepository.findAll([
            { field: 'status', operator: '==', value: 'pending' },
            { field: 'targetStudentId', operator: '==', value: studentId }
          ]),
          partnershipRequestRepository.findAll([
            { field: 'status', operator: '==', value: 'pending' },
            { field: 'requesterId', operator: '==', value: studentId }
          ])
        ]);

        const requestMap = new Map<string, StudentPartnershipRequest>();
        
        incomingRequests.forEach(request => {
          requestMap.set(request.id, request);
        });
        
        outgoingRequests.forEach(request => {
          requestMap.set(request.id, request);
        });

        return Array.from(requestMap.values());
      }

      if (type === 'incoming') {
        return partnershipRequestRepository.findAll([
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'targetStudentId', operator: '==', value: studentId }
        ]);
      } else {
        return partnershipRequestRepository.findAll([
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'requesterId', operator: '==', value: studentId }
        ]);
      }
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getByStudent', error, { studentId, type });
      return [];
    }
  },

  /**
   * Check for existing pending request between two students
   * Returns whether a request exists and if it's a reverse request
   */
  async checkExistingRequest(
    requesterId: string, 
    targetStudentId: string
  ): Promise<{ exists: boolean; isReverse: boolean }> {
    try {
      const existingRequests = await partnershipRequestRepository.findAll([
        { field: 'requesterId', operator: '==', value: requesterId },
        { field: 'targetStudentId', operator: '==', value: targetStudentId },
        { field: 'status', operator: '==', value: 'pending' }
      ]);

      if (existingRequests.length > 0) {
        return { exists: true, isReverse: false };
      }

      const reverseRequests = await partnershipRequestRepository.findAll([
        { field: 'requesterId', operator: '==', value: targetStudentId },
        { field: 'targetStudentId', operator: '==', value: requesterId },
        { field: 'status', operator: '==', value: 'pending' }
      ]);

      if (reverseRequests.length > 0) {
        return { exists: true, isReverse: true };
      }

      return { exists: false, isReverse: false };
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'checkExistingRequest', error, { requesterId, targetStudentId });
      return { exists: false, isReverse: false };
    }
  },

  /**
   * Update request status
   */
  async updateStatus(
    requestId: string, 
    status: 'accepted' | 'rejected' | 'cancelled'
  ): Promise<void> {
    await partnershipRequestRepository.update(requestId, {
      status,
      respondedAt: new Date()
    } as Partial<StudentPartnershipRequest>);
  },
};

