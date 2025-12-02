/**
 * Firebase Admin SDK Configuration
 * 
 * Server-side Firebase SDK for authentication token verification
 * and server-side Firestore operations.
 */

import * as admin from 'firebase-admin';
import { logger } from './logger';

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // Check if all required environment variables are present
    if (!projectId || !clientEmail || !privateKey) {
      // Fail fast in production to prevent silent failures
      if (process.env.NODE_ENV === 'production') {
        const error = new Error('CRITICAL: Missing Firebase Admin credentials in production');
        logger.error('Firebase initialization failed', error, { context: 'Firebase' });
        throw error;
      }
      
      logger.warn(
        'Missing Firebase Admin environment variables. Server-side features unavailable.',
        { context: 'Firebase', data: { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey } }
      );
      
      // Initialize with minimal config for testing or development only
      if (process.env.NODE_ENV === 'test') {
        admin.initializeApp({
          projectId: projectId || 'placeholder-project',
        });
        logger.debug('Initialized with minimal config for testing', { context: 'Firebase' });
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

      logger.firebase.init();
    }
  } catch (error) {
    logger.firebase.error('Initialization', error);
    // Only throw in development to help debug
    // In production/test builds, allow it to continue with limited functionality
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}

// Export Firebase Admin services
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Export admin instance for advanced use cases
export default admin;
