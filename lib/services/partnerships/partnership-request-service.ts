// lib/services/partnerships/partnership-request-service.ts
// SERVER-ONLY: Partnership request CRUD operations

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toPartnershipRequest } from '@/lib/services/shared/firestore-converters';
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
      const requestDoc = await adminDb.collection('partnership_requests').doc(requestId).get();
      if (requestDoc.exists) {
        return toPartnershipRequest(requestDoc.id, requestDoc.data()!);
      }
      return null;
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
        const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
          adminDb.collection('partnership_requests')
            .where('status', '==', 'pending')
            .where('targetStudentId', '==', studentId)
            .get(),
          adminDb.collection('partnership_requests')
            .where('status', '==', 'pending')
            .where('requesterId', '==', studentId)
            .get()
        ]);

        // Merge and deduplicate by request ID
        const requestMap = new Map<string, StudentPartnershipRequest>();
        
        incomingSnapshot.docs.forEach(doc => {
          const request = toPartnershipRequest(doc.id, doc.data());
          requestMap.set(request.id, request);
        });
        
        outgoingSnapshot.docs.forEach(doc => {
          const request = toPartnershipRequest(doc.id, doc.data());
          requestMap.set(request.id, request);
        });

        return Array.from(requestMap.values());
      }

      // For 'incoming' or 'outgoing', use a single query
      let query = adminDb.collection('partnership_requests')
        .where('status', '==', 'pending');

      if (type === 'incoming') {
        query = query.where('targetStudentId', '==', studentId);
      } else {
        query = query.where('requesterId', '==', studentId);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => toPartnershipRequest(doc.id, doc.data()));
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
      const existingRequest = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', requesterId)
        .where('targetStudentId', '==', targetStudentId)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        return { exists: true, isReverse: false };
      }

      // Check reverse direction (target -> requester)
      const reverseRequest = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', targetStudentId)
        .where('targetStudentId', '==', requesterId)
        .where('status', '==', 'pending')
        .get();

      if (!reverseRequest.empty) {
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
    await adminDb.collection('partnership_requests').doc(requestId).update({
      status,
      respondedAt: new Date()
    });
  },
};

