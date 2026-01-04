/**
 * Validation Helper Functions
 * 
 * Optional enhancement utilities for cleaner validation in API routes
 */

import { NextRequest } from 'next/server';
import { validateRequest } from './validation';
import { ApiResponse } from './response';
import { ValidationError } from './errors';
import type { z } from 'zod';

/**
 * Validate request and extract data, throwing ValidationError on failure
 * This is an optional enhancement that can make API route code cleaner
 * 
 * @param request - NextRequest object
 * @param schema - Zod schema to validate against
 * @returns Validated data of type T
 * @throws ValidationError if validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const { targetSupervisorId, projectId } = await validateAndExtract(
 *     request,
 *     supervisorPartnershipRequestSchema
 *   );
 *   // Use validated data...
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     return ApiResponse.validationError(error.message);
 *   }
 *   throw error;
 * }
 * ```
 */
export async function validateAndExtract<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  const validation = await validateRequest(request, schema);
  
  if (!validation.valid || !validation.data) {
    throw new ValidationError(validation.error || 'Invalid request data');
  }
  
  return validation.data;
}

/**
 * Helper to handle validation errors in API routes
 * Returns appropriate ApiResponse for ValidationError
 * 
 * @param error - The caught error
 * @returns ApiResponse for validation error, or null if not a ValidationError
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await validateAndExtract(request, schema);
 *   // Process data...
 * } catch (error) {
 *   const validationResponse = handleValidationError(error);
 *   if (validationResponse) return validationResponse;
 *   // Handle other errors...
 * }
 * ```
 */
export function handleValidationError(error: unknown): ReturnType<typeof ApiResponse.validationError> | null {
  if (error instanceof ValidationError) {
    return ApiResponse.validationError(error.message);
  }
  return null;
}

