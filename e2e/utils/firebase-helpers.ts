/**
 * Firebase Emulator Helpers
 * 
 * Utilities for interacting with Firebase Emulator during tests.
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Wait for Firebase Emulator to be ready
 */
export async function waitForEmulatorReady(): Promise<void> {
  // Simple health check - try to access Firestore
  let retries = 10;
  while (retries > 0) {
    try {
      await adminDb.collection('_health').limit(1).get();
      return;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Clear all data from Firestore collections
 */
export async function clearFirestoreData(): Promise<void> {
  const collections = [
    'users',
    'students',
    'supervisors',
    'admins',
    'applications',
    'projects',
    'partnership_requests',
    'supervisor-partnership-requests',
  ];

  for (const collection of collections) {
    try {
      const snapshot = await adminDb.collection(collection).get();
      if (snapshot.empty) continue;

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.warn(`Failed to clear collection ${collection}:`, error);
    }
  }
}

/**
 * Clear all auth users
 */
export async function clearAuthUsers(): Promise<void> {
  try {
    const listUsersResult = await adminAuth.listUsers();
    const deletePromises = listUsersResult.users.map((user) =>
      adminAuth.deleteUser(user.uid).catch((error) => {
        console.warn(`Failed to delete user ${user.uid}:`, error);
      })
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Failed to clear auth users:', error);
  }
}

/**
 * Reset emulator state (clear all data)
 */
export async function resetEmulatorState(): Promise<void> {
  await Promise.all([
    clearFirestoreData(),
    clearAuthUsers(),
  ]);
}

/**
 * Get collection count
 */
export async function getCollectionCount(collectionName: string): Promise<number> {
  try {
    const snapshot = await adminDb.collection(collectionName).get();
    return snapshot.size;
  } catch (error) {
    console.warn(`Failed to get count for ${collectionName}:`, error);
    return 0;
  }
}

