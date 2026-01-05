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

// In test mode, we use in-memory database instead of Firebase emulators
// Client SDK is still initialized but API routes handle authentication via test database
if (typeof window !== 'undefined' && isTestEnv) {
  console.log('[Firebase] Test mode: Using in-memory database (client SDK initialized for compatibility)');
}

/**
 * Get auth token - works in both test and production mode
 * In test mode, returns token from sessionStorage
 * In production, returns token from Firebase Auth
 */
export async function getAuthToken(): Promise<string | null> {
  const isTestEnv = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
  
  if (isTestEnv && typeof window !== 'undefined') {
    const testToken = sessionStorage.getItem('__test_id_token__');
    if (testToken) {
      return testToken;
    }
  }
  
  return await auth.currentUser?.getIdToken() || null;
}

// Export services
export { auth, db, storage };
