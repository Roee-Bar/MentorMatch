// lib/repositories/capacity-change-repository.ts

import { BaseRepository } from './base-repository';
import type { CapacityChange } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class CapacityChangeRepository extends BaseRepository<CapacityChange> {
  protected collectionName = 'capacity_changes';
  protected repositoryName = 'CapacityChangeRepository';
  
  protected toEntity(id: string, data: DocumentData): CapacityChange {
    return {
      id,
      supervisorId: data.supervisorId,
      supervisorName: data.supervisorName,
      adminId: data.adminId,
      adminEmail: data.adminEmail,
      oldMaxCapacity: data.oldMaxCapacity,
      newMaxCapacity: data.newMaxCapacity,
      reason: data.reason,
      timestamp: data.timestamp?.toDate() || new Date(),
    };
  }

  async create(
    data: Omit<CapacityChange, 'id'>,
    timestampFields?: { createdAt?: string; updatedAt?: string }
  ): Promise<string> {
    return super.create(data as Omit<CapacityChange, 'id'>, {
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      ...timestampFields,
    });
  }
}

export const capacityChangeRepository = new CapacityChangeRepository();

