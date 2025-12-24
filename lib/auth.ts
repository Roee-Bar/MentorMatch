// auth.ts
// This file has all the functions for user authentication (login, logout)
// Registration is now handled by the /api/auth/register endpoint

import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { apiFetch } from './api/client';
import { getFirebaseErrorMessage } from './auth-errors';

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile to check role
    const token = await user.getIdToken();
    const profile = await getUserProfile(user.uid, token);

    // If profile fetch fails, proceed with sign-in (backward compatibility)
    if (profile.success && profile.data) {
      const userRole = profile.data.role;

      // Check email verification only for students
      if (userRole === 'student' && !user.emailVerified) {
        // Sign out the user since they can't proceed
        await firebaseSignOut(auth);
        return { 
          success: false, 
          error: 'Please verify your email before logging in. Check your email for the verification link.' 
        };
      }
    }

    return { success: true, user };
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
    return response;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Send email verification to current user
export const sendEmailVerification = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No user is currently signed in' };
    }

    if (currentUser.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    await firebaseSendEmailVerification(currentUser);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getFirebaseErrorMessage(error) };
  }
};

// Listen for login/logout changes (runs a function whenever user logs in or out)
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};