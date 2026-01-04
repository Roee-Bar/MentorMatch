/**
 * Firebase Admin SDK Configuration
 * 
 * Server-side Firebase SDK for authentication token verification
 * and server-side Firestore operations.
 */

import * as admin from 'firebase-admin';
import { logger } from './logger';

// Track if we've already logged the minimal config warning to avoid duplicate logs
let hasLoggedMinimalConfigWarning = false;

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
  const isCI = process.env.CI === 'true';
  
  // In test mode, ALWAYS use 'demo-test' as project ID to match emulator configuration
  // This prevents the Admin SDK from reading .firebaserc or Application Default Credentials
  const projectId = isTestEnv 
    ? 'demo-test'  // Force demo-test in test mode
    : process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // IMPORTANT: Set emulator environment variables BEFORE initialization
  // Firebase Admin SDK reads these at initialization time
  if (isTestEnv) {
    const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8081';
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    
    // Set emulator hosts for Admin SDK BEFORE initialization
    process.env.FIRESTORE_EMULATOR_HOST = firestoreEmulatorHost;
    process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
    
    // CRITICAL: Set GCLOUD_PROJECT to prevent Admin SDK from reading .firebaserc or ADC
    // This ensures custom tokens are created with the correct project ID
    process.env.GCLOUD_PROJECT = 'demo-test';
    process.env.FIREBASE_ADMIN_PROJECT_ID = 'demo-test';
    
    logger.debug('Configured Firebase Admin SDK for emulator', { 
      context: 'Firebase',
      data: { 
        firestoreEmulatorHost, 
        authEmulatorHost,
        projectId: 'demo-test',
        gcloudProject: process.env.GCLOUD_PROJECT
      }
    });
  }

  // Check if all required environment variables are present
  // In test environment, always use minimal config (no credentials) to connect to emulator
  const hasFullCredentials = !isTestEnv && projectId && clientEmail && privateKey;
  
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
    if (hasFullCredentials && !isTestEnv) {
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
      
      // Only log the warning once per process, and use debug level in CI/test environments
      // where this is expected behavior
      if (!hasLoggedMinimalConfigWarning) {
        hasLoggedMinimalConfigWarning = true;
        if (isCI || isTestEnv) {
          // In CI/test, this is expected - use debug level to reduce noise
          logger.debug(
            'Missing Firebase Admin environment variables. Initializing with minimal config for build/testing.',
            { context: 'Firebase', data: { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey } }
          );
        } else {
          // In development, use warn level to alert developers
          logger.warn(
            'Missing Firebase Admin environment variables. Initializing with minimal config for build/testing.',
            { context: 'Firebase', data: { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey } }
          );
        }
      }
      
      // In test mode, always use 'demo-test' to ensure token audience matches
      const finalProjectId = isTestEnv ? 'demo-test' : (projectId || 'demo-test');
      admin.initializeApp({
        projectId: finalProjectId,
      });
      logger.debug('Initialized with minimal config', { 
        context: 'Firebase',
        data: { projectId: finalProjectId, isTestEnv }
      });
    }
  } catch (error) {
    logger.firebase.error('Initialization', error);
    
    // If initialization failed, try to initialize with minimal config as fallback
    // This ensures the app is always initialized, even if credentials are invalid
    if (!admin.apps.length) {
      try {
        // Only log fallback warning once per process
        if (!hasLoggedMinimalConfigWarning) {
          hasLoggedMinimalConfigWarning = true;
          if (isCI || isTestEnv) {
            logger.debug('Initialization failed, attempting fallback with minimal config', { context: 'Firebase' });
          } else {
            logger.warn('Initialization failed, attempting fallback with minimal config', { context: 'Firebase' });
          }
        }
        // In test mode, always use 'demo-test' to ensure token audience matches
        const finalProjectId = isTestEnv ? 'demo-test' : (projectId || 'demo-test');
        admin.initializeApp({
          projectId: finalProjectId,
        });
        logger.debug('Fallback initialization succeeded', { 
          context: 'Firebase',
          data: { projectId: finalProjectId, isTestEnv }
        });
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
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
    // In test mode, always use 'demo-test' to ensure token audience matches
    const finalProjectId = isTestEnv 
      ? 'demo-test' 
      : (process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test');
    admin.initializeApp({
      projectId: finalProjectId,
    });
    logger.debug('Emergency initialization with minimal config', { 
      context: 'Firebase',
      data: { projectId: finalProjectId, isTestEnv }
    });
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
