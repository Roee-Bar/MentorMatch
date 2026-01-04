/**
 * Route Handler Utilities
 * 
 * Middleware-style helper functions to reduce boilerplate in API route handlers
 * Provides common patterns for validation, service calls, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAndExtract, handleValidationError } from './validation-helpers';
import { ValidationError } from './errors';
import { handleServiceResult } from './service-result-handler';
import { ApiResponse } from './response';
import type { ServiceResult } from '@/lib/services/shared/types';

/**
 * User type from auth middleware
 */
type User = {
  uid: string;
  email: string | undefined;
  role: string;
};

/**
 * Handler function for processing validated data and user
 */
type ServiceCallHandler<TData, TResult> = (
  data: TData,
  user: User
) => Promise<ServiceResult<TResult>>;

/**
 * Success handler function for custom response formatting
 * Receives both the validated data and the service result
 */
type SuccessHandler<TData, TResult> = (
  data: TData,
  result: ServiceResult<TResult>
) => NextResponse;

/**
 * Wrapper for validation and service call that includes user context
 * This is the main function to use in route handlers
 * 
 * @param request - NextRequest object
 * @param user - Authenticated user from withAuth
 * @param schema - Zod schema for request body validation
 * @param serviceCall - Function that calls the service with validated data and user
 * @param errorMessage - Default error message if service call fails
 * @param successHandler - Optional function to customize success response
 * @returns NextResponse with success or error
 */
export async function withValidationAndServiceCallForUser<TData, TResult>(
  request: NextRequest,
  user: User,
  schema: z.ZodSchema<TData>,
  serviceCall: ServiceCallHandler<TData, TResult>,
  errorMessage: string,
  successHandler?: SuccessHandler<TData, TResult>
): Promise<NextResponse> {
  try {
    // Validate request body
    const data = await validateAndExtract(request, schema);

    // Call service with validated data and user
    const result = await serviceCall(data, user);

    // Handle service result errors
    const errorResponse = handleServiceResult(result, errorMessage);
    if (errorResponse) return errorResponse;

    // Handle success
    if (successHandler) {
      return successHandler(data, result);
    }

    // Default success response
    return ApiResponse.successMessage('Operation completed successfully');
  } catch (error) {
    const validationResponse = handleValidationError(error);
    if (validationResponse) return validationResponse;
    throw error;
  }
}

/**
 * Enhanced version of handleServiceResult with custom success handling
 * 
 * @param result - ServiceResult from service layer
 * @param errorMessage - Default error message if result.error is not provided
 * @param successHandler - Function to handle successful result
 * @returns NextResponse (error or success)
 */
export function handleServiceResultWithSuccess<T>(
  result: ServiceResult<T>,
  errorMessage: string,
  successHandler: (data: T) => NextResponse
): NextResponse {
  if (!result.success) {
    return ApiResponse.error(result.error || errorMessage, 400);
  }

  if (!result.data) {
    return ApiResponse.error(errorMessage, 400);
  }

  return successHandler(result.data);
}

