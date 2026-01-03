/**
 * Date Utility Functions
 * 
 * Type-safe utilities for handling date formatting, especially for Firestore Timestamps
 * 
 * @deprecated These functions are maintained for backward compatibility.
 * Use DateFormatter class directly for new code.
 * 
 * Example migration:
 * ```typescript
 * // Old:
 * import { formatFirestoreDate } from '@/lib/utils/date';
 * const dateStr = formatFirestoreDate(date);
 * 
 * // New:
 * import { DateFormatter } from '@/lib/utils/date-formatter';
 * const dateStr = DateFormatter.formatForDisplay(date);
 * ```
 */

import { Timestamp } from 'firebase-admin/firestore';
import { DateFormatter, type DateInput } from './date-formatter';

// Re-export DateFormatter and DateInput for convenience
export { DateFormatter, type DateInput } from './date-formatter';

/**
 * Formats a Firestore Timestamp or Date object to a localized date string
 * Safely handles various date types without type assertions
 * 
 * @deprecated Use DateFormatter.formatFirestoreDate() or DateFormatter.formatForDisplay() instead
 * @param date - Date object, Firestore Timestamp, or undefined
 * @returns Formatted date string or 'N/A' if date is invalid/undefined
 */
export function formatFirestoreDate(date: Date | Timestamp | undefined): string {
  return DateFormatter.formatFirestoreDate(date as DateInput);
}

/**
 * Formats a Date object to a relative time string (e.g., "2 hours ago", "Just now")
 * Falls back to localized date string for dates older than 7 days
 * 
 * @deprecated Use DateFormatter.formatRelative() instead, which supports all date input types
 * @param date - Date object to format
 * @returns Relative time string or localized date string
 */
export function formatRelativeDate(date: Date): string {
  return DateFormatter.formatRelative(date);
}

