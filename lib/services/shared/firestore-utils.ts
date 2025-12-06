/**
 * Firestore utility functions for common data operations
 * Used across all domain services for consistency
 */

/**
 * Convert Firestore timestamp fields to JavaScript Date objects
 * Handles null/undefined and checks for toDate() method
 * 
 * @param data - Object with potential Firestore Timestamp fields
 * @param fields - Array of field names to convert (e.g., ['createdAt', 'updatedAt'])
 * @returns Data with converted Date objects
 */
export function convertFirestoreTimestamps<T>(data: any, fields: string[]): T {
  if (!data) return data;
  
  const converted = { ...data };
  
  for (const field of fields) {
    if (converted[field]?.toDate) {
      converted[field] = converted[field].toDate();
    }
  }
  
  return converted as T;
}

/**
 * Safely convert a single Firestore Timestamp to Date
 * Returns the original value if not a Timestamp or if null/undefined
 */
export function convertTimestamp(value: any): Date | undefined {
  if (!value) return value;
  return value.toDate ? value.toDate() : value;
}

