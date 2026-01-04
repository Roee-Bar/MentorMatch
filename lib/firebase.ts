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
const projectId = isTestEnv 
  ? 'demo-test'  // Force demo-test in test mode to match admin SDK
  : (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project');
const storageBucket = isTestEnv
  ? 'demo-test.appspot.com'  // Match project ID
  : (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
  projectId,
  storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to Firebase Emulators if running in test environment (client-side only)
// Strategy: Use multiple detection methods since Next.js embeds NEXT_PUBLIC_* vars at build time
if (typeof window !== 'undefined') {
  // Method 1: Check for explicit emulator host env vars (set by Playwright webServer.env)
  const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
  
  // Method 2: Check for test mode flags
  const isTestMode = process.env.NEXT_PUBLIC_E2E_TEST === 'true' || 
                     process.env.NEXT_PUBLIC_NODE_ENV === 'test' ||
                     process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  
  // Method 3: Check if we're on localhost (common in test/dev environments)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  // Method 4: Check if project ID is demo-test (test mode indicator)
  const isDemoTestProject = projectId === 'demo-test';
  
  // Determine if we should use emulators
  // Use emulators if: explicit hosts set, test mode detected, OR (localhost AND demo-test project)
  const shouldUseEmulators = authEmulatorHost || 
                             firestoreEmulatorHost || 
                             isTestMode || 
                             (isLocalhost && isDemoTestProject);
  
  const defaultAuthHost = 'localhost:9099';
  const defaultFirestoreHost = 'localhost:8081';

  if (shouldUseEmulators) {
    // Connect to Auth Emulator
    const authHost = authEmulatorHost || defaultAuthHost;
    if (authHost && !authHost.includes('undefined') && authHost.trim() !== '') {
      try {
        connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
        console.log('[Firebase] ✓ Connected to Auth Emulator at', `http://${authHost}`);
      } catch (error) {
        const errorMessage = (error as Error)?.message || '';
        if (!errorMessage.includes('already been initialized') && !errorMessage.includes('already connected')) {
          console.warn('[Firebase] Failed to connect to Auth Emulator:', error);
        }
      }
    }

    // Connect to Firestore Emulator
    const firestoreHost = firestoreEmulatorHost || defaultFirestoreHost;
    if (firestoreHost && !firestoreHost.includes('undefined') && firestoreHost.trim() !== '') {
      try {
        const [host, port] = firestoreHost.split(':');
        connectFirestoreEmulator(db, host, parseInt(port || '8080'));
        console.log('[Firebase] ✓ Connected to Firestore Emulator at', `${host}:${port || '8080'}`);
      } catch (error) {
        const errorMessage = (error as Error)?.message || '';
        if (!errorMessage.includes('already been initialized') && !errorMessage.includes('already connected')) {
          console.warn('[Firebase] Failed to connect to Firestore Emulator:', error);
        }
      }
    }
  } else {
    // Log why we're not connecting (for debugging)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Firebase] Not connecting to emulators:', {
        authHost: authEmulatorHost || 'not set',
        firestoreHost: firestoreEmulatorHost || 'not set',
        isTestMode,
        isLocalhost,
        isDemoTestProject,
        projectId
      });
    }
  }
}