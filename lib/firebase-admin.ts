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
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';

  // Check if all required environment variables are present
  const hasFullCredentials = projectId && clientEmail && privateKey;
  
  // Only fail in production runtime on Vercel (actual deployment)
  // For builds, tests, and development, initialize with minimal config
  const isProductionRuntime = process.env.NODE_ENV === 'production' && 
                              process.env.VERCEL === '1' &&
                              !process.env.CI; // CI builds should use minimal config
  
  if (!hasFullCredentials && isProductionRuntime) {
    const error = new Error('CRITICAL: Missing Firebase Admin credentials in production');
    logger.error('Firebase initialization failed', error, { context: 'Firebase' });
    throw error;
  }

  try {
    if (hasFullCredentials) {
      // Initialize with full credentials
      // TypeScript narrowing: we know these are defined due to hasFullCredentials check
      const certProjectId = projectId as string;
      const certClientEmail = clientEmail as string;
      const certPrivateKey = privateKey as string;
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: certProjectId,
          clientEmail: certClientEmail,
          // Replace escaped newlines with actual newlines
          privateKey: certPrivateKey.replace(/\\n/g, '\n'),
        }),
        projectId: certProjectId,
      });

      logger.firebase.init();
    } else {
      // Initialize with minimal config for build, testing, or development
      // This allows the build to succeed and API routes to be analyzed
      logger.warn(
        'Missing Firebase Admin environment variables. Initializing with minimal config for build/testing.',
        { context: 'Firebase', data: { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey } }
      );
      
      admin.initializeApp({
        projectId: projectId || 'demo-test',
      });
      logger.debug('Initialized with minimal config', { context: 'Firebase' });
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
    
    // If initialization failed, try to initialize with minimal config as fallback
    // This ensures the app is always initialized, even if credentials are invalid
    if (!admin.apps.length) {
      try {
        logger.warn('Initialization failed, attempting fallback with minimal config', { context: 'Firebase' });
        admin.initializeApp({
          projectId: projectId || 'demo-test',
        });
        logger.debug('Fallback initialization succeeded', { context: 'Firebase' });
      } catch (fallbackError) {
        logger.firebase.error('Fallback initialization also failed', fallbackError);
        // Only throw in development to help debug
        // In production/test builds, we'll let the exports fail with a clear error
        if (process.env.NODE_ENV === 'development') {
          throw fallbackError;
        }
      }
    }
    
    // Only throw in development to help debug
    if (process.env.NODE_ENV === 'development' && admin.apps.length === 0) {
      throw error;
    }
  }
}

// Ensure app is initialized before exporting services
if (!admin.apps.length) {
  // Last resort: initialize with minimal config
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test',
    });
    logger.debug('Emergency initialization with minimal config', { context: 'Firebase' });
  } catch (error) {
    logger.firebase.error('Emergency initialization failed', error);
    // This should never happen, but if it does, we need to throw
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your configuration.');
  }
}

// Export Firebase Admin services
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Export admin instance for advanced use cases
export default admin;
