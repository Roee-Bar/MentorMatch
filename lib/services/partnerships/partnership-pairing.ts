// lib/services/partnerships/partnership-pairing.ts
// SERVER-ONLY: Student pairing and unpairing operations

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { studentService } from '@/lib/services/students/student-service';
import { studentRepository } from '@/lib/repositories/student-repository';
import { partnershipRequestRepository } from '@/lib/repositories/partnership-request-repository';
import { applicationRepository } from '@/lib/repositories/application-repository';
import { ServiceResults } from '@/lib/services/shared/types';
import { executeBatchUpdates } from './utils/batch-utils';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student } from '@/types/database';

const SERVICE_NAME = 'PartnershipPairingService';

// ============================================
// STUDENT PAIRING OPERATIONS
// ============================================
export const PartnershipPairingService = {
  /**
   * Get available students for partnership (not paired, excluding current user)
   * Note: This method is less comprehensive than studentService.getAvailablePartners
   * which also filters out students with existing pending requests
   */
  async getAvailableStudents(currentUserId: string): Promise<Student[]> {
    try {
      // Get all students and filter in memory (Firestore doesn't support != operator efficiently)
      const allStudents = await studentRepository.findAll();
      
      return allStudents.filter(
        student => student.id !== currentUserId && student.partnershipStatus !== 'paired'
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAvailableStudents', error, { currentUserId });
      return [];
    }
  },

  /**
   * Get partner details by ID
   */
  async getPartnerDetails(partnerId: string): Promise<Student | null> {
    try {
      const partner = await studentService.getStudentById(partnerId);
      if (!partner) {
        logger.service.warn(SERVICE_NAME, 'getPartnerDetails', 'Partner not found - possible orphaned reference', { partnerId });
      }
      return partner;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnerDetails', error, { partnerId });
      return null;
    }
  },

  /**
   * Pair two students together (used after accepting request)
   */
  async pairStudents(
    studentId1: string, 
    studentId2: string
  ): Promise<ServiceResult> {
    try {
      await adminDb.runTransaction(async (transaction) => {
        const student1Ref = studentRepository.getDocumentRef(studentId1);
        const student2Ref = studentRepository.getDocumentRef(studentId2);

        transaction.update(student1Ref, {
          partnerId: studentId2,
          partnershipStatus: 'paired',
          updatedAt: new Date()
        });

        transaction.update(student2Ref, {
          partnerId: studentId1,
          partnershipStatus: 'paired',
          updatedAt: new Date()
        });
      });

      return ServiceResults.success(undefined, 'Students paired successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'pairStudents', error, { studentId1, studentId2 });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to pair students'
      );
    }
  },

  /**
   * Unpair two students
   */
  async unpairStudents(studentId1: string, studentId2: string): Promise<ServiceResult> {
    try {
      await adminDb.runTransaction(async (transaction) => {
        const student1Ref = studentRepository.getDocumentRef(studentId1);
        const student2Ref = studentRepository.getDocumentRef(studentId2);

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

  /**
   * Cancel all pending requests for a student (cleanup after pairing)
   */
  async cancelAllPendingRequests(studentId: string): Promise<ServiceResult> {
    try {
      // Get all pending requests where student is requester or target
      const [requestsAsRequester, requestsAsTarget] = await Promise.all([
        partnershipRequestRepository.findAll([
          { field: 'requesterId', operator: '==', value: studentId },
          { field: 'status', operator: '==', value: 'pending' }
        ]),
        partnershipRequestRepository.findAll([
          { field: 'targetStudentId', operator: '==', value: studentId },
          { field: 'status', operator: '==', value: 'pending' }
        ])
      ]);

      const allRefs = [
        ...requestsAsRequester.map(req => partnershipRequestRepository.getDocumentRef(req.id)),
        ...requestsAsTarget.map(req => partnershipRequestRepository.getDocumentRef(req.id))
      ];
      
      const result = await executeBatchUpdates(
        allRefs,
        { status: 'cancelled', respondedAt: new Date() },
        'cancelAllPendingRequests'
      );

      return ServiceResults.success(undefined, `Cancelled ${result.totalUpdated} pending request(s)`);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelAllPendingRequests', error, { studentId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cancel pending requests'
      );
    }
  },

  /**
   * Update applications after unpair - removes partner info from applications
   */
  async updateApplicationsAfterUnpair(studentId1: string, studentId2: string): Promise<void> {
    try {
      // Get applications for both students - need to query separately since Firestore 'in' has limit of 10
      const [apps1, apps2] = await Promise.all([
        applicationRepository.findAll([
          { field: 'studentId', operator: '==', value: studentId1 }
        ]),
        applicationRepository.findAll([
          { field: 'studentId', operator: '==', value: studentId2 }
        ])
      ]);

      // Filter to only pending/approved applications
      const applicationsToUpdate = [...apps1, ...apps2].filter(
        app => app.status === 'pending' || app.status === 'approved'
      );

      if (applicationsToUpdate.length === 0) {
        return; // No applications to update
      }

      const refs = applicationsToUpdate.map(app => applicationRepository.getDocumentRef(app.id));

      await executeBatchUpdates(
        refs,
        {
          hasPartner: false,
          partnerName: null,
          partnerEmail: null,
          lastUpdated: new Date()
        },
        'updateApplicationsAfterUnpair'
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateApplicationsAfterUnpair', error, { studentId1, studentId2 });
      // Don't throw - unpair succeeded, this is cleanup
    }
  },

  /**
   * Update applications with partner info (after pairing)
   */
  async updateApplicationsPartnerInfo(
    studentId: string,
    hasPartner: boolean,
    partnerName: string | null,
    partnerEmail: string | null
  ): Promise<ServiceResult<number>> {
    try {
      const applications = await applicationRepository.findByStudentId(studentId);

      // Filter to only pending/approved applications
      const applicationsToUpdate = applications.filter(
        app => app.status === 'pending' || app.status === 'approved'
      );

      if (applicationsToUpdate.length === 0) {
        return ServiceResults.success(0, 'No applications to update');
      }

      const refs = applicationsToUpdate.map(app => applicationRepository.getDocumentRef(app.id));

      const result = await executeBatchUpdates(
        refs,
        {
          hasPartner,
          partnerName,
          partnerEmail,
          lastUpdated: new Date()
        },
        'updateApplicationsPartnerInfo'
      );

      return ServiceResults.success(result.totalUpdated, `Updated ${result.totalUpdated} application(s)`);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateApplicationsPartnerInfo', error, { studentId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update applications partner info'
      );
    }
  },
};

