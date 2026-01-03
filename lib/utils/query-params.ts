/**
 * Query Parameter Utilities
 * 
 * Helper functions for parsing and validating query parameters from URLSearchParams
 */

/**
 * Get an optional query parameter from URLSearchParams
 * Returns undefined if the parameter is not present or is an empty string
 * 
 * @param searchParams - URLSearchParams object from the request URL
 * @param key - The query parameter key to retrieve
 * @returns The parameter value as a string, or undefined if not present/empty
 * 
 * @example
 * ```typescript
 * const { searchParams } = new URL(request.url);
 * const projectId = getOptionalQueryParam(searchParams, 'projectId');
 * // Returns: string | undefined
 * ```
 */
export function getOptionalQueryParam(
  searchParams: URLSearchParams,
  key: string
): string | undefined {
  const value = searchParams.get(key);
  return value || undefined;
}

/**
 * Get a required query parameter from URLSearchParams
 * Throws an error if the parameter is not present or is empty
 * 
 * @param searchParams - URLSearchParams object from the request URL
 * @param key - The query parameter key to retrieve
 * @param errorMessage - Optional custom error message
 * @returns The parameter value as a string
 * @throws Error if the parameter is missing or empty
 * 
 * @example
 * ```typescript
 * const { searchParams } = new URL(request.url);
 * const projectId = getRequiredQueryParam(searchParams, 'projectId');
 * // Returns: string (throws if missing)
 * ```
 */
export function getRequiredQueryParam(
  searchParams: URLSearchParams,
  key: string,
  errorMessage?: string
): string {
  const value = searchParams.get(key);
  if (!value) {
    throw new Error(errorMessage || `${key} is required`);
  }
  return value;
}

