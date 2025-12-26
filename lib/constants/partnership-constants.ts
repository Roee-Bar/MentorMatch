// lib/constants/partnership-constants.ts
// Constants for partnership-related operations to avoid magic strings

/**
 * Valid partnership request types for filtering requests
 */
export const PARTNERSHIP_REQUEST_TYPES = ['incoming', 'outgoing', 'all'] as const;
export type PartnershipRequestType = typeof PARTNERSHIP_REQUEST_TYPES[number];

/**
 * Valid partnership actions (accept or reject)
 */
export const PARTNERSHIP_ACTIONS = ['accept', 'reject'] as const;
export type PartnershipAction = typeof PARTNERSHIP_ACTIONS[number];

/**
 * Valid project statuses
 */
export const PROJECT_STATUSES = ['pending_approval', 'approved', 'in_progress', 'completed'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

