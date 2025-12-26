// lib/services/partnerships/supervisor-partnership-request-service.ts
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
   * Get specific supervisor partnership request by ID
   */
  async getById(requestId: string): Promise<SupervisorPartnershipRequest | null> {
    try {
      const requestDoc = await adminDb.collection('supervisor_partnership_requests').doc(requestId).get();
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
   * Get supervisor partnership requests for a supervisor
   * Filters out expired requests automatically
   * @param supervisorId - The supervisor's ID
   * @param type - 'incoming' for requests received, 'outgoing' for sent, 'all' for both
   */
  async getBySupervisor(
    supervisorId: string, 
    type: 'incoming' | 'outgoing' | 'all'
  ): Promise<SupervisorPartnershipRequest[]> {
    try {
      const now = new Date();
      
      // For 'all', execute two parallel queries and merge results
      if (type === 'all') {
        const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
          adminDb.collection('supervisor_partnership_requests')
            .where('status', '==', 'pending')
            .where('targetSupervisorId', '==', supervisorId)
            .get(),
          adminDb.collection('supervisor_partnership_requests')
            .where('status', '==', 'pending')
            .where('requesterId', '==', supervisorId)
            .get()
        ]);

        const incomingRequests = incomingSnapshot.docs.map(doc => 
          toSupervisorPartnershipRequest(doc.id, doc.data())
        );
        const outgoingRequests = outgoingSnapshot.docs.map(doc => 
          toSupervisorPartnershipRequest(doc.id, doc.data())
        );

        // Merge and filter out expired requests
        const allRequests = [...incomingRequests, ...outgoingRequests];
        return allRequests.filter(req => !req.expiresAt || req.expiresAt > now);
      }

      // For 'incoming' or 'outgoing', execute single query
      let query = adminDb.collection('supervisor_partnership_requests')
        .where('status', '==', 'pending');

      if (type === 'incoming') {
        query = query.where('targetSupervisorId', '==', supervisorId);
      } else if (type === 'outgoing') {
        query = query.where('requesterId', '==', supervisorId);
      }
      
      const snapshot = await query.get();
      const requests = snapshot.docs.map(doc => toSupervisorPartnershipRequest(doc.id, doc.data()));
      
      // Filter out expired requests
      return requests.filter(req => !req.expiresAt || req.expiresAt > now);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getBySupervisor', error, { supervisorId, type });
      return [];
    }
  },

  /**
   * Check for existing pending request between two supervisors for a specific project
   * Returns whether a request exists and if it's a reverse request
   */
  async checkExistingRequest(
    requesterId: string, 
    targetSupervisorId: string,
    projectId: string
  ): Promise<{ exists: boolean; isReverse: boolean }> {
    try {
      // Check same direction (requester -> target) for this project
      const existingRequest = await adminDb.collection('supervisor_partnership_requests')
        .where('requesterId', '==', requesterId)
        .where('targetSupervisorId', '==', targetSupervisorId)
        .where('projectId', '==', projectId)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        return { exists: true, isReverse: false };
      }

      // Check reverse direction (target -> requester) for this project
      const reverseRequest = await adminDb.collection('supervisor_partnership_requests')
        .where('requesterId', '==', targetSupervisorId)
        .where('targetSupervisorId', '==', requesterId)
        .where('projectId', '==', projectId)
        .where('status', '==', 'pending')
        .get();

      if (!reverseRequest.empty) {
        return { exists: true, isReverse: true };
      }

      return { exists: false, isReverse: false };
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'checkExistingRequest', error, { requesterId, targetSupervisorId, projectId });
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
    await adminDb.collection('supervisor_partnership_requests').doc(requestId).update({
      status,
      respondedAt: new Date()
    });
  },

  /**
   * Cancel all pending requests for a specific project
   * Used when project is deleted or when a partnership is accepted for that project
   */
  async cancelRequestsForProject(projectId: string): Promise<void> {
    try {
      const pendingRequests = await adminDb.collection('supervisor_partnership_requests')
        .where('projectId', '==', projectId)
        .where('status', '==', 'pending')
        .get();

      if (pendingRequests.empty) {
        return;
      }

      // Use batch to update all requests atomically
      const batch = adminDb.batch();
      const now = new Date();

      pendingRequests.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'cancelled',
          respondedAt: now
        });
      });

      await batch.commit();

      logger.service.success(SERVICE_NAME, 'cancelRequestsForProject', {
        projectId,
        cancelledCount: pendingRequests.size
      });
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelRequestsForProject', error, { projectId });
      throw error;
    }
  },
};

