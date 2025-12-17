/**
 * Cleanup helpers for test data
 * Uses Firebase Admin SDK to clean up test data created during tests
 */

import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin for cleanup (if not already initialized)
 */
function getAdminDb() {
  if (!admin.apps.length) {
    // Initialize with minimal config for cleanup
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (projectId) {
      try {
        admin.initializeApp({
          projectId,
        });
      } catch (error) {
        // Already initialized
      }
    }
  }
  return admin.firestore();
}

/**
 * Clean up test data by prefix/marker
 * Test data should be marked with a test identifier prefix
 */
export async function cleanupTestData(testIdPrefix: string): Promise<void> {
  try {
    const db = getAdminDb();
    
    // Collections that might contain test data
    const collections = [
      'applications',
      'partnership_requests',
      // Add other collections as needed
    ];
    
    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);
      
      // Find documents with test prefix in title/description
      const snapshot = await collectionRef
        .where('title', '>=', testIdPrefix)
        .where('title', '<=', testIdPrefix + '\uf8ff')
        .get();
      
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} documents from ${collectionName}`);
      }
    }
  } catch (error) {
    console.error('Error during test data cleanup:', error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Clean up specific application by ID
 */
export async function cleanupApplication(applicationId: string): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('applications').doc(applicationId).delete();
  } catch (error) {
    console.error(`Error cleaning up application ${applicationId}:`, error);
  }
}

/**
 * Clean up specific partnership request by ID
 */
export async function cleanupPartnershipRequest(requestId: string): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('partnership_requests').doc(requestId).delete();
  } catch (error) {
    console.error(`Error cleaning up partnership request ${requestId}:`, error);
  }
}

/**
 * Clean up all test data created in a test session
 * Uses a test session ID to track created data
 */
export class TestDataCleanup {
  private createdIds: {
    applications: string[];
    partnershipRequests: string[];
  } = {
    applications: [],
    partnershipRequests: [],
  };
  
  /**
   * Track created application ID for cleanup
   */
  trackApplication(id: string): void {
    this.createdIds.applications.push(id);
  }
  
  /**
   * Track created partnership request ID for cleanup
   */
  trackPartnershipRequest(id: string): void {
    this.createdIds.partnershipRequests.push(id);
  }
  
  /**
   * Clean up all tracked test data
   */
  async cleanup(): Promise<void> {
    const db = getAdminDb();
    const batch = db.batch();
    
    // Delete tracked applications
    for (const id of this.createdIds.applications) {
      const ref = db.collection('applications').doc(id);
      batch.delete(ref);
    }
    
    // Delete tracked partnership requests
    for (const id of this.createdIds.partnershipRequests) {
      const ref = db.collection('partnership_requests').doc(id);
      batch.delete(ref);
    }
    
    try {
      if (this.createdIds.applications.length > 0 || this.createdIds.partnershipRequests.length > 0) {
        await batch.commit();
        console.log(`Cleaned up ${this.createdIds.applications.length} applications and ${this.createdIds.partnershipRequests.length} partnership requests`);
      }
    } catch (error) {
      console.error('Error during tracked data cleanup:', error);
    }
    
    // Reset tracking
    this.createdIds.applications = [];
    this.createdIds.partnershipRequests = [];
  }
}

