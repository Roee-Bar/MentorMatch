// lib/services/partnerships/partnership-workflow.ts
// SERVER-ONLY: Partnership workflow business logic
// Handles create/accept/reject/cancel operations with validation
//
// PARTNERSHIP SYSTEM DESIGN:
// =========================
// - Students can have multiple pending partnership requests simultaneously
// - partnershipStatus field values: 'none' (default) or 'paired'
// - partnerId field: null when unpaired, contains partner's UID when paired
// - partnerId is the single source of truth for pairing status
// - Status remains 'none' while requests are pending (even multiple requests)
// - Status becomes 'paired' only when a request is accepted
// - The partnership_requests collection tracks all pending requests
//
// DATA CONSISTENCY:
// - If partnerId exists, partnershipStatus must be 'paired'
// - If partnershipStatus is 'paired', partnerId must exist
// - Students with pending requests have partnershipStatus: 'none'
//
// TRANSACTION SAFETY:
// - Critical operations use Firestore transactions to prevent race conditions
// - Status updates are atomic with request state changes

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { StudentService } from '@/lib/services/students/student-service';
import { PartnershipRequestService } from './partnership-request-service';
import { PartnershipPairingService } from './partnership-pairing';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { StudentPartnershipRequest } from '@/types/database';
import type { WriteResult } from 'firebase-admin/firestore';

const SERVICE_NAME = 'PartnershipWorkflowService';

// ============================================
// PARTNERSHIP WORKFLOW OPERATIONS
// ============================================
export const PartnershipWorkflowService = {
  /**
   * Create a new partnership request with validation
   * 
   * Design Notes:
   * - Students can send multiple requests (status remains 'none')
   * - No status update is performed when creating a request
   * - Status only changes to 'paired' when a request is accepted
   * - Uses transaction to atomically validate and create request
   */
  async createRequest(
    requesterId: string, 
    targetStudentId: string
  ): Promise<ServiceResult<string>> {
    try {
      // Get both student profiles first
      const [requester, target] = await Promise.all([
        StudentService.getStudentById(requesterId),
        StudentService.getStudentById(targetStudentId)
      ]);

      if (!requester || !target) {
        return ServiceResults.error('One or both students not found');
      }

      // Check for duplicate requests
      const existingCheck = await PartnershipRequestService.checkExistingRequest(
        requesterId, 
        targetStudentId
      );

      if (existingCheck.exists) {
        if (existingCheck.isReverse) {
          return ServiceResults.error('This student has already sent you a request. Check your incoming requests.');
        }
        return ServiceResults.error('You already have a pending request with this student');
      }

      // Use transaction to atomically check and update student statuses
      let requestId = '';
      
      await adminDb.runTransaction(async (transaction) => {
        const requesterRef = adminDb.collection('students').doc(requesterId);
        const targetRef = adminDb.collection('students').doc(targetStudentId);

        // Read both student documents in transaction
        const [requesterSnap, targetSnap] = await transaction.getAll(requesterRef, targetRef);

        if (!requesterSnap.exists || !targetSnap.exists) {
          throw new Error('One or both students not found');
        }

        const requesterData = requesterSnap.data();
        const targetData = targetSnap.data();

        // Validate partnership status for both students
        this._validatePartnershipStatus(requesterData, 'requester');
        this._validatePartnershipStatus(targetData, 'target');

        // Create request document
        const requestData = {
          requesterId,
          requesterName: requester.fullName,
          requesterEmail: requester.email,
          requesterStudentId: requester.studentId,
          requesterDepartment: requester.department,
          targetStudentId,
          targetStudentName: target.fullName,
          targetStudentEmail: target.email,
          targetDepartment: target.department,
          status: 'pending',
          createdAt: new Date(),
        };

        const requestRef = adminDb.collection('partnership_requests').doc();
        requestId = requestRef.id;
        transaction.set(requestRef, requestData);

        // Note: No status update needed - students can have multiple requests
        // Status remains 'none' until a request is accepted (then becomes 'paired')
      });

      return ServiceResults.success(requestId, 'Partnership request created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createRequest', error, { requesterId, targetStudentId });
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
    targetStudentId: string,
    action: 'accept' | 'reject'
  ): Promise<ServiceResult> {
    try {
      const request = await PartnershipRequestService.getById(requestId);
      
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      if (request.targetStudentId !== targetStudentId) {
        return ServiceResults.error('Unauthorized to respond to this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Request already processed');
      }

      if (action === 'accept') {
        return this._acceptRequest(request, requestId, targetStudentId);
      } else if (action === 'reject') {
        return this._rejectRequest(request, requestId, targetStudentId);
      }

      return ServiceResults.error('Invalid action');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'respondToRequest', error, { requestId, targetStudentId, action });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to respond to partnership request'
      );
    }
  },

  /**
   * Cancel an outgoing partnership request (by requester)
   * Uses transaction to atomically verify request state and update status
   * 
   * Design: Students can have multiple pending requests. Status remains 'none' until paired.
   * When cancelling, we only reset status to 'none' if no other pending requests exist.
   */
  async cancelRequest(
    requestId: string,
    requesterId: string
  ): Promise<ServiceResult> {
    try {
      const request = await PartnershipRequestService.getById(requestId);
      
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      if (request.requesterId !== requesterId) {
        return ServiceResults.error('Unauthorized to cancel this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Can only cancel pending requests');
      }

      // Query for other pending requests (read operation, safe outside transaction)
      // We'll verify the request is still pending within the transaction
      const [otherOutgoingSnapshot, otherIncomingSnapshot] = await Promise.all([
        adminDb.collection('partnership_requests')
          .where('requesterId', '==', requesterId)
          .where('status', '==', 'pending')
          .get(),
        adminDb.collection('partnership_requests')
          .where('targetStudentId', '==', request.targetStudentId)
          .where('status', '==', 'pending')
          .get()
      ]);

      // Filter out the current request being cancelled
      const hasOtherOutgoing = otherOutgoingSnapshot.docs.some(doc => doc.id !== requestId);
      const hasOtherIncoming = otherIncomingSnapshot.docs.some(doc => doc.id !== requestId);

      // Use transaction to atomically:
      // 1. Verify request is still pending (prevents double-cancellation)
      // 2. Update request status to cancelled
      // 3. Conditionally reset student partnership status based on pre-queried results
      await adminDb.runTransaction(async (transaction) => {
        const requestRef = adminDb.collection('partnership_requests').doc(requestId);
        const requesterRef = adminDb.collection('students').doc(requesterId);
        const targetRef = adminDb.collection('students').doc(request.targetStudentId);

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

        // Conditionally reset student partnership status only if no other pending requests
        // Note: We use the pre-queried results, but the transaction ensures the request
        // update is atomic. If other requests were created between query and transaction,
        // status will remain 'none' which is correct (students with requests have status 'none')
        if (!hasOtherOutgoing) {
          transaction.update(requesterRef, {
            partnershipStatus: 'none',
            updatedAt: new Date()
          });
        }

        if (!hasOtherIncoming) {
          transaction.update(targetRef, {
            partnershipStatus: 'none',
            updatedAt: new Date()
          });
        }
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
   * Validate that student has correct partnership status for operation
   * 
   * Design: partnerId is the single source of truth for pairing status.
   * If partnerId exists, student is paired. Status field is secondary.
   * Students with status 'none' (or no status) can send/receive multiple requests.
   */
  _validatePartnershipStatus(
    studentData: FirebaseFirestore.DocumentData | undefined, 
    role: 'requester' | 'target'
  ): void {
    const partnerId = studentData?.partnerId;
    const status = studentData?.partnershipStatus;
    
    // partnerId is definitive - if it exists, student is paired
    if (partnerId) {
      if (role === 'requester') {
        throw new Error('You are already paired with another student');
      } else {
        throw new Error('Target student is already paired');
      }
    }
    
    // Defensive check for unexpected status values (data consistency validation)
    if (status && status !== 'none' && status !== 'paired') {
      throw new Error(`Invalid partnership status: ${status}. Expected 'none' or 'paired'.`);
    }
    
    // Allow sending/receiving requests if status is 'none' or undefined
    // Students can have multiple pending requests with status 'none'
    return;
  },

  /**
   * Handle accepting a partnership request
   * 
   * Design Notes:
   * - Updates both students to 'paired' status within transaction
   * - Sets partnerId for both students (bidirectional relationship)
   * - Cancels all other pending requests for both students (cleanup)
   * - Uses transaction to prevent race conditions
   */
  async _acceptRequest(
    request: StudentPartnershipRequest,
    requestId: string,
    targetStudentId: string
  ): Promise<ServiceResult> {
    // Use transaction to prevent race conditions
    await adminDb.runTransaction(async (transaction) => {
      const requesterRef = adminDb.collection('students').doc(request.requesterId);
      const targetRef = adminDb.collection('students').doc(targetStudentId);
      const requestRef = adminDb.collection('partnership_requests').doc(requestId);

      // Read both student documents
      const [requesterSnap, targetSnap] = await transaction.getAll(requesterRef, targetRef);

      // Verify students exist
      if (!requesterSnap.exists || !targetSnap.exists) {
        throw new Error('One or both students not found');
      }

      const requesterData = requesterSnap.data();
      const targetData = targetSnap.data();

      // Verify neither student is already paired (partnerId is single source of truth)
      if (requesterData?.partnerId) {
        throw new Error('Requester is already paired with another student');
      }

      if (targetData?.partnerId) {
        throw new Error('You are already paired with another student');
      }

      // Update both students to paired
      transaction.update(requesterRef, {
        partnerId: targetStudentId,
        partnershipStatus: 'paired',
        updatedAt: new Date()
      });

      transaction.update(targetRef, {
        partnerId: request.requesterId,
        partnershipStatus: 'paired',
        updatedAt: new Date()
      });

      // Update request status
      transaction.update(requestRef, {
        status: 'accepted',
        respondedAt: new Date()
      });
    });

    // Cancel all other pending requests for both students (cleanup outside transaction)
    await PartnershipPairingService.cancelAllPendingRequests(request.requesterId);
    await PartnershipPairingService.cancelAllPendingRequests(targetStudentId);

    return ServiceResults.success(undefined, 'Partnership accepted successfully');
  },

  /**
   * Handle rejecting a partnership request
   * Uses transaction to atomically verify request state and update status
   * 
   * Design: Students can have multiple pending requests. Status remains 'none' until paired.
   * When rejecting, we only reset status to 'none' if no other pending requests exist.
   */
  async _rejectRequest(
    request: StudentPartnershipRequest,
    requestId: string,
    targetStudentId: string
  ): Promise<ServiceResult> {
    // Query for other pending requests (read operation, safe outside transaction)
    // We'll verify the request is still pending within the transaction
    const [otherOutgoingSnapshot, otherIncomingSnapshot] = await Promise.all([
      adminDb.collection('partnership_requests')
        .where('requesterId', '==', request.requesterId)
        .where('status', '==', 'pending')
        .get(),
      adminDb.collection('partnership_requests')
        .where('targetStudentId', '==', targetStudentId)
        .where('status', '==', 'pending')
        .get()
    ]);

    // Filter out the current request being rejected
    const hasOtherOutgoing = otherOutgoingSnapshot.docs.some(doc => doc.id !== requestId);
    const hasOtherIncoming = otherIncomingSnapshot.docs.some(doc => doc.id !== requestId);

    // Use transaction to atomically:
    // 1. Verify request is still pending (prevents double-processing)
    // 2. Update request status to rejected
    // 3. Conditionally reset student partnership status based on pre-queried results
    await adminDb.runTransaction(async (transaction) => {
      const requestRef = adminDb.collection('partnership_requests').doc(requestId);
      const requesterRef = adminDb.collection('students').doc(request.requesterId);
      const targetRef = adminDb.collection('students').doc(targetStudentId);

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

      // Conditionally reset student partnership status only if no other pending requests
      // Note: We use the pre-queried results, but the transaction ensures the request
      // update is atomic. If other requests were created between query and transaction,
      // status will remain 'none' which is correct (students with requests have status 'none')
      if (!hasOtherOutgoing) {
        transaction.update(requesterRef, {
          partnershipStatus: 'none',
          updatedAt: new Date()
        });
      }

      if (!hasOtherIncoming) {
        transaction.update(targetRef, {
          partnershipStatus: 'none',
          updatedAt: new Date()
        });
      }
    });

    return ServiceResults.success(undefined, 'Partnership request rejected');
  },

  /**
   * Check if student has pending outgoing requests
   * 
   * Error Handling: Returns true on error as safe default to prevent incorrect
   * status resets. If we can't verify pending requests exist, we assume they do
   * to avoid resetting status when requests might still be pending.
   */
  async _hasPendingOutgoingRequests(studentId: string): Promise<boolean> {
    try {
      const snapshot = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', studentId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      logger.service.error(SERVICE_NAME, '_hasPendingOutgoingRequests', error, { studentId });
      // Return true as safe default - prevents incorrect status reset if query fails
      return true;
    }
  },

  /**
   * Check if student has pending incoming requests
   * 
   * Error Handling: Returns true on error as safe default to prevent incorrect
   * status resets. If we can't verify pending requests exist, we assume they do
   * to avoid resetting status when requests might still be pending.
   */
  async _hasPendingIncomingRequests(studentId: string): Promise<boolean> {
    try {
      const snapshot = await adminDb.collection('partnership_requests')
        .where('targetStudentId', '==', studentId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      logger.service.error(SERVICE_NAME, '_hasPendingIncomingRequests', error, { studentId });
      // Return true as safe default - prevents incorrect status reset if query fails
      return true;
    }
  },
};


