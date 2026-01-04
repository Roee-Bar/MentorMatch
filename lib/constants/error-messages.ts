/**
 * Error Message Constants
 * 
 * Standardized error messages for API responses
 * Format: ACTION_RESOURCE_ERROR = 'Failed to [action] [resource]'
 */

export const ERROR_MESSAGES = {
  // Supervisor Partnership Errors
  CREATE_PARTNERSHIP_REQUEST: 'Failed to create partnership request',
  RESPOND_TO_REQUEST: 'Failed to respond to request',
  CANCEL_REQUEST: 'Failed to cancel request',
  UNPAIR_CO_SUPERVISOR: 'Failed to unpair co-supervisor',
  GET_PARTNERS: 'Failed to get partners',
  GET_PARTNERSHIPS: 'Failed to get partnerships',
  
  // Project Errors
  UPDATE_PROJECT_STATUS: 'Failed to update project status',
  
  // Validation Errors
  INVALID_REQUEST_DATA: 'Invalid request data',
  PROJECT_ID_REQUIRED: 'Project ID is required',
  INVALID_TYPE_PARAMETER: 'Invalid type parameter. Must be: incoming, outgoing, or all',
  
  // Authorization Errors
  UNAUTHORIZED_VIEW_REQUEST: 'Unauthorized to view this request',
  UNAUTHORIZED_ACCESS_PROJECT: 'Unauthorized to access this project',
  UNAUTHORIZED_CHANGE_STATUS: 'Unauthorized to change project status',
  
  // Resource Not Found
  PARTNERSHIP_REQUEST_NOT_FOUND: 'Partnership request not found',
  PROJECT_NOT_FOUND: 'Project not found',
  
  // Business Logic Errors
  SELF_PARTNERSHIP_BLOCKED: 'You cannot send a partnership request to yourself',
  
  // Email Verification Errors
  VERIFICATION_EXPIRED: 'This verification link has expired. Please request a new verification email.',
  VERIFICATION_INVALID: 'This verification link is invalid or has already been used. Please request a new verification email.',
  VERIFICATION_ALREADY_VERIFIED: 'Your email address has already been verified. You can now log in.',
  VERIFICATION_NETWORK_ERROR: 'A network error occurred while verifying your email. Please check your connection and try again.',
  VERIFICATION_FAILED: 'Failed to verify your email address. Please try again or request a new verification email.',
  VERIFICATION_USER_DISABLED: 'Your account has been disabled. Please contact support for assistance.',
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

