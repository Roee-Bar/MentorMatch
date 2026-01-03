// lib/repositories/supervisor-repository.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)

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

  // Custom query methods
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

// Export singleton instance
export const supervisorRepository = new SupervisorRepository();

