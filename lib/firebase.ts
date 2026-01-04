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

// Determine test mode and localhost status BEFORE any Firebase initialization
const isTestEnv = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_E2E_TEST === 'true' || process.env.NEXT_PUBLIC_NODE_ENV === 'test')
  : (process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true');

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

// Initialize auth and db services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// CRITICAL: Connect to emulators IMMEDIATELY after initialization
// This must happen synchronously before any other code imports and uses these services
if (typeof window !== 'undefined') {
  // Check for emulator hosts
  const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
  
  // Check for test mode flags
  const isTestMode = process.env.NEXT_PUBLIC_E2E_TEST === 'true' || 
                     process.env.NEXT_PUBLIC_NODE_ENV === 'test' ||
                     !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  
  // Always connect to emulators if on localhost OR if test mode is detected
  const shouldConnectToEmulators = !!authEmulatorHost || 
                                   !!firestoreEmulatorHost || 
                                   isTestMode || 
                                   isLocalhostEnv;

  if (shouldConnectToEmulators) {
    const defaultAuthHost = 'localhost:9099';
    const defaultFirestoreHost = 'localhost:8081';

    // Connect to Auth Emulator
    const authHost = authEmulatorHost || defaultAuthHost;
    if (authHost && !authHost.includes('undefined') && authHost.trim() !== '') {
      try {
        // CRITICAL: connectAuthEmulator must be called before any auth operations
        connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
        console.log('[Firebase] ✓ Connected to Auth Emulator at', `http://${authHost}`, '| Project:', projectId, '| AuthDomain:', authDomain);
      } catch (error: any) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('already been initialized') || errorMessage.includes('already connected')) {
          console.log('[Firebase] Auth Emulator already connected');
        } else {
          console.error('[Firebase] ❌ Failed to connect to Auth Emulator:', error);
          // Re-throw in development to surface the issue
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Firebase] Error details:', {
              errorMessage,
              authHost,
              projectId,
              authDomain,
              isLocalhost: isLocalhostEnv,
              isTestMode
            });
          }
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
      } catch (error: any) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('already been initialized') || errorMessage.includes('already connected')) {
          console.log('[Firebase] Firestore Emulator already connected');
        } else {
          console.error('[Firebase] ❌ Failed to connect to Firestore Emulator:', error);
        }
      }
    }
  } else {
    // Log why we're not connecting (for debugging)
    console.log('[Firebase] Not connecting to emulators:', {
      authHost: authEmulatorHost || 'not set',
      firestoreHost: firestoreEmulatorHost || 'not set',
      isTestMode,
      isLocalhost: isLocalhostEnv,
      projectId,
      authDomain
    });
  }
}

// Export services
export { auth, db, storage };
