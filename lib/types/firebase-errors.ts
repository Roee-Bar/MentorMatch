/**
 * Firebase Authentication Error Types
 * 
 * Type definitions and type guards for Firebase authentication errors
 * Used throughout the application for type-safe error handling
 */

/**
 * Firebase Authentication Error interface
 * Matches the structure of errors thrown by Firebase Auth SDK
 */
export interface FirebaseAuthError {
  code: string;
  message: string;
  name?: string;
}

/**
 * Type guard to check if an error is a FirebaseAuthError
 * @param error - Unknown error object to check
 * @returns True if error is a FirebaseAuthError, false otherwise
 */
export function isFirebaseAuthError(error: unknown): error is FirebaseAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}



