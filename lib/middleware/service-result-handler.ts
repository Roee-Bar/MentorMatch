/**
 * Service Result Error Handler
 * 
 * Provides standardized error handling for ServiceResult objects from service layer
 */

import { NextResponse } from 'next/server';
import { ApiResponse } from './response';
import type { ServiceResult } from '@/lib/services/shared/types';

/**
 * Handle service result and return error response if failed, null if successful
 * 
 * @param result - ServiceResult from service layer
 * @param errorMessage - Default error message if result.error is not provided
 * @returns NextResponse on error, null on success
 * 
 * @example
 * ```typescript
 * const result = await SomeService.doSomething();
 * const errorResponse = handleServiceResult(result, 'Failed to perform action');
 * if (errorResponse) return errorResponse;
 * // Continue with success logic
 * ```
 */
export function handleServiceResult<T>(
  result: ServiceResult<T>,
  errorMessage: string
): NextResponse | null {
  if (!result.success) {
    return ApiResponse.error(result.error || errorMessage, 400);
  }
  return null;
}

