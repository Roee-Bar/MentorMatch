// auth.ts
// This file has all the functions for user authentication (login, logout)
// Registration is now handled by the /api/auth/register endpoint

import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { apiFetch } from './api/client';
import { getFirebaseErrorMessage } from './auth-errors';

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  // In test mode, use test auth store
  const isTestEnv = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
  
  if (isTestEnv && typeof window !== 'undefined') {
    try {
      // Call test auth API endpoint
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Login failed' };
      }
      
      const data = await response.json();
      const { token, uid } = data;
      
      // Store test token
      sessionStorage.setItem('__test_id_token__', token);
      sessionStorage.setItem('__test_local_id__', uid);
      sessionStorage.setItem('__test_email__', email);
      
      // Also set in localStorage for Firebase format compatibility
      const projectId = 'demo-test';
      const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
      const authState = {
        uid,
        email,
        emailVerified: true,
        stsTokenManager: {
          apiKey: 'test-api-key',
          refreshToken: token,
          accessToken: token,
          expirationTime: Date.now() + 3600000,
        },
      };
      window.localStorage.setItem(authKey, JSON.stringify(authState));
      
      // Trigger custom event to notify auth listeners immediately
      window.dispatchEvent(new CustomEvent('test-token-set'));
      
      // Also trigger storage event for compatibility
      window.dispatchEvent(new StorageEvent('storage', {
        key: '__test_id_token__',
        newValue: token,
        storageArea: sessionStorage,
      }));
      
      // Create mock user for compatibility
      const mockUser = {
        uid,
        email,
        emailVerified: true,
        getIdToken: async () => token,
      } as any;
      
      return { success: true, user: mockUser };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }
  
  // Normal Firebase Auth
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: getFirebaseErrorMessage(error) };
  }
};

// Sign out current user
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getFirebaseErrorMessage(error) };
  }
};

// Get user profile from API (no longer reads directly from Firestore)
export const getUserProfile = async (uid: string, token: string) => {
  const isTestEnv = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
  
  if (isTestEnv) {
    console.log('[TEST CLIENT] getUserProfile called:', { uid, hasToken: !!token });
  }
  
  try {
    const response = await apiFetch(`/users/${uid}`, { token });
    
    if (isTestEnv) {
      console.log('[TEST CLIENT] getUserProfile response:', response);
    }
    
    // Ensure response has the expected format
    if (response && typeof response === 'object') {
      // If apiFetch returns the response directly, it should have success and data
      if (response.success !== undefined) {
        return response;
      }
      // If it's just the data object, wrap it
      if (response.data) {
        return { success: true, data: response.data };
      }
      // If it's the user object directly, wrap it
      return { success: true, data: response };
    }
    
    return { success: false, error: 'Invalid response format' };
  } catch (error: any) {
    // Provide more detailed error information
    const errorMessage = error?.message || 'Failed to fetch user profile';
    if (isTestEnv) {
      console.error('[TEST CLIENT] getUserProfile error:', { uid, error: errorMessage, fullError: error });
    }
    console.warn('getUserProfile error:', { uid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Listen for login/logout changes (runs a function whenever user logs in or out)
export const onAuthChange = (callback: (user: User | null) => void) => {
  // In test mode, check for test token and create mock user
  const isTestEnv = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
  
  if (isTestEnv && typeof window !== 'undefined') {
    // Check immediately and set up listener
    const checkTestAuth = () => {
      const testToken = sessionStorage.getItem('__test_id_token__');
      const testUid = sessionStorage.getItem('__test_local_id__');
      
      if (testToken && testUid) {
        // Create a mock user object that works with the client code
        // Must match Firebase User interface
        const mockUser = {
          uid: testUid,
          email: sessionStorage.getItem('__test_email__') || '',
          emailVerified: true,
          displayName: null,
          photoURL: null,
          phoneNumber: null,
          providerId: 'firebase',
          getIdToken: async () => testToken,
          getIdTokenResult: async () => ({
            token: testToken,
            authTime: new Date().toISOString(),
            issuedAtTime: new Date().toISOString(),
            expirationTime: new Date(Date.now() + 3600000).toISOString(),
            signInProvider: 'custom',
            claims: {},
          }),
          reload: async () => {},
          toJSON: () => ({}),
        } as User;
        
        callback(mockUser);
        return true;
      } else {
        callback(null);
        return false;
      }
    };
    
    // Check immediately
    let hasAuth = checkTestAuth();
    
    // Set up polling to catch when token is set
    // Use shorter interval for faster detection
    const intervalId = setInterval(() => {
      if (checkTestAuth()) {
        hasAuth = true;
      }
    }, 100);
    
    // Also listen for custom events (when token is set programmatically)
    const tokenSetListener = () => {
      if (checkTestAuth()) {
        hasAuth = true;
      }
    };
    window.addEventListener('test-token-set', tokenSetListener);
    
    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('test-token-set', tokenSetListener);
    };
  }
  
  // Normal Firebase Auth behavior
  return onAuthStateChanged(auth, callback);
};