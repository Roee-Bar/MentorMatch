/**
 * Query Parameter Extraction and Validation
 * 
 * Provides reusable helpers for extracting and validating query parameters from API requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from './response';
import { getOptionalQueryParam } from '@/lib/utils/query-params';

/**
 * Extract and validate query parameters from request URL
 * 
 * @param request - NextRequest object
 * @param schema - Optional Zod schema for validation
 * @returns Validated query parameters or validation error response
 * 
 * @example
 * ```typescript
 * const schema = z.object({
 *   projectId: z.string().optional(),
 *   type: z.enum(['incoming', 'outgoing', 'all']).default('all')
 * });
 * 
 * const params = await extractQueryParams(request, schema);
 * if (params instanceof NextResponse) return params; // Error response
 * // Use params.projectId, params.type
 * ```
 */
export async function extractQueryParams<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema?: T
): Promise<z.infer<T> | NextResponse> {
  const { searchParams } = new URL(request.url);
  
  // If no schema provided, return raw searchParams
  if (!schema) {
    return searchParams as any;
  }
  
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Validate against schema
    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return ApiResponse.validationError(errorMessage);
    }
    return ApiResponse.validationError('Invalid query parameters');
  }
}

/**
 * Extract a single optional query parameter
 * Convenience wrapper around getOptionalQueryParam
 * 
 * @param request - NextRequest object
 * @param key - Query parameter key
 * @returns Parameter value or undefined
 */
export function getQueryParam(request: NextRequest, key: string): string | undefined {
  const { searchParams } = new URL(request.url);
  return getOptionalQueryParam(searchParams, key);
}

/**
 * Extract a single required query parameter
 * Returns validation error response if parameter is missing
 * 
 * @param request - NextRequest object
 * @param key - Query parameter key
 * @param errorMessage - Custom error message if parameter is missing
 * @returns Parameter value or validation error response
 */
export function getRequiredQueryParamFromRequest(
  request: NextRequest,
  key: string,
  errorMessage?: string
): string | NextResponse {
  const { searchParams } = new URL(request.url);
  const value = searchParams.get(key);
  
  if (!value) {
    return ApiResponse.validationError(errorMessage || `${key} is required`);
  }
  
  return value;
}

