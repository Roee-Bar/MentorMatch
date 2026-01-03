// lib/services/users/user-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// User management services

import { BaseService } from '@/lib/services/shared/base-service';
import { toUser } from '@/lib/services/shared/firestore-converters';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { BaseUser } from '@/types/database';

// ============================================
// USER SERVICE CLASS
// ============================================
class UserServiceClass extends BaseService<BaseUser> {
  protected collectionName = 'users';
  protected serviceName = 'UserService';
  
  protected toEntity(id: string, data: any): BaseUser {
    return toUser(id, data);
  }

  // Public methods that wrap protected base methods
  async getUserById(userId: string): Promise<BaseUser | null> {
    return this.getById(userId);
  }

  async getAllUsers(): Promise<BaseUser[]> {
    return this.getAll();
  }

  async updateUser(userId: string, data: Partial<BaseUser>): Promise<ServiceResult> {
    return this.update(userId, data);
  }
}

// Create singleton instance and export
export const userService = new UserServiceClass();
