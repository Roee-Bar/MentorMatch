// lib/services/users/user-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// User management services

import { adminDb } from '@/lib/firebase-admin';
import type { BaseUser } from '@/types/database';

// ============================================
// USER SERVICES
// ============================================
export const UserService = {
  // Get current user's full profile (from users collection)
  async getUserById(userId: string): Promise<BaseUser | null> {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (!data) {
          return null;
        }
        return { id: userDoc.id, ...data } as BaseUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Get all users
  async getAllUsers(): Promise<BaseUser[]> {
    try {
      const querySnapshot = await adminDb.collection('users').get();
      return querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (!data) return null;
          return { id: doc.id, ...data } as BaseUser;
        })
        .filter((user): user is BaseUser => user !== null);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Update user
  async updateUser(userId: string, data: Partial<BaseUser>): Promise<boolean> {
    try {
      await adminDb.collection('users').doc(userId).update({
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  },
};

