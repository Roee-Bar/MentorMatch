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
// Check for test mode using NEXT_PUBLIC_* variables which are available in the browser
// Also check for emulator host variables directly - if they're set, connect to emulators
const isClientTestEnv = typeof window !== 'undefined' && (
  process.env.NEXT_PUBLIC_E2E_TEST === 'true' || 
  process.env.NEXT_PUBLIC_NODE_ENV === 'test' ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST
);

// Always try to connect to emulators if emulator host variables are set (client-side only)
if (typeof window !== 'undefined') {
  const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;

  // Connect to Auth Emulator if host is configured
  if (authEmulatorHost && !authEmulatorHost.includes('undefined') && authEmulatorHost.trim() !== '') {
    try {
      // Check if already connected by trying to get the auth instance
      // connectAuthEmulator will throw if already connected
      connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Firebase] ✓ Connected to Auth Emulator at', `http://${authEmulatorHost}`);
      }
    } catch (error) {
      // Emulator already connected, ignore error
      const errorMessage = (error as Error)?.message || '';
      if (!errorMessage.includes('already been initialized') && !errorMessage.includes('already connected')) {
        console.warn('[Firebase] Failed to connect to Auth Emulator:', error);
      }
    }
  } else if (isClientTestEnv) {
    // Only warn in test mode if emulator host is not set
    console.warn('[Firebase] ⚠ Auth Emulator host not configured. NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST);
  }

  // Connect to Firestore Emulator if host is configured
  if (firestoreEmulatorHost && !firestoreEmulatorHost.includes('undefined') && firestoreEmulatorHost.trim() !== '') {
    try {
      const [host, port] = firestoreEmulatorHost.split(':');
      connectFirestoreEmulator(db, host, parseInt(port || '8080'));
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Firebase] ✓ Connected to Firestore Emulator at', `${host}:${port || '8080'}`);
      }
    } catch (error) {
      // Emulator already connected, ignore error
      const errorMessage = (error as Error)?.message || '';
      if (!errorMessage.includes('already been initialized') && !errorMessage.includes('already connected')) {
        console.warn('[Firebase] Failed to connect to Firestore Emulator:', error);
      }
    }
  } else if (isClientTestEnv) {
    // Only warn in test mode if emulator host is not set
    console.warn('[Firebase] ⚠ Firestore Emulator host not configured. NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST:', process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST);
  }
}