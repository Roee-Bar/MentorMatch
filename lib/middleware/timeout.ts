/**
 * Timeout Utilities
 * 
 * Provides timeout wrappers for async operations
 */

import { TimeoutError } from './errors';

/**
 * Default timeout values (in milliseconds)
 * Can be overridden via environment variables
 */
export const DEFAULT_TIMEOUTS = {
  API_REQUEST: parseInt(process.env.API_REQUEST_TIMEOUT_MS || '30000', 10),
  FIRESTORE_OPERATION: parseInt(process.env.FIRESTORE_OPERATION_TIMEOUT_MS || '10000', 10),
  EMAIL_OPERATION: parseInt(process.env.EMAIL_OPERATION_TIMEOUT_MS || '15000', 10),
  AUTH_VERIFICATION: parseInt(process.env.AUTH_VERIFICATION_TIMEOUT_MS || '5000', 10),
  HEALTH_CHECK: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '2000', 10),
} as const;

/**
 * Wrap a promise with a timeout
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Name of the operation (for error message)
 * @returns The promise result or throws TimeoutError
 * 
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   'fetchData'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Wrap a Firestore operation with default timeout
 */
export async function withFirestoreTimeout<T>(
  promise: Promise<T>,
  operation: string
): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.FIRESTORE_OPERATION, operation);
}

/**
 * Wrap an email operation with default timeout
 */
export async function withEmailTimeout<T>(
  promise: Promise<T>,
  operation: string
): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.EMAIL_OPERATION, operation);
}

/**
 * Wrap an auth verification operation with default timeout
 */
export async function withAuthTimeout<T>(
  promise: Promise<T>,
  operation: string
): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.AUTH_VERIFICATION, operation);
}

/**
 * Wrap a health check operation with default timeout
 */
export async function withHealthCheckTimeout<T>(
  promise: Promise<T>,
  operation: string
): Promise<T> {
  return withTimeout(promise, DEFAULT_TIMEOUTS.HEALTH_CHECK, operation);
}

