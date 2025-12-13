/**
 * Notification Helpers
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Helpers for gathering recipient information for notifications (email, etc.)
 * These functions abstract the logic of finding who should receive notifications.
 */

import { StudentService } from '@/lib/services/students/student-service';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import type { Application } from '@/types/database';

// ============================================
// TYPES
// ============================================

/**
 * Represents notification recipients
 * Used by email service and other notification systems
 */
export interface NotificationRecipients {
  /** Email addresses of recipients */
  emails: string[];
  /** Display names of recipients (same order as emails) */
  names: string[];
}

/**
 * Empty recipients constant for error cases
 */
const EMPTY_RECIPIENTS: NotificationRecipients = {
  emails: [],
  names: [],
};

// ============================================
// APPLICATION RECIPIENTS
// ============================================

/**
 * Get student recipients from an application object
 * Includes partner if the application has one
 * 
 * Use this when you already have the application data
 * (avoids additional DB queries)
 * 
 * @param application - The application object
 * @returns Recipients with student (and optionally partner) info
 */
export function getApplicationStudentRecipients(
  application: Application
): NotificationRecipients {
  const emails: string[] = [application.studentEmail];
  const names: string[] = [application.studentName];

  if (application.hasPartner && application.partnerEmail) {
    emails.push(application.partnerEmail);
    names.push(application.partnerName || 'Partner');
  }

  return { emails, names };
}

// ============================================
// DATABASE-FETCHED RECIPIENTS
// ============================================

/**
 * Get student and partner recipients by fetching from database
 * 
 * Use this when you only have student ID and need current data
 * 
 * @param studentId - The student's Firebase UID
 * @returns Recipients with student (and optionally partner) info
 */
export async function getStudentAndPartnerRecipients(
  studentId: string
): Promise<NotificationRecipients> {
  const student = await StudentService.getStudentById(studentId);
  
  if (!student) {
    return EMPTY_RECIPIENTS;
  }

  const emails: string[] = [student.email];
  const names: string[] = [student.fullName];

  // Check if student has a paired partner
  if (student.partnerId && student.partnershipStatus === 'paired') {
    const partner = await StudentService.getStudentById(student.partnerId);
    if (partner) {
      emails.push(partner.email);
      names.push(partner.fullName);
    }
  }

  return { emails, names };
}

/**
 * Get supervisor recipient by fetching from database
 * 
 * Use this when you only have supervisor ID and need current data
 * 
 * @param supervisorId - The supervisor's Firebase UID
 * @returns Recipients with supervisor info
 */
export async function getSupervisorRecipient(
  supervisorId: string
): Promise<NotificationRecipients> {
  const supervisor = await SupervisorService.getSupervisorById(supervisorId);
  
  if (!supervisor) {
    return EMPTY_RECIPIENTS;
  }

  return {
    emails: [supervisor.email],
    names: [supervisor.fullName],
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Merge multiple recipient lists into one
 * Removes duplicate emails while preserving order
 * 
 * @param recipientLists - Array of NotificationRecipients to merge
 * @returns Merged recipients without duplicate emails
 */
export function mergeRecipients(
  ...recipientLists: NotificationRecipients[]
): NotificationRecipients {
  const seen = new Set<string>();
  const emails: string[] = [];
  const names: string[] = [];

  for (const list of recipientLists) {
    for (let i = 0; i < list.emails.length; i++) {
      const email = list.emails[i].toLowerCase();
      if (!seen.has(email)) {
        seen.add(email);
        emails.push(list.emails[i]);
        names.push(list.names[i]);
      }
    }
  }

  return { emails, names };
}

/**
 * Check if recipients list is empty
 * 
 * @param recipients - Recipients to check
 * @returns true if no recipients
 */
export function hasNoRecipients(recipients: NotificationRecipients): boolean {
  return recipients.emails.length === 0;
}

/**
 * Check if recipients list has entries
 * 
 * @param recipients - Recipients to check
 * @returns true if has at least one recipient
 */
export function hasRecipients(recipients: NotificationRecipients): boolean {
  return recipients.emails.length > 0;
}

