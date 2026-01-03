// lib/repositories/admin-repository.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)

import { BaseRepository } from './base-repository';
import { toAdmin } from '@/lib/services/shared/firestore-converters';
import type { Admin } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class AdminRepository extends BaseRepository<Admin> {
  protected collectionName = 'admins';
  protected repositoryName = 'AdminRepository';
  
  protected toEntity(id: string, data: DocumentData): Admin {
    return toAdmin(id, data);
  }
}

// Export singleton instance
export const adminRepository = new AdminRepository();

