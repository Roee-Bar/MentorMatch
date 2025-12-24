/**
 * Firebase Authentication Error Mapping
 * 
 * Maps Firebase error codes to user-friendly error messages
 * Used by authentication functions to provide better UX
 */

import { isFirebaseAuthError } from './types/firebase-errors';

/**
 * Maps Firebase error codes to user-friendly messages
 * @param error - Firebase error object (may have code or message property)
 * @returns User-friendly error message string
 */
export function getFirebaseErrorMessage(error: unknown): string {
  // Firebase errors have a 'code' property (e.g., 'auth/wrong-password')
  const errorCode = isFirebaseAuthError(error) ? error.code : 
    (typeof error === 'object' && error !== null && 'code' in error) 
      ? String((error as any).code) 
      : '';
  
  // Map Firebase error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    // Registration errors
    'auth/email-already-exists': 'Email already in use. Please try logging in instead.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    
    // Login-specific errors
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    
    // Additional common errors
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/requires-recent-login': 'Please log out and log back in to complete this action.',
    
    // Email verification errors
    'auth/email-already-verified': 'Email is already verified.',
  };
  
  // Check if we have a mapped message for this error code
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }
  
  // If error has a message but no code, try to extract useful info
  const errorMessage = isFirebaseAuthError(error) 
    ? error.message 
    : (typeof error === 'object' && error !== null && 'message' in error)
      ? String((error as any).message)
      : '';
  
  if (errorMessage) {
    // Check if the message contains any Firebase error codes
    for (const [code, message] of Object.entries(errorMessages)) {
      if (errorMessage.includes(code)) {
        return message;
      }
    }
  }
  
  // Generic fallback for unknown errors
  return 'Login failed. Please check your credentials and try again.';
}

