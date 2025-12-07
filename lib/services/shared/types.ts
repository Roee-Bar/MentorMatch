/**
 * Common types used across service modules
 * Domain-specific types remain in types/database.ts
 */

// ============================================
// SERVICE RESULT TYPES
// ============================================

/**
 * Standardized service operation result
 * Use this for all write operations (create, update, delete)
 * 
 * @template T - The type of data returned on success (void if no data)
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Helper functions to create ServiceResult objects consistently
 */
export const ServiceResults = {
  /**
   * Create a successful result
   * @param data - Optional data to include in the result
   * @param message - Optional success message
   */
  success: <T>(data?: T, message?: string): ServiceResult<T> => ({
    success: true,
    data,
    message,
  }),

  /**
   * Create an error result
   * @param error - Error message describing what went wrong
   */
  error: (error: string): ServiceResult<never> => ({
    success: false,
    error,
  }),
};

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard to check if a ServiceResult represents success
 * Useful for narrowing types in API routes
 * 
 * @example
 * const result = await SomeService.doSomething();
 * if (isServiceSuccess(result)) {
 *   // result.data is now properly typed
 * }
 */
export function isServiceSuccess<T>(
  result: ServiceResult<T>
): result is ServiceResult<T> & { success: true } {
  return result.success;
}

/**
 * Type guard to check if a ServiceResult represents an error
 * 
 * @example
 * const result = await SomeService.doSomething();
 * if (isServiceError(result)) {
 *   // result.error is guaranteed to be a string
 * }
 */
export function isServiceError<T>(
  result: ServiceResult<T>
): result is ServiceResult<T> & { success: false; error: string } {
  return !result.success && typeof result.error === 'string';
}
