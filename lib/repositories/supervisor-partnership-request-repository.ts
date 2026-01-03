// lib/repositories/supervisor-partnership-request-repository.ts

import { BaseRepository } from './base-repository';
import { toSupervisorPartnershipRequest } from '@/lib/services/shared/firestore-converters';
import type { SupervisorPartnershipRequest } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class SupervisorPartnershipRequestRepository extends BaseRepository<SupervisorPartnershipRequest> {
  protected collectionName = 'supervisor-partnership-requests';
  protected repositoryName = 'SupervisorPartnershipRequestRepository';
  
  protected toEntity(id: string, data: DocumentData): SupervisorPartnershipRequest {
    return toSupervisorPartnershipRequest(id, data);
  }

  async findByRequestingSupervisorId(requestingSupervisorId: string): Promise<SupervisorPartnershipRequest[]> {
    return this.findAll([
      { field: 'requestingSupervisorId', operator: '==', value: requestingSupervisorId }
    ]);
  }

  async findByTargetSupervisorId(targetSupervisorId: string): Promise<SupervisorPartnershipRequest[]> {
    return this.findAll([
      { field: 'targetSupervisorId', operator: '==', value: targetSupervisorId }
    ]);
  }

  async findPending(): Promise<SupervisorPartnershipRequest[]> {
    return this.findAll([
      { field: 'status', operator: '==', value: 'pending' }
    ]);
  }
}

export const supervisorPartnershipRequestRepository = new SupervisorPartnershipRequestRepository();

