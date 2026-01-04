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
  try {
    const response = await apiFetch(`/users/${uid}`, { token });
    
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
    console.warn('getUserProfile error:', { uid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Listen for login/logout changes (runs a function whenever user logs in or out)
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};