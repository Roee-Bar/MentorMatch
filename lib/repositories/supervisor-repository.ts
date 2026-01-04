// lib/repositories/supervisor-repository.ts

import { BaseRepository } from './base-repository';
import { toSupervisor } from '@/lib/services/shared/firestore-converters';
import type { Supervisor } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class SupervisorRepository extends BaseRepository<Supervisor> {
  protected collectionName = 'supervisors';
  protected repositoryName = 'SupervisorRepository';
  
  protected toEntity(id: string, data: DocumentData): Supervisor {
    return toSupervisor(id, data);
  }

  async findActive(): Promise<Supervisor[]> {
    return this.findAll([
      { field: 'isActive', operator: '==', value: true }
    ]);
  }

  async findAvailable(): Promise<Supervisor[]> {
    return this.findAll([
      { field: 'isActive', operator: '==', value: true },
      { field: 'availabilityStatus', operator: '==', value: 'available' }
    ]);
  }

  async findByDepartment(department: string): Promise<Supervisor[]> {
    return this.findAll([
      { field: 'department', operator: '==', value: department },
      { field: 'isActive', operator: '==', value: true }
    ]);
  }
}

export const supervisorRepository = new SupervisorRepository();

