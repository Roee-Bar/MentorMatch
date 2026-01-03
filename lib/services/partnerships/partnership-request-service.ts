// lib/services/partnerships/partnership-request-service.ts
// SERVER-ONLY: Partnership request CRUD operations

import { logger } from '@/lib/logger';
import { partnershipRequestRepository } from '@/lib/repositories/partnership-request-repository';
import type { StudentPartnershipRequest } from '@/types/database';

const SERVICE_NAME = 'PartnershipRequestService';

// ============================================
// PARTNERSHIP REQUEST CRUD OPERATIONS
// ============================================
export const PartnershipRequestService = {
  /**
   * Get specific partnership request by ID
   */
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
        // For 'all', query both incoming and outgoing requests separately
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

        // Merge and deduplicate by request ID
        const requestMap = new Map<string, StudentPartnershipRequest>();
        
        incomingRequests.forEach(request => {
          requestMap.set(request.id, request);
        });
        
        outgoingRequests.forEach(request => {
          requestMap.set(request.id, request);
        });

        return Array.from(requestMap.values());
      }

      // For 'incoming' or 'outgoing', use repository methods
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
      // Check same direction (requester -> target)
      const existingRequests = await partnershipRequestRepository.findAll([
        { field: 'requesterId', operator: '==', value: requesterId },
        { field: 'targetStudentId', operator: '==', value: targetStudentId },
        { field: 'status', operator: '==', value: 'pending' }
      ]);

      if (existingRequests.length > 0) {
        return { exists: true, isReverse: false };
      }

      // Check reverse direction (target -> requester)
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

