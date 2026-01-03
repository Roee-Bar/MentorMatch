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

/**
 * Formats a Date object to a relative time string (e.g., "2 hours ago", "Just now")
 * Falls back to localized date string for dates older than 7 days
 * 
 * @param date - Date object to format
 * @returns Relative time string or localized date string
 */
export function formatRelativeDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return d.toLocaleDateString();
}

