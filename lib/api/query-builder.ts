/**
 * API Query String Builder
 * 
 * Utilities for building query strings for API endpoints
 */

/**
 * Build an API endpoint with query string from filter parameters
 * Only appends query string if there are non-empty parameters
 * 
 * @param params - Object with filter parameters (values can be string or undefined)
 * @param baseEndpoint - Base API endpoint path (e.g., '/students/available-partners')
 * @returns Full endpoint with query string if params exist, otherwise just base endpoint
 * 
 * @example
 * ```typescript
 * const endpoint = buildApiQueryString(
 *   { search: 'test', department: 'CS' },
 *   '/students/available-partners'
 * );
 * // Returns: "/students/available-partners?search=test&department=CS"
 * 
 * const endpoint2 = buildApiQueryString({}, '/students/available-partners');
 * // Returns: "/students/available-partners"
 * ```
 */
export function buildApiQueryString(
  params: Record<string, string | undefined>,
  baseEndpoint: string
): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.append(key, value);
    }
  });
  
  const queryString = query.toString();
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
}

