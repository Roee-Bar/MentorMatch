// lib/services/students/student-service.ts

import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { studentRepository } from '@/lib/repositories/student-repository';
import { PartnershipRequestService } from '@/lib/services/partnerships/partnership-request-service';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student } from '@/types/database';

class StudentServiceClass extends BaseService<Student> {
  protected serviceName = 'StudentService';
  protected repository = studentRepository;

  async getStudentById(studentId: string): Promise<Student | null> {
    return this.getById(studentId);
  }

  async getAllStudents(): Promise<Student[]> {
    return this.getAll();
  }

  async getUnmatchedStudents(): Promise<Student[]> {
    return this.query([
      { field: 'matchStatus', operator: '==', value: 'unmatched' }
    ]);
  }

  /**
   * Get available partners for a student
   * 
   * Performance Note: This method loads all students into memory and filters client-side.
   * For large datasets, consider adding pagination support using Firestore limit() and startAfter().
   * This would require API changes to support pagination parameters (page, limit, cursor).
   * 
   * @param excludeStudentId - Student ID to exclude from results
   * @returns Array of available student partners
   */
  async getAvailablePartners(excludeStudentId: string): Promise<Student[]> {
    try {
      // Get all students and filter in memory (Firestore doesn't support != operator efficiently)
      // TODO: Add pagination support for better performance with large datasets
      const allStudents = await this.repository.findAll();
      
      const unpairedStudents = allStudents.filter(
        student => student.id !== excludeStudentId && student.partnershipStatus !== 'paired'
      );
      
      const existingChecks = await Promise.all(
        unpairedStudents.map(student => 
          PartnershipRequestService.checkExistingRequest(excludeStudentId, student.id)
        )
      );
      
      const availableStudents = unpairedStudents.filter((student, index) => 
        !existingChecks[index].exists
      );
      
      return availableStudents;
    } catch (error) {
      logger.service.error(this.serviceName, 'getAvailablePartners', error, { excludeStudentId });
      return [];
    }
  }

  async updateStudent(studentId: string, data: Partial<Student>): Promise<ServiceResult> {
    return this.update(studentId, data);
  }
}

export const studentService = new StudentServiceClass();
