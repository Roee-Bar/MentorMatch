// lib/services/partnerships/partnership-workflow.ts

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { studentService } from '@/lib/services/students/student-service';
import { studentRepository } from '@/lib/repositories/student-repository';
import { partnershipRequestRepository } from '@/lib/repositories/partnership-request-repository';
import { PartnershipRequestService } from './partnership-request-service';
import { PartnershipPairingService } from './partnership-pairing';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { StudentPartnershipRequest } from '@/types/database';
import type { Transaction } from 'firebase-admin/firestore';

const SERVICE_NAME = 'PartnershipWorkflowService';

export const PartnershipWorkflowService = {
  async createRequest(
    requesterId: string, 
    targetStudentId: string
  ): Promise<ServiceResult<string>> {
    try {
      // Get both student profiles first
      const [requester, target] = await Promise.all([
        studentService.getStudentById(requesterId),
        studentService.getStudentById(targetStudentId)
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
      
      await adminDb.runTransaction(async (transaction: Transaction) => {
        const requesterRef = studentRepository.getDocumentRef(requesterId);
        const targetRef = studentRepository.getDocumentRef(targetStudentId);

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

        const requestRef = partnershipRequestRepository.getNewDocumentRef();
        requestId = requestRef.id;
        transaction.set(requestRef, requestData);

        // Note: No longer updating partnershipStatus here
        // Status is only set to 'paired' when request is accepted
        // Pending request state is tracked in partnership_requests collection
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

      // Check for other pending requests BEFORE updating status to avoid race conditions
      const [requesterOtherRequests, targetOtherRequests] = await Promise.all([
        PartnershipRequestService.getByStudent(requesterId, 'all'),
        PartnershipRequestService.getByStudent(request.targetStudentId, 'all')
      ]);

      // Filter out the current request being cancelled
      const requesterPendingCount = requesterOtherRequests.filter(r => r.id !== requestId && r.status === 'pending').length;
      const targetPendingCount = targetOtherRequests.filter(r => r.id !== requestId && r.status === 'pending').length;

      // Update request status
      await PartnershipRequestService.updateStatus(requestId, 'cancelled');

      const updates: Promise<void>[] = [];
      
      if (requesterPendingCount === 0) {
        updates.push(
          studentRepository.update(requesterId, {
            partnershipStatus: 'none'
          })
        );
      }

      if (targetPendingCount === 0) {
        updates.push(
          studentRepository.update(request.targetStudentId, {
            partnershipStatus: 'none'
          })
        );
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      return ServiceResults.success(undefined, 'Partnership request cancelled');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelRequest', error, { requestId, requesterId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cancel partnership request'
      );
    }
  },

  /**
   * Validate that student has correct partnership status for operation
   * Only blocks if student is already paired - allows multiple pending requests
   */
  _validatePartnershipStatus(
    studentData: FirebaseFirestore.DocumentData | undefined, 
    role: 'requester' | 'target'
  ): void {
    const status = studentData?.partnershipStatus;
    
    // Only block if already paired - allow multiple pending requests
    if (status === 'paired') {
      if (role === 'requester') {
        throw new Error('You are already paired with another student');
      } else {
        throw new Error('Target student is already paired');
      }
    }
    
    // All other statuses (none, pending_sent, pending_received) are allowed
    // Pending request state is now tracked in partnership_requests collection
  },

  /**
   * Handle accepting a partnership request
   */
  async _acceptRequest(
    request: StudentPartnershipRequest,
    requestId: string,
    targetStudentId: string
  ): Promise<ServiceResult> {
    // Use transaction to prevent race conditions
    try {
      await adminDb.runTransaction(async (transaction: Transaction) => {
        const requesterRef = studentRepository.getDocumentRef(request.requesterId);
        const targetRef = studentRepository.getDocumentRef(targetStudentId);
        const requestRef = partnershipRequestRepository.getDocumentRef(requestId);

        const [requesterSnap, targetSnap] = await transaction.getAll(requesterRef, targetRef);

        if (!requesterSnap.exists || !targetSnap.exists) {
          throw new Error('One or both students not found');
        }

        const requesterData = requesterSnap.data();
        const targetData = targetSnap.data();

        if (requesterData?.partnershipStatus === 'paired') {
          throw new Error('Requester is already paired with another student');
        }

        if (targetData?.partnershipStatus === 'paired') {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept partnership request';
      return ServiceResults.error(errorMessage);
    }

    // Cancel all other pending requests for both students (cleanup outside transaction)
    await PartnershipPairingService.cancelAllPendingRequests(request.requesterId);
    await PartnershipPairingService.cancelAllPendingRequests(targetStudentId);

    return ServiceResults.success(undefined, 'Partnership accepted successfully');
  },

  /**
   * Handle rejecting a partnership request
   */
  async _rejectRequest(
    request: StudentPartnershipRequest,
    requestId: string,
    targetStudentId: string
  ): Promise<ServiceResult> {
    // Check for other pending requests BEFORE updating status to avoid race conditions
    const [requesterOtherRequests, targetOtherRequests] = await Promise.all([
      PartnershipRequestService.getByStudent(request.requesterId, 'all'),
      PartnershipRequestService.getByStudent(targetStudentId, 'all')
    ]);

    // Filter out the current request being rejected
    const requesterPendingCount = requesterOtherRequests.filter(r => r.id !== requestId && r.status === 'pending').length;
    const targetPendingCount = targetOtherRequests.filter(r => r.id !== requestId && r.status === 'pending').length;

    // Use transaction to ensure atomic rejection
    try {
      await adminDb.runTransaction(async (transaction: Transaction) => {
        const requestRef = partnershipRequestRepository.getDocumentRef(requestId);

        transaction.update(requestRef, {
          status: 'rejected',
          respondedAt: new Date()
        });
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject partnership request';
      return ServiceResults.error(errorMessage);
    }

    const updates: Promise<void>[] = [];
    
    if (requesterPendingCount === 0) {
      updates.push(
        studentRepository.update(request.requesterId, {
          partnershipStatus: 'none'
        })
      );
    }

    if (targetPendingCount === 0) {
      updates.push(
        studentRepository.update(targetStudentId, {
          partnershipStatus: 'none'
        })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return ServiceResults.success(undefined, 'Partnership request rejected');
  },
};

