// lib/constants.ts
// Shared constants for the application

/**
 * Department options used across registration and filtering
 */
export const DEPARTMENTS = [
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Software Engineering', label: 'Software Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Industrial Engineering', label: 'Industrial Engineering' },
  { value: 'Biotechnology', label: 'Biotechnology' },
] as const;

/**
 * Department options for filter dropdowns (includes "All" option)
 */
export const DEPARTMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  ...DEPARTMENTS,
];

/**
 * Availability status options for filter dropdowns
 */
export const AVAILABILITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited Capacity' },
] as const;

/**
 * Type for department values
 */
export type Department = typeof DEPARTMENTS[number]['value'];

/**
 * Type for availability status values
 */
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

/**
 * UI timing constants
 */
export const UI_CONSTANTS = {
  MESSAGE_DISPLAY_DURATION: 5000, // ms - how long success/error messages show
} as const;

/**
 * Email verification constants
 */
export const EMAIL_VERIFICATION = {
  RESEND_COOLDOWN_MS: 60 * 60 * 1000, // 1 hour
  MAX_RESENDS: 3,
  STATUS_CHECK_INTERVAL: 5000, // 5 seconds (initial polling interval)
  MAX_POLLING_DURATION_MS: 5 * 60 * 1000, // 5 minutes (maximum time to poll)
  POLLING_BACKOFF_MULTIPLIER: 2, // Double interval each time (exponential backoff)
  MAX_POLLING_INTERVAL_MS: 40 * 1000, // 40 seconds (maximum interval between polls)
} as const;

