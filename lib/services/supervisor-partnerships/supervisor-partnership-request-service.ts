// lib/services/supervisor-partnerships/supervisor-partnership-request-service.ts
// SERVER-ONLY: Supervisor partnership request CRUD operations

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toSupervisorPartnershipRequest } from '@/lib/services/shared/firestore-converters';
import type { SupervisorPartnershipRequest } from '@/types/database';

const SERVICE_NAME = 'SupervisorPartnershipRequestService';

// ============================================
// SUPERVISOR PARTNERSHIP REQUEST CRUD OPERATIONS
// ============================================
export const SupervisorPartnershipRequestService = {
  /**
   * Get specific partnership request by ID
   */
  async getById(requestId: string): Promise<SupervisorPartnershipRequest | null> {
    try {
      const requestDoc = await adminDb.collection('supervisor-partnership-requests').doc(requestId).get();
      if (requestDoc.exists) {
        return toSupervisorPartnershipRequest(requestDoc.id, requestDoc.data()!);
      }
      return null;
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
        // For 'all', query both incoming and outgoing requests separately
        const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
          adminDb.collection('supervisor-partnership-requests')
            .where('status', '==', 'pending')
            .where('targetSupervisorId', '==', supervisorId)
            .get(),
          adminDb.collection('supervisor-partnership-requests')
            .where('status', '==', 'pending')
            .where('requestingSupervisorId', '==', supervisorId)
            .get()
        ]);

        // Merge and deduplicate by request ID
        const requestMap = new Map<string, SupervisorPartnershipRequest>();
        
        incomingSnapshot.docs.forEach(doc => {
          const request = toSupervisorPartnershipRequest(doc.id, doc.data());
          requestMap.set(request.id, request);
        });
        
        outgoingSnapshot.docs.forEach(doc => {
          const request = toSupervisorPartnershipRequest(doc.id, doc.data());
          requestMap.set(request.id, request);
        });

        return Array.from(requestMap.values());
      }

      // For 'incoming' or 'outgoing', use a single query
      let query = adminDb.collection('supervisor-partnership-requests')
        .where('status', '==', 'pending');

      if (type === 'incoming') {
        query = query.where('targetSupervisorId', '==', supervisorId);
      } else {
        query = query.where('requestingSupervisorId', '==', supervisorId);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => toSupervisorPartnershipRequest(doc.id, doc.data()));
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
      const existingRequest = await adminDb.collection('supervisor-partnership-requests')
        .where('requestingSupervisorId', '==', requestingSupervisorId)
        .where('targetSupervisorId', '==', targetSupervisorId)
        .where('projectId', '==', projectId)
        .where('status', '==', 'pending')
        .get();

      return !existingRequest.empty;
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
    await adminDb.collection('supervisor-partnership-requests').doc(requestId).update({
      status,
      respondedAt: new Date()
    });
  },
};

