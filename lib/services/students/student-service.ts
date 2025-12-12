// lib/services/students/student-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Student management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toStudent } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student } from '@/types/database';

const SERVICE_NAME = 'StudentService';

// ============================================
// STUDENT SERVICES
// ============================================
export const StudentService = {
  // Get student by ID
  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const studentDoc = await adminDb.collection('students').doc(studentId).get();
      if (studentDoc.exists) {
        return toStudent(studentDoc.id, studentDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getStudentById', error, { studentId });
      return null;
    }
  },

  // Get all students
  async getAllStudents(): Promise<Student[]> {
    try {
      const querySnapshot = await adminDb.collection('students').get();
      return querySnapshot.docs.map((doc) => toStudent(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAllStudents', error);
      return [];
    }
  },

  // Get unmatched students
  async getUnmatchedStudents(): Promise<Student[]> {
    try {
      const querySnapshot = await adminDb.collection('students')
        .where('matchStatus', '==', 'unmatched')
        .get();
      return querySnapshot.docs.map((doc) => toStudent(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getUnmatchedStudents', error);
      return [];
    }
  },

  // Get available partners (students without partners, excluding current user)
  async getAvailablePartners(excludeStudentId: string): Promise<Student[]> {
    try {
      // Query for students without a partner
      const querySnapshot = await adminDb.collection('students')
        .where('partnerId', '==', null)
        .get();
      
      // Filter out the current user and return
      return querySnapshot.docs
        .filter(doc => doc.id !== excludeStudentId)
        .map((doc) => toStudent(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAvailablePartners', error, { excludeStudentId });
      return [];
    }
  },

  // Update student
  async updateStudent(studentId: string, data: Partial<Student>): Promise<ServiceResult> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );
      
      await adminDb.collection('students').doc(studentId).update({
        ...cleanData,
        updatedAt: new Date(),
      });
      return ServiceResults.success(undefined, 'Student updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateStudent', error, { studentId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update student'
      );
    }
  },
};
