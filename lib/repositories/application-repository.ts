// lib/repositories/application-repository.ts

import { BaseRepository } from './base-repository';
import { toApplication } from '@/lib/services/shared/firestore-converters';
import type { Application } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class ApplicationRepository extends BaseRepository<Application> {
  protected collectionName = 'applications';
  protected repositoryName = 'ApplicationRepository';
  
  protected toEntity(id: string, data: DocumentData): Application {
    return toApplication(id, data);
  }

  async findByStudentId(studentId: string): Promise<Application[]> {
    return this.findAll([
      { field: 'studentId', operator: '==', value: studentId }
    ]);
  }

  async findByPartnerId(partnerId: string): Promise<Application[]> {
    return this.findAll([
      { field: 'partnerId', operator: '==', value: partnerId }
    ]);
  }

  async findPendingBySupervisorId(supervisorId: string): Promise<Application[]> {
    return this.findAll([
      { field: 'supervisorId', operator: '==', value: supervisorId },
      { field: 'status', operator: '==', value: 'pending' }
    ]);
  }

  async findBySupervisorId(supervisorId: string): Promise<Application[]> {
    return this.findAll([
      { field: 'supervisorId', operator: '==', value: supervisorId }
    ]);
  }

  async create(
    data: Omit<Application, 'id' | 'dateApplied' | 'lastUpdated'>,
    timestampFields?: { createdAt?: string; updatedAt?: string }
  ): Promise<string> {
    return super.create(data as Omit<Application, 'id'>, {
      createdAt: 'dateApplied',
      updatedAt: 'lastUpdated',
      ...timestampFields,
    });
  }

  async update(
    id: string,
    data: Partial<Application>,
    timestampField?: string
  ): Promise<void> {
    return super.update(id, data, 'lastUpdated');
  }
}

export const applicationRepository = new ApplicationRepository();

