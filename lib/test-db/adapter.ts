/**
 * Firebase-Compatible Adapter
 * 
 * Makes in-memory test database work like Firebase Admin SDK.
 * Provides the same API so existing code works without changes.
 */

import { testFirestore } from './firestore-store';
import { testAuthStore, type AuthUser } from './auth-store';

/**
 * Test Auth - mimics Firebase Admin Auth
 */
export class TestAuth {
  async createUser(data: {
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
    uid?: string;
  }): Promise<{ uid: string; email: string; displayName?: string; emailVerified: boolean }> {
    const user = testAuthStore.createUser(data);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }

  async getUser(uid: string): Promise<{ uid: string; email: string; displayName?: string; emailVerified: boolean }> {
    const user = testAuthStore.getUser(uid);
    if (!user) {
      throw new Error(`User ${uid} not found`);
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }

  async getUserByEmail(email: string): Promise<{ uid: string; email: string; displayName?: string; emailVerified: boolean }> {
    const user = testAuthStore.getUserByEmail(email);
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }

  async deleteUser(uid: string): Promise<void> {
    testAuthStore.deleteUser(uid);
  }

  async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    return testAuthStore.createCustomToken(uid, claims);
  }

  async verifyIdToken(token: string): Promise<{ uid: string; email: string; [key: string]: any }> {
    const authToken = testAuthStore.verifyToken(token);
    if (!authToken) {
      const error: any = new Error('Invalid token');
      error.code = 'auth/argument-error';
      throw error;
    }
    return {
      uid: authToken.uid,
      email: authToken.email,
      ...authToken.claims,
    };
  }

  async setCustomUserClaims(uid: string, claims: Record<string, any>): Promise<void> {
    testAuthStore.setCustomClaims(uid, claims);
  }

  listUsers(): Promise<{ users: Array<{ uid: string; email: string }> }> {
    const users = testAuthStore.listUsers();
    return Promise.resolve({
      users: users.map(u => ({ uid: u.uid, email: u.email })),
    });
  }
}

/**
 * Test Firestore - mimics Firebase Admin Firestore
 */
export class TestFirestore {
  collection(collectionName: string) {
    return testFirestore.collection(collectionName);
  }

  batch() {
    return testFirestore.batch();
  }

  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    return testFirestore.runTransaction(updateFunction);
  }

  clearAll(): void {
    testFirestore.clearAll();
  }
}

// Export instances that match Firebase Admin SDK exports
export const testAuth = new TestAuth();
export const testDb = new TestFirestore();

