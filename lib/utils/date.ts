/**
 * Date Utility Functions
 * 
 * Type-safe utilities for handling date formatting, especially for Firestore Timestamps
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Formats a Firestore Timestamp or Date object to a localized date string
 * Safely handles various date types without type assertions
 * 
 * @param date - Date object, Firestore Timestamp, or undefined
 * @returns Formatted date string or 'N/A' if date is invalid/undefined
 */
export function formatFirestoreDate(date: Date | Timestamp | undefined): string {
  if (!date) return 'N/A';
  if (date instanceof Date) return date.toLocaleDateString();
  if (typeof date === 'object' && 'toDate' in date) {
    return date.toDate().toLocaleDateString();
  }
  return 'N/A';
}

