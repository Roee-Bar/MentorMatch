// lib/services/partnerships/partnership-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Student partnership management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { StudentService } from '@/lib/services/students/student-service';
import { toStudent, toPartnershipRequest } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student, StudentPartnershipRequest } from '@/types/database';
import type { DocumentReference } from 'firebase-admin/firestore';

const SERVICE_NAME = 'StudentPartnershipService';

// ============================================
// STUDENT PARTNERSHIP SERVICES
// ============================================
export const StudentPartnershipService = {
  // Get available students (not paired, excluding current user)
  async getAvailableStudents(currentUserId: string): Promise<Student[]> {
    try {
      const studentsRef = adminDb.collection('students');
      const snapshot = await studentsRef
        .where('partnershipStatus', '==', 'none')
        .get();
      
      return snapshot.docs
        .filter(doc => doc.id !== currentUserId)
        .map(doc => toStudent(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAvailableStudents', error, { currentUserId });
      return [];
    }
  },

  // Create partnership request
  async createPartnershipRequest(
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

      // Check for duplicate request (same direction)
      const existingRequest = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', requesterId)
        .where('targetStudentId', '==', targetStudentId)
        .where('status', '==', 'pending')
        .get();

      if (!existingRequest.empty) {
        return ServiceResults.error('You already have a pending request with this student');
      }

      // Check for reverse duplicate (target → requester)
      const reverseRequest = await adminDb.collection('partnership_requests')
        .where('requesterId', '==', targetStudentId)
        .where('targetStudentId', '==', requesterId)
        .where('status', '==', 'pending')
        .get();

      if (!reverseRequest.empty) {
        return ServiceResults.error('This student has already sent you a request. Check your incoming requests.');
      }

      // Use transaction to atomically check and update student statuses
      let requestId: string = '';
      
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

        // Verify both students have 'none' status
        if (requesterData?.partnershipStatus !== 'none') {
          if (requesterData?.partnershipStatus === 'paired') {
            throw new Error('You are already paired with another student');
          } else if (requesterData?.partnershipStatus === 'pending_sent') {
            throw new Error('You already have a pending outgoing request. Cancel it before sending another.');
          } else {
            throw new Error('You cannot send a request at this time');
          }
        }

        if (targetData?.partnershipStatus !== 'none') {
          if (targetData?.partnershipStatus === 'paired') {
            throw new Error('Target student is already paired');
          } else {
            throw new Error('Target student cannot receive requests at this time');
          }
        }

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

        // Update both students' partnership status
        transaction.update(requesterRef, {
          partnershipStatus: 'pending_sent',
          updatedAt: new Date()
        });

        transaction.update(targetRef, {
          partnershipStatus: 'pending_received',
          updatedAt: new Date()
        });
      });

      return ServiceResults.success(requestId, 'Partnership request created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createPartnershipRequest', error, { requesterId, targetStudentId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create partnership request'
      );
    }
  },

  // Get partnership requests for a student
  async getPartnershipRequests(
    studentId: string, 
    type: 'incoming' | 'outgoing' | 'all'
  ): Promise<StudentPartnershipRequest[]> {
    try {
      let query = adminDb.collection('partnership_requests')
        .where('status', '==', 'pending');

      if (type === 'incoming') {
        query = query.where('targetStudentId', '==', studentId);
      } else if (type === 'outgoing') {
        query = query.where('requesterId', '==', studentId);
      }
      // For 'all', we need to do two queries and merge
      
      const snapshot = await query.get();
      const requests = snapshot.docs.map(doc => toPartnershipRequest(doc.id, doc.data()));

      // If type is 'all', also fetch the other direction
      if (type === 'all') {
        const otherQuery = adminDb.collection('partnership_requests')
          .where('status', '==', 'pending')
          .where('requesterId', '==', studentId);
        
        const otherSnapshot = await otherQuery.get();
        const otherRequests = otherSnapshot.docs.map(doc => toPartnershipRequest(doc.id, doc.data()));

        return [...requests, ...otherRequests];
      }

      return requests;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnershipRequests', error, { studentId, type });
      return [];
    }
  },

  // Get specific partnership request
  async getPartnershipRequest(requestId: string): Promise<StudentPartnershipRequest | null> {
    try {
      const requestDoc = await adminDb.collection('partnership_requests').doc(requestId).get();
      if (requestDoc.exists) {
        return toPartnershipRequest(requestDoc.id, requestDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnershipRequest', error, { requestId });
      return null;
    }
  },

  // Respond to partnership request (accept/reject)
  async respondToPartnershipRequest(
    requestId: string,
    targetStudentId: string,
    action: 'accept' | 'reject'
  ): Promise<ServiceResult> {
    try {
      // Get request
      const request = await this.getPartnershipRequest(requestId);
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      // Verify target student
      if (request.targetStudentId !== targetStudentId) {
        return ServiceResults.error('Unauthorized to respond to this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Request already processed');
      }

      if (action === 'accept') {
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

          // Verify requester has correct status
          if (requesterData?.partnershipStatus !== 'pending_sent') {
            throw new Error('Requester is no longer in pending state');
          }

          // Verify target has correct status
          if (targetData?.partnershipStatus !== 'pending_received') {
            throw new Error('You are no longer in pending state');
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
        await this.cancelAllPendingRequests(request.requesterId);
        await this.cancelAllPendingRequests(targetStudentId);

        return ServiceResults.success(undefined, 'Partnership accepted successfully');

      } else if (action === 'reject') {
        // Use transaction to ensure atomic rejection
        await adminDb.runTransaction(async (transaction) => {
          const requestRef = adminDb.collection('partnership_requests').doc(requestId);
          const requesterRef = adminDb.collection('students').doc(request.requesterId);
          const targetRef = adminDb.collection('students').doc(targetStudentId);

          // Update request status
          transaction.update(requestRef, {
            status: 'rejected',
            respondedAt: new Date()
          });

          // Reset both students' partnership status
          transaction.update(requesterRef, {
            partnershipStatus: 'none',
            updatedAt: new Date()
          });

          transaction.update(targetRef, {
            partnershipStatus: 'none',
            updatedAt: new Date()
          });
        });

        return ServiceResults.success(undefined, 'Partnership request rejected');
      }

      return ServiceResults.error('Invalid action');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'respondToPartnershipRequest', error, { requestId, targetStudentId, action });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to respond to partnership request'
      );
    }
  },

  // Cancel partnership request (by requester)
  async cancelPartnershipRequest(
    requestId: string,
    requesterId: string
  ): Promise<ServiceResult> {
    try {
      const request = await this.getPartnershipRequest(requestId);
      if (!request) {
        return ServiceResults.error('Partnership request not found');
      }

      // Verify requester owns the request
      if (request.requesterId !== requesterId) {
        return ServiceResults.error('Unauthorized to cancel this request');
      }

      if (request.status !== 'pending') {
        return ServiceResults.error('Can only cancel pending requests');
      }

      // Update request status
      await adminDb.collection('partnership_requests').doc(requestId).update({
        status: 'cancelled',
        respondedAt: new Date()
      });

      // Reset requester's partnership status to 'none'
      await adminDb.collection('students').doc(requesterId).update({
        partnershipStatus: 'none',
        updatedAt: new Date()
      });

      // Reset target's partnership status to 'none'
      await adminDb.collection('students').doc(request.targetStudentId).update({
        partnershipStatus: 'none',
        updatedAt: new Date()
      });

      return ServiceResults.success(undefined, 'Partnership request cancelled');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelPartnershipRequest', error, { requestId, requesterId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cancel partnership request'
      );
    }
  },

  // Cancel all pending requests for a student (used when accepting a partnership)
  async cancelAllPendingRequests(studentId: string): Promise<ServiceResult> {
    try {
      // Get all pending requests where student is requester or target
      const [requestsAsRequester, requestsAsTarget] = await Promise.all([
        adminDb.collection('partnership_requests')
          .where('requesterId', '==', studentId)
          .where('status', '==', 'pending')
          .get(),
        adminDb.collection('partnership_requests')
          .where('targetStudentId', '==', studentId)
          .where('status', '==', 'pending')
          .get()
      ]);

      const batch = adminDb.batch();

      // Cancel all requests as requester
      requestsAsRequester.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          respondedAt: new Date()
        });
      });

      // Cancel all requests as target
      requestsAsTarget.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          respondedAt: new Date()
        });
      });

      await batch.commit();
      
      const totalCancelled = requestsAsRequester.docs.length + requestsAsTarget.docs.length;
      return ServiceResults.success(undefined, `Cancelled ${totalCancelled} pending request(s)`);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelAllPendingRequests', error, { studentId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cancel pending requests'
      );
    }
  },

  // Unpair students
  async unpairStudents(studentId1: string, studentId2: string): Promise<ServiceResult> {
    try {
      // Use transaction to ensure atomic unpair operation
      await adminDb.runTransaction(async (transaction) => {
        const student1Ref = adminDb.collection('students').doc(studentId1);
        const student2Ref = adminDb.collection('students').doc(studentId2);

        // Read both student documents
        const [student1Snap, student2Snap] = await transaction.getAll(student1Ref, student2Ref);

        // Verify both students exist
        if (!student1Snap.exists || !student2Snap.exists) {
          throw new Error('One or both students not found');
        }

        const student1Data = student1Snap.data();
        const student2Data = student2Snap.data();

        // Verify they are currently paired with each other
        if (student1Data?.partnerId !== studentId2 || student2Data?.partnerId !== studentId1) {
          throw new Error('Students are not paired with each other');
        }

        if (student1Data?.partnershipStatus !== 'paired' || student2Data?.partnershipStatus !== 'paired') {
          throw new Error('Students are not in paired status');
        }

        // Reset both students' partnership fields
        transaction.update(student1Ref, {
          partnerId: null,
          partnershipStatus: 'none',
          updatedAt: new Date()
        });

        transaction.update(student2Ref, {
          partnerId: null,
          partnershipStatus: 'none',
          updatedAt: new Date()
        });
      });

      // Update applications after successful unpair
      await this.updateApplicationsAfterUnpair(studentId1, studentId2);

      return ServiceResults.success(undefined, 'Students unpaired successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'unpairStudents', error, { studentId1, studentId2 });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to unpair students'
      );
    }
  },

  // Helper method to update applications after unpair
  async updateApplicationsAfterUnpair(studentId1: string, studentId2: string): Promise<void> {
    try {
      // Query applications for both students in relevant statuses
      const applicationsSnapshot = await adminDb.collection('applications')
        .where('studentId', 'in', [studentId1, studentId2])
        .where('status', 'in', ['pending', 'approved'])
        .get();

      if (applicationsSnapshot.empty) {
        return; // No applications to update
      }

      // Split documents into batches of 500 to handle Firestore batch limit
      const batches: DocumentReference[][] = [];
      let currentBatch: DocumentReference[] = [];

      applicationsSnapshot.docs.forEach(doc => {
        if (currentBatch.length >= 500) {
          batches.push([...currentBatch]);
          currentBatch = [];
        }
        currentBatch.push(doc.ref);
      });
      if (currentBatch.length > 0) batches.push(currentBatch);

      // Execute all batches sequentially
      let totalUpdated = 0;
      for (const batchRefs of batches) {
        const batch = adminDb.batch();
        batchRefs.forEach(ref => {
          batch.update(ref, {
            hasPartner: false,
            partnerName: null,
            partnerEmail: null,
            lastUpdated: new Date()
          });
        });
        await batch.commit();
        totalUpdated += batchRefs.length;
      }

      logger.service.success(SERVICE_NAME, 'updateApplicationsAfterUnpair', { totalUpdated });
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateApplicationsAfterUnpair', error, { studentId1, studentId2 });
      // Don't throw - unpair succeeded, this is cleanup
    }
  },

  // Get current partner details
  async getPartnerDetails(partnerId: string): Promise<Student | null> {
    try {
      const partner = await StudentService.getStudentById(partnerId);
      if (!partner) {
        logger.service.warn(SERVICE_NAME, 'getPartnerDetails', 'Partner not found - possible orphaned reference', { partnerId });
      }
      return partner;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnerDetails', error, { partnerId });
      return null;
    }
  },

  // Helper method to update applications partner info
  async updateApplicationsPartnerInfo(
    studentId: string,
    hasPartner: boolean,
    partnerName: string | null,
    partnerEmail: string | null
  ): Promise<ServiceResult<number>> {
    try {
      // Query applications for the student in relevant statuses
      const applicationsSnapshot = await adminDb.collection('applications')
        .where('studentId', '==', studentId)
        .where('status', 'in', ['pending', 'approved'])
        .get();

      if (applicationsSnapshot.empty) {
        return ServiceResults.success(0, 'No applications to update');
      }

      // Split documents into batches of 500 to handle Firestore batch limit
      const batches: DocumentReference[][] = [];
      let currentBatch: DocumentReference[] = [];

      applicationsSnapshot.docs.forEach(doc => {
        if (currentBatch.length >= 500) {
          batches.push([...currentBatch]);
          currentBatch = [];
        }
        currentBatch.push(doc.ref);
      });
      if (currentBatch.length > 0) batches.push(currentBatch);

      // Execute all batches sequentially
      let totalUpdated = 0;
      for (const batchRefs of batches) {
        const batch = adminDb.batch();
        batchRefs.forEach(ref => {
          batch.update(ref, {
            hasPartner,
            partnerName,
            partnerEmail,
            lastUpdated: new Date()
          });
        });
        await batch.commit();
        totalUpdated += batchRefs.length;
      }

      return ServiceResults.success(totalUpdated, `Updated ${totalUpdated} application(s)`);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateApplicationsPartnerInfo', error, { studentId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update applications partner info'
      );
    }
  },
};
