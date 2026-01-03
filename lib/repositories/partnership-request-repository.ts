// lib/repositories/partnership-request-repository.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)

import { BaseRepository } from './base-repository';
import { toPartnershipRequest } from '@/lib/services/shared/firestore-converters';
import type { StudentPartnershipRequest } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class PartnershipRequestRepository extends BaseRepository<StudentPartnershipRequest> {
  protected collectionName = 'partnership_requests';
  protected repositoryName = 'PartnershipRequestRepository';
  
  protected toEntity(id: string, data: DocumentData): StudentPartnershipRequest {
    return toPartnershipRequest(id, data);
  }

  // Custom query methods
  async findByRequesterId(requesterId: string): Promise<StudentPartnershipRequest[]> {
    return this.findAll([
      { field: 'requesterId', operator: '==', value: requesterId }
    ]);
  }

  async findByTargetId(targetStudentId: string): Promise<StudentPartnershipRequest[]> {
    return this.findAll([
      { field: 'targetStudentId', operator: '==', value: targetStudentId }
    ]);
  }

  async findPending(): Promise<StudentPartnershipRequest[]> {
    return this.findAll([
      { field: 'status', operator: '==', value: 'pending' }
    ]);
  }
}

// Export singleton instance
export const partnershipRequestRepository = new PartnershipRequestRepository();

