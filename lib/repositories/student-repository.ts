// lib/repositories/student-repository.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)

import { BaseRepository } from './base-repository';
import { toStudent } from '@/lib/services/shared/firestore-converters';
import type { Student } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class StudentRepository extends BaseRepository<Student> {
  protected collectionName = 'students';
  protected repositoryName = 'StudentRepository';
  
  protected toEntity(id: string, data: DocumentData): Student {
    return toStudent(id, data);
  }

  // Custom query methods
  async findByPartnerId(partnerId: string): Promise<Student[]> {
    return this.findAll([
      { field: 'partnerId', operator: '==', value: partnerId }
    ]);
  }

  async findUnmatched(): Promise<Student[]> {
    return this.findAll([
      { field: 'matchStatus', operator: '==', value: 'unmatched' }
    ]);
  }

  async findBySupervisorId(supervisorId: string): Promise<Student[]> {
    return this.findAll([
      { field: 'assignedSupervisorId', operator: '==', value: supervisorId }
    ]);
  }
}

// Export singleton instance
export const studentRepository = new StudentRepository();

