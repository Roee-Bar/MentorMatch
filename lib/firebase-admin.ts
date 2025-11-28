/**
 * Firebase Admin SDK Configuration
 * 
 * Server-side Firebase SDK for authentication token verification
 * and server-side Firestore operations.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // Check if all required environment variables are present
    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        'Firebase Admin SDK: Missing environment variables. ' +
        'Server-side Firebase features will not be available.'
      );
      
      // Initialize with minimal config for testing or development
      // This prevents errors but limits functionality
      if (process.env.NODE_ENV === 'test') {
        admin.initializeApp({
          projectId: 'test-project',
        });
      }
    } else {
      // Initialize with full credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Replace escaped newlines with actual newlines
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId,
      });

      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

// Export Firebase Admin services
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Export admin instance for advanced use cases
export default admin;
