// lib/services/students/student-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Student management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { toStudent } from '@/lib/services/shared/firestore-converters';
import { PartnershipRequestService } from '@/lib/services/partnerships/partnership-request-service';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Student, StudentFilterParams } from '@/types/database';

// ============================================
// STUDENT SERVICE CLASS
// ============================================
class StudentServiceClass extends BaseService<Student> {
  protected collectionName = 'students';
  protected serviceName = 'StudentService';
  
  protected toEntity(id: string, data: any): Student {
    return toStudent(id, data);
  }

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

  async getFilteredAvailablePartners(excludeStudentId: string, filters: StudentFilterParams): Promise<ServiceResult<Student[]>> {
    try {
      // Get base available partners
      let students = await this.getAvailablePartners(excludeStudentId);

      // Normalize filter values
      const search = filters.search?.toLowerCase().trim();
      const department = filters.department;
      const skills = filters.skills?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const interests = filters.interests?.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);

      // Filter by search term (name, skills, interests)
      if (search) {
        students = students.filter(student => {
          const nameMatch = student.fullName.toLowerCase().includes(search);
          const skillsMatch = student.skills?.toLowerCase().includes(search) ?? false;
          const interestsMatch = student.interests?.toLowerCase().includes(search) ?? false;
          return nameMatch || skillsMatch || interestsMatch;
        });
      }

      // Filter by department
      if (department && department !== 'all') {
        students = students.filter(student => 
          student.department.toLowerCase() === department.toLowerCase()
        );
      }

      // Filter by skills (any match)
      if (skills && skills.length > 0) {
        students = students.filter(student => {
          if (!student.skills) return false;
          const studentSkills = student.skills.split(',').map(s => s.trim().toLowerCase());
          return skills.some(filterSkill => 
            studentSkills.some(skill => skill.includes(filterSkill))
          );
        });
      }

      // Filter by interests (any match)
      if (interests && interests.length > 0) {
        students = students.filter(student => {
          if (!student.interests) return false;
          const studentInterests = student.interests.split(',').map(i => i.trim().toLowerCase());
          return interests.some(filterInterest => 
            studentInterests.some(interest => interest.includes(filterInterest))
          );
        });
      }

      return ServiceResults.success(students);
    } catch (error) {
      logger.service.error(this.serviceName, 'getFilteredAvailablePartners', error, { excludeStudentId, filters });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to fetch students'
      );
    }
  }

  async updateStudent(studentId: string, data: Partial<Student>): Promise<ServiceResult> {
    return this.update(studentId, data);
  }
}

// Create singleton instance and export
export const studentService = new StudentServiceClass();
