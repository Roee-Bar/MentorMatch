// lib/services/users/user-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// User management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toUser } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { BaseUser } from '@/types/database';

const SERVICE_NAME = 'UserService';

// ============================================
// USER SERVICES
// ============================================
export const UserService = {
  // Get current user's full profile (from users collection)
  async getUserById(userId: string): Promise<BaseUser | null> {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return toUser(userDoc.id, userDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getUserById', error, { userId });
      return null;
    }
  },

  // Get all users
  async getAllUsers(): Promise<BaseUser[]> {
    try {
      const querySnapshot = await adminDb.collection('users').get();
      return querySnapshot.docs.map((doc) => toUser(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAllUsers', error);
      return [];
    }
  },

  // Update user
  async updateUser(userId: string, data: Partial<BaseUser>): Promise<ServiceResult> {
    try {
      await adminDb.collection('users').doc(userId).update({
        ...data,
        updatedAt: new Date(),
      });
      return ServiceResults.success(undefined, 'User updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateUser', error, { userId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    }
  },
};
