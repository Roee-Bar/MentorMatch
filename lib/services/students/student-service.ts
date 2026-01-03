// lib/services/students/student-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Student management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { toStudent } from '@/lib/services/shared/firestore-converters';
import { PartnershipRequestService } from '@/lib/services/partnerships/partnership-request-service';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student } from '@/types/database';

// ============================================
// STUDENT SERVICE CLASS
// ============================================
class StudentServiceClass extends BaseService<Student> {
  protected collectionName = 'students';
  protected serviceName = 'StudentService';
  
  protected toEntity(id: string, data: any): Student {
    return toStudent(id, data);
  }

  /**
   * Get student by ID
   * 
   * @param studentId - Student ID
   * @returns Student or null if not found
   */
  async getStudentById(studentId: string): Promise<Student | null> {
    return this.getById(studentId);
  }

  /**
   * Get all students
   * 
   * @returns Array of all students
   */
  async getAllStudents(): Promise<Student[]> {
    return this.getAll();
  }

  /**
   * Get unmatched students
   * 
   * @returns Array of unmatched students
   */
  async getUnmatchedStudents(): Promise<Student[]> {
    return this.query([
      { field: 'matchStatus', operator: '==', value: 'unmatched' }
    ]);
  }

  /**
   * Get available partners (students without partners, excluding current user)
   * Filters out students who already have pending partnership requests
   * 
   * @param excludeStudentId - Student ID to exclude from results
   * @returns Array of available student partners
   */
  async getAvailablePartners(excludeStudentId: string): Promise<Student[]> {
    try {
      // Query for students who are not paired (allows multiple pending requests)
      const querySnapshot = await this.getCollection()
        .where('partnershipStatus', '!=', 'paired')
        .get();
      
      // Filter out the current user
      const students = querySnapshot.docs
        .filter(doc => doc.id !== excludeStudentId)
        .map(doc => this.toEntity(doc.id, doc.data()));
      
      // Check for existing requests in parallel for all students
      const existingChecks = await Promise.all(
        students.map(student => 
          PartnershipRequestService.checkExistingRequest(excludeStudentId, student.id)
        )
      );
      
      // Filter out students who already have a pending request with the current user
      const availableStudents = students.filter((student, index) => 
        !existingChecks[index].exists
      );
      
      return availableStudents;
    } catch (error) {
      logger.service.error(this.serviceName, 'getAvailablePartners', error, { excludeStudentId });
      return [];
    }
  }

  /**
   * Update student
   * 
   * @param studentId - Student ID
   * @param data - Partial student data to update
   * @returns ServiceResult indicating success or failure
   */
  async updateStudent(studentId: string, data: Partial<Student>): Promise<ServiceResult> {
    return this.update(studentId, data);
  }
}

// Create singleton instance and export
export const studentService = new StudentServiceClass();
