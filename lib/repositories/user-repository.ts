// lib/repositories/user-repository.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)

import { BaseRepository } from './base-repository';
import { toUser } from '@/lib/services/shared/firestore-converters';
import type { BaseUser } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class UserRepository extends BaseRepository<BaseUser> {
  protected collectionName = 'users';
  protected repositoryName = 'UserRepository';
  
  protected toEntity(id: string, data: DocumentData): BaseUser {
    return toUser(id, data);
  }
}

// Export singleton instance
export const userRepository = new UserRepository();

