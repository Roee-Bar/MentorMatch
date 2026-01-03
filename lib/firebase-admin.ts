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
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';

    // Check if all required environment variables are present
    if (!projectId || !clientEmail || !privateKey) {
      // Only fail in production runtime on Vercel (actual deployment)
      // For builds, tests, and development, initialize with minimal config
      const isProductionRuntime = process.env.NODE_ENV === 'production' && 
                                  process.env.VERCEL === '1' &&
                                  !process.env.CI; // CI builds should use minimal config
      
      if (isProductionRuntime) {
        const error = new Error('CRITICAL: Missing Firebase Admin credentials in production');
        logger.error('Firebase initialization failed', error, { context: 'Firebase' });
        throw error;
      }
      
      logger.warn(
        'Missing Firebase Admin environment variables. Initializing with minimal config for build/testing.',
        { context: 'Firebase', data: { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey } }
      );
      
      // Initialize with minimal config for build, testing, or development
      // This allows the build to succeed and API routes to be analyzed
      admin.initializeApp({
        projectId: projectId || 'demo-test',
      });
      logger.debug('Initialized with minimal config', { context: 'Firebase' });
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

    // Connect to emulators if in test environment
    if (isTestEnv) {
      const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
      const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
      
      // Set emulator hosts for Admin SDK
      process.env.FIRESTORE_EMULATOR_HOST = firestoreEmulatorHost;
      process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
      
      logger.debug('Configured Firebase Admin SDK for emulator', { 
        context: 'Firebase',
        data: { firestoreEmulatorHost, authEmulatorHost }
      });
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
