// lib/services/students/student-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Student management services

import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { studentRepository } from '@/lib/repositories/student-repository';
import { PartnershipRequestService } from '@/lib/services/partnerships/partnership-request-service';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student } from '@/types/database';

// ============================================
// STUDENT SERVICE CLASS
// ============================================
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

  async getAvailablePartners(excludeStudentId: string): Promise<Student[]> {
    try {
      // Get all students and filter in memory (Firestore doesn't support != operator efficiently)
      const allStudents = await this.repository.findAll();
      
      // Filter out the current user and students who are already paired
      const unpairedStudents = allStudents.filter(
        student => student.id !== excludeStudentId && student.partnershipStatus !== 'paired'
      );
      
      // Check for existing requests in parallel for all students
      const existingChecks = await Promise.all(
        unpairedStudents.map(student => 
          PartnershipRequestService.checkExistingRequest(excludeStudentId, student.id)
        )
      );
      
      // Filter out students who already have a pending request with the current user
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

// Create singleton instance and export
export const studentService = new StudentServiceClass();
