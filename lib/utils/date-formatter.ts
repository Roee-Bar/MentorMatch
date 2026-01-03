/**
 * DateFormatter - Centralized date formatting utility
 * 
 * Provides comprehensive date formatting methods that handle all date input types:
 * - Date objects
 * - Firestore Timestamps (admin & client)
 * - String dates
 * - Number timestamps
 * - null/undefined values
 * 
 * This class serves as the single source of truth for all date formatting in the application.
 */

import type { Timestamp } from 'firebase-admin/firestore';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';

export type DateInput = 
  | Date 
  | Timestamp 
  | ClientTimestamp
  | string 
  | number 
  | undefined 
  | null;

export class DateFormatter {
  /**
   * Safely convert any date input to Date object
   * Returns null if the input cannot be converted to a valid Date
   */
  private static toDate(input: DateInput): Date | null {
    if (!input) return null;
    if (input instanceof Date) return input;
    
    // Handle string dates
    if (typeof input === 'string') {
      const parsed = new Date(input);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Handle number timestamps
    if (typeof input === 'number') {
      const parsed = new Date(input);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Handle Firestore Timestamp (both admin and client)
    if (typeof input === 'object' && 'toDate' in input) {
      try {
        return (input as { toDate: () => Date }).toDate();
      } catch {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Format for Firestore display (legacy compatibility)
   * Maintains backward compatibility with existing formatFirestoreDate()
   * 
   * @param input - Date input of any supported type
   * @returns Formatted date string or 'N/A' if invalid
   */
  static formatFirestoreDate(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  }

  /**
   * Format for table display (compact)
   * Example: "Jan 15, 2024"
   * 
   * @param input - Date input of any supported type
   * @returns Formatted date string or 'N/A' if invalid
   */
  static formatForTable(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format for card/display (readable)
   * Example: "January 15, 2024"
   * 
   * @param input - Date input of any supported type
   * @returns Formatted date string or 'N/A' if invalid
   */
  static formatForDisplay(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format with time
   * Example: "Jan 15, 2024, 2:30 PM"
   * 
   * @param input - Date input of any supported type
   * @returns Formatted date string with time or 'N/A' if invalid
   */
  static formatWithTime(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Format relative time (e.g., "2 days ago")
   * Enhanced version that supports all date input types
   * 
   * @param input - Date input of any supported type
   * @returns Relative time string or 'N/A' if invalid
   */
  static formatRelative(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Calculate days between two dates
   * 
   * @param start - Start date input
   * @param end - End date input (defaults to now)
   * @returns Number of days between dates, or 0 if invalid
   */
  static calculateDaysBetween(start: DateInput, end: DateInput = new Date()): number {
    const startDate = this.toDate(start);
    const endDate = this.toDate(end);
    if (!startDate || !endDate) return 0;
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get timestamp for sorting/comparison
   * Returns the timestamp in milliseconds, or 0 if invalid
   * 
   * @param input - Date input of any supported type
   * @returns Timestamp in milliseconds, or 0 if invalid
   */
  static getTimestamp(input: DateInput): number {
    const date = this.toDate(input);
    return date ? date.getTime() : 0;
  }
}

