/**
 * Email Configuration
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Configuration for email messages, subjects, and content.
 */

import type { ApplicationStatus } from '@/types/database';

/**
 * Status message configuration
 * Maps application statuses to email subject and message
 */
export const STATUS_MESSAGES: Record<ApplicationStatus, { subject: string; message: string }> = {
  approved: {
    subject: 'Application Approved',
    message: 'Great news! Your application has been approved.',
  },
  rejected: {
    subject: 'Application Update',
    message: 'Your application has been reviewed.',
  },
  revision_requested: {
    subject: 'Revision Requested',
    message: 'Your application requires some revisions.',
  },
  pending: {
    subject: 'Application Status Update',
    message: 'The status of your application has been updated.',
  },
};

/**
 * Get status message configuration
 * Returns default pending message if status not found
 */
export function getStatusMessage(status: ApplicationStatus): { subject: string; message: string } {
  return STATUS_MESSAGES[status] || STATUS_MESSAGES.pending;
}

