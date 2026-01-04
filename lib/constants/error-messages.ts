/**
 * Error Message Constants
 * 
 * Standardized error messages for API responses
 * Format: ACTION_RESOURCE_ERROR = 'Failed to [action] [resource]'
 */

export const ERROR_MESSAGES = {
  // Supervisor Partnership Errors
  CREATE_PARTNERSHIP_REQUEST: 'Failed to create partnership request. Please try again.',
  RESPOND_TO_REQUEST: 'Failed to respond to request. Please try again.',
  CANCEL_REQUEST: 'Failed to cancel request. Please try again.',
  UNPAIR_CO_SUPERVISOR: 'Failed to unpair co-supervisor. Please try again.',
  GET_PARTNERS: 'Failed to load partners. Please refresh the page.',
  GET_PARTNERSHIPS: 'Failed to load partnerships. Please refresh the page.',
  
  // Project Errors
  UPDATE_PROJECT_STATUS: 'Failed to update project status. Please try again.',
  
  // Validation Errors
  INVALID_REQUEST_DATA: 'The information you provided is invalid. Please check your input and try again.',
  PROJECT_ID_REQUIRED: 'Project ID is required to perform this action.',
  INVALID_TYPE_PARAMETER: 'Invalid type parameter. Must be: incoming, outgoing, or all',
  
  // Authorization Errors
  UNAUTHORIZED_VIEW_REQUEST: 'You do not have permission to view this request.',
  UNAUTHORIZED_ACCESS_PROJECT: 'You do not have permission to access this project.',
  UNAUTHORIZED_CHANGE_STATUS: 'You do not have permission to change the project status.',
  UNAUTHORIZED_GENERIC: 'You do not have permission to perform this action.',
  UNAUTHORIZED_RESOURCE: 'You do not have permission to access this resource.',
  
  // Resource Not Found
  PARTNERSHIP_REQUEST_NOT_FOUND: 'The partnership request you are looking for could not be found.',
  PROJECT_NOT_FOUND: 'The project you are looking for could not be found.',
  APPLICATION_NOT_FOUND: 'The application you are looking for could not be found.',
  STUDENT_NOT_FOUND: 'The student profile you are looking for could not be found.',
  SUPERVISOR_NOT_FOUND: 'The supervisor profile you are looking for could not be found.',
  USER_NOT_FOUND: 'The user you are looking for could not be found.',
  RESOURCE_NOT_FOUND: 'The resource you are looking for could not be found.',
  
  // Business Logic Errors
  SELF_PARTNERSHIP_BLOCKED: 'You cannot send a partnership request to yourself.',
  
  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',
  RATE_LIMIT_VERIFICATION_EMAIL: 'Too many verification email requests. Please wait before requesting another email.',
  RATE_LIMIT_REGISTRATION: 'Too many registration attempts. Please wait before trying again.',
  
  // Email Verification Errors
  VERIFICATION_EXPIRED: 'This verification link has expired. Please request a new verification email.',
  VERIFICATION_INVALID: 'This verification link is invalid or has already been used. Please request a new verification email.',
  VERIFICATION_ALREADY_VERIFIED: 'Your email address has already been verified. You can now log in.',
  VERIFICATION_NETWORK_ERROR: 'A network error occurred while verifying your email. Please check your connection and try again.',
  VERIFICATION_FAILED: 'Failed to verify your email address. Please try again or request a new verification email.',
  VERIFICATION_USER_DISABLED: 'Your account has been disabled. Please contact support for assistance.',
  
  // Authentication Errors
  AUTH_INVALID_TOKEN: 'Your session has expired. Please log in again.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email address before accessing this resource.',
  
  // Server Errors
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  TIMEOUT_ERROR: 'The request took too long to process. Please try again.',
  DATABASE_ERROR: 'A database error occurred. Please try again later.',
  EMAIL_SERVICE_ERROR: 'Failed to send email. Please try again later.',
  
  // Registration Errors
  REGISTRATION_EMAIL_EXISTS: 'This email address is already registered. Please try logging in instead.',
  REGISTRATION_INVALID_EMAIL: 'Please provide a valid email address.',
  REGISTRATION_WEAK_PASSWORD: 'Password is too weak. Please use a stronger password with at least 6 characters.',
  REGISTRATION_FAILED: 'Registration failed. Please check your information and try again.',
} as const;

/**
 * Success message constants
 */
export const SUCCESS_MESSAGES = {
  PARTNERSHIP_REQUEST_SENT: 'Partnership request sent successfully',
  REQUEST_ACCEPTED: 'Request accepted successfully',
  REQUEST_REJECTED: 'Request rejected successfully',
  REQUEST_CANCELLED: 'Request cancelled successfully',
  CO_SUPERVISOR_REMOVED: 'Co-supervisor removed successfully',
  PROJECT_STATUS_UPDATED: 'Project status updated successfully',
  EMAIL_VERIFIED: 'Your email address has been verified successfully! You can now log in.',
  VERIFICATION_EMAIL_SENT: 'Verification email sent successfully. Please check your inbox.',
} as const;

