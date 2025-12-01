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

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Sign out current user
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get user profile from API (no longer reads directly from Firestore)
export const getUserProfile = async (uid: string, token: string) => {
  try {
    const response = await apiFetch(`/users/${uid}`, { token });
    return response;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Listen for login/logout changes (runs a function whenever user logs in or out)
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};