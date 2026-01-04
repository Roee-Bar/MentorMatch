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
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
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
if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true' || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST)) {
  const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreEmulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;

  // Connect to Auth Emulator
  if (authEmulatorHost && !authEmulatorHost.includes('undefined')) {
    try {
      connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
    } catch (error) {
      // Emulator already connected, ignore error
      const errorMessage = (error as Error)?.message || '';
      if (!errorMessage.includes('already been initialized') && !errorMessage.includes('already connected')) {
        console.warn('Failed to connect to Auth Emulator:', error);
      }
    }
  }

  // Connect to Firestore Emulator
  if (firestoreEmulatorHost && !firestoreEmulatorHost.includes('undefined')) {
    try {
      const [host, port] = firestoreEmulatorHost.split(':');
      connectFirestoreEmulator(db, host, parseInt(port || '8080'));
    } catch (error) {
      // Emulator already connected, ignore error
      const errorMessage = (error as Error)?.message || '';
      if (!errorMessage.includes('already been initialized') && !errorMessage.includes('already connected')) {
        console.warn('Failed to connect to Firestore Emulator:', error);
      }
    }
  }
}