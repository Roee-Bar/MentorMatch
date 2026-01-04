import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required Firebase environment variables: ${missingEnvVars.join(', ')}\n` +
    `Please check your .env.local file.\n` +
    `Using placeholder values for development/testing.`
  );
}

// In test mode, force 'demo-test' to match admin SDK configuration
// This ensures both client and admin SDK use the same project ID for token verification
// Check both server-side and client-side environment variables
// NEXT_PUBLIC_E2E_TEST is set by Playwright webServer config for client-side access
const isTestEnv = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_E2E_TEST === 'true' || process.env.NEXT_PUBLIC_NODE_ENV === 'test')
  : (process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true');

// Check if we're on localhost (common in test/dev) - if so, use demo-test for emulator compatibility
const isLocalhostEnv = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Use demo-test if in test mode OR if on localhost (to catch test scenarios where env vars aren't embedded)
const shouldUseDemoTest = isTestEnv || isLocalhostEnv;
const projectId = shouldUseDemoTest
  ? 'demo-test'  // Force demo-test in test/localhost mode to match admin SDK
  : (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project');
const storageBucket = shouldUseDemoTest
  ? 'demo-test.appspot.com'  // Match project ID
  : (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com');

// When using emulators, authDomain should be set to localhost or the emulator host
// This prevents Firebase from trying to connect to production auth endpoints
const authDomain = shouldUseDemoTest || isLocalhostEnv
  ? 'localhost'  // Use localhost when emulators are expected
  : (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key',
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Determine emulator connection BEFORE initializing auth/db services
// This ensures emulators are connected before any operations
let shouldConnectToEmulators = false;
let authEmulatorHost: string | undefined;
let firestoreEmulatorHost: string | undefined;

if (typeof window !== 'undefined') {
  // Method 1: Check for explicit emulator host env vars (set by Playwright webServer.env)
  authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
  
  // Method 2: Check for test mode flags
  const isTestMode = process.env.NEXT_PUBLIC_E2E_TEST === 'true' || 
                     process.env.NEXT_PUBLIC_NODE_ENV === 'test' ||
                     process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  
  // Method 3: Check if we're on localhost (common in test/dev environments)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  // Determine if we should use emulators
  // Use emulators if: explicit hosts set, test mode detected, OR localhost (aggressive detection for tests)
  shouldConnectToEmulators = !!authEmulatorHost || 
                             !!firestoreEmulatorHost || 
                             isTestMode || 
                             isLocalhost; // Always try emulators on localhost
}

// Initialize auth and db
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators IMMEDIATELY after initialization (before any operations)
// CRITICAL: This must happen synchronously before any auth operations
if (shouldConnectToEmulators && typeof window !== 'undefined') {
  const defaultAuthHost = 'localhost:9099';
  const defaultFirestoreHost = 'localhost:8081';

  // Connect to Auth Emulator - use explicit localhost if on localhost
  const authHost = authEmulatorHost || defaultAuthHost;
  if (authHost && !authHost.includes('undefined') && authHost.trim() !== '') {
    try {
      // CRITICAL: connectAuthEmulator must be called before any auth operations
      // The second parameter should be the full URL including protocol
      connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
      console.log('[Firebase] ✓ Connected to Auth Emulator at', `http://${authHost}`, '| Project:', projectId);
    } catch (error) {
      const errorMessage = (error as Error)?.message || '';
      if (errorMessage.includes('already been initialized') || errorMessage.includes('already connected')) {
        // Already connected, that's fine
        console.log('[Firebase] Auth Emulator already connected');
      } else {
        console.error('[Firebase] ❌ Failed to connect to Auth Emulator:', error);
        // Don't throw - allow app to continue, but log the error
      }
    }
  }

  // Connect to Firestore Emulator
  const firestoreHost = firestoreEmulatorHost || defaultFirestoreHost;
  if (firestoreHost && !firestoreHost.includes('undefined') && firestoreHost.trim() !== '') {
    try {
      const [host, port] = firestoreHost.split(':');
      connectFirestoreEmulator(db, host, parseInt(port || '8080'));
      console.log('[Firebase] ✓ Connected to Firestore Emulator at', `${host}:${port || '8080'}`, '| Project:', projectId);
    } catch (error) {
      const errorMessage = (error as Error)?.message || '';
      if (errorMessage.includes('already been initialized') || errorMessage.includes('already connected')) {
        // Already connected, that's fine
        console.log('[Firebase] Firestore Emulator already connected');
      } else {
        console.error('[Firebase] ❌ Failed to connect to Firestore Emulator:', error);
        // Don't throw - allow app to continue, but log the error
      }
    }
  }
} else if (typeof window !== 'undefined') {
  // Log why we're not connecting (for debugging)
  console.log('[Firebase] Not connecting to emulators. shouldConnectToEmulators:', shouldConnectToEmulators, '| Project:', projectId, '| Hostname:', window.location.hostname);
}

// Export services
export { auth, db, storage };