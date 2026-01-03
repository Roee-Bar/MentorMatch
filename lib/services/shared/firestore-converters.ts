/**
 * Firestore Entity Converters
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Type-safe converters for converting Firestore documents to typed entities.
 * Handles Timestamp to Date conversion and provides proper type inference.
 */

import type { DocumentData } from 'firebase-admin/firestore';
import type {
  Admin,
  BaseUser,
  Student,
  Supervisor,
  Application,
  Project,
  StudentPartnershipRequest,
  SupervisorPartnershipRequest,
} from '@/types/database';

// ============================================
// TIMESTAMP CONVERSION HELPERS
// ============================================

/**
 * Safely convert a Firestore Timestamp to Date
 * Returns undefined if the value is null/undefined or doesn't have toDate()
 */
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return undefined;
}

/**
 * Safely convert a Firestore Timestamp to Date, with a fallback
 * Used for required Date fields
 */
function toDateRequired(value: unknown, fallback: Date = new Date()): Date {
  return toDate(value) ?? fallback;
}

// ============================================
// ENTITY CONVERTERS
// ============================================

/**
 * Convert Firestore document to BaseUser
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toUser(id: string, data: DocumentData): BaseUser {
  return {
    id,
    email: data.email ?? '',
    name: data.name ?? '',
    role: data.role ?? 'student',
    department: data.department,
    createdAt: toDateRequired(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * Convert Firestore document to Student
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toStudent(id: string, data: DocumentData): Student {
  return {
    id,
    // Personal Information
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    studentId: data.studentId ?? '',
    phone: data.phone ?? '',
    department: data.department ?? '',
    // Academic Information
    skills: data.skills ?? '',
    interests: data.interests ?? '',
    previousProjects: data.previousProjects,
    preferredTopics: data.preferredTopics,
    // Partner Information
    partnerId: data.partnerId,
    partnershipStatus: data.partnershipStatus ?? 'none',
    // Deprecated fields
    hasPartner: data.hasPartner ?? false,
    partnerName: data.partnerName,
    partnerEmail: data.partnerEmail,
    // Status
    profileComplete: data.profileComplete ?? false,
    matchStatus: data.matchStatus ?? 'unmatched',
    assignedSupervisorId: data.assignedSupervisorId,
    assignedProjectId: data.assignedProjectId,
    // Timestamps
    registrationDate: toDateRequired(data.registrationDate),
    createdAt: toDateRequired(data.createdAt),
    updatedAt: toDateRequired(data.updatedAt),
  };
}

/**
 * Convert Firestore document to Supervisor
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toSupervisor(id: string, data: DocumentData): Supervisor {
  return {
    id,
    // Personal Information
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    phone: data.phone,
    department: data.department ?? '',
    title: data.title ?? '',
    // Professional Information
    bio: data.bio ?? '',
    researchInterests: Array.isArray(data.researchInterests) ? data.researchInterests : [],
    expertiseAreas: Array.isArray(data.expertiseAreas) ? data.expertiseAreas : [],
    officeLocation: data.officeLocation,
    officeHours: data.officeHours,
    // Capacity Management
    maxCapacity: typeof data.maxCapacity === 'number' ? data.maxCapacity : 5,
    currentCapacity: typeof data.currentCapacity === 'number' ? data.currentCapacity : 0,
    availabilityStatus: data.availabilityStatus ?? 'available',
    // Project Topics
    suggestedTopics: Array.isArray(data.suggestedTopics) ? data.suggestedTopics : undefined,
    // Notification Preferences
    notificationPreference: data.notificationPreference ?? 'immediate',
    notificationHour: data.notificationHour,
    // Status
    isApproved: data.isApproved ?? false,
    isActive: data.isActive ?? true,
    // Timestamps
    createdAt: toDateRequired(data.createdAt),
    updatedAt: toDateRequired(data.updatedAt),
  };
}

/**
 * Convert Firestore document to Application
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toApplication(id: string, data: DocumentData): Application {
  return {
    id,
    // Participants
    studentId: data.studentId ?? '',
    studentName: data.studentName ?? '',
    studentEmail: data.studentEmail ?? '',
    supervisorId: data.supervisorId ?? '',
    supervisorName: data.supervisorName ?? '',
    // Project Details
    projectTitle: data.projectTitle ?? '',
    projectDescription: data.projectDescription ?? '',
    proposedTopicId: data.proposedTopicId,
    isOwnTopic: data.isOwnTopic ?? true,
    // Student Information
    studentSkills: data.studentSkills ?? '',
    studentInterests: data.studentInterests ?? '',
    // Partner Information
    hasPartner: data.hasPartner ?? false,
    partnerName: data.partnerName,
    partnerEmail: data.partnerEmail,
    partnerId: data.partnerId,
    appliedByStudentId: data.appliedByStudentId ?? data.studentId ?? '',
    // Backward compatibility
    linkedApplicationId: data.linkedApplicationId,
    isLeadApplication: data.isLeadApplication ?? true,
    projectId: data.projectId,
    // Status
    status: data.status ?? 'pending',
    // Feedback
    supervisorFeedback: data.supervisorFeedback,
    // Timestamps
    dateApplied: toDateRequired(data.dateApplied),
    lastUpdated: toDateRequired(data.lastUpdated),
    responseDate: toDate(data.responseDate),
    resubmittedDate: toDate(data.resubmittedDate),
    // Display
    responseTime: data.responseTime,
  };
}

/**
 * Convert Firestore document to Project
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toProject(id: string, data: DocumentData): Project {
  return {
    id,
    projectCode: data.projectCode ?? '',
    // Participants
    studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
    studentNames: Array.isArray(data.studentNames) ? data.studentNames : [],
    supervisorId: data.supervisorId ?? '',
    supervisorName: data.supervisorName ?? '',
    coSupervisorId: data.coSupervisorId,
    coSupervisorName: data.coSupervisorName,
    // Project Details
    title: data.title ?? '',
    description: data.description ?? '',
    // Status
    status: data.status ?? 'pending_approval',
    phase: data.phase ?? 'A',
    // Timestamps
    createdAt: toDateRequired(data.createdAt),
    updatedAt: toDateRequired(data.updatedAt),
    approvedAt: toDate(data.approvedAt),
    completedAt: toDate(data.completedAt),
  };
}

/**
 * Convert Firestore document to StudentPartnershipRequest
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toPartnershipRequest(id: string, data: DocumentData): StudentPartnershipRequest {
  return {
    id,
    requesterId: data.requesterId ?? '',
    requesterName: data.requesterName ?? '',
    requesterEmail: data.requesterEmail ?? '',
    requesterStudentId: data.requesterStudentId ?? '',
    requesterDepartment: data.requesterDepartment ?? '',
    targetStudentId: data.targetStudentId ?? '',
    targetStudentName: data.targetStudentName ?? '',
    targetStudentEmail: data.targetStudentEmail ?? '',
    targetDepartment: data.targetDepartment ?? '',
    status: data.status ?? 'pending',
    createdAt: toDateRequired(data.createdAt),
    respondedAt: toDate(data.respondedAt),
  };
}

/**
 * Convert Firestore document to SupervisorPartnershipRequest
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toSupervisorPartnershipRequest(id: string, data: DocumentData): SupervisorPartnershipRequest {
  return {
    id,
    requestingSupervisorId: data.requestingSupervisorId ?? '',
    requestingSupervisorName: data.requestingSupervisorName ?? '',
    targetSupervisorId: data.targetSupervisorId ?? '',
    targetSupervisorName: data.targetSupervisorName ?? '',
    projectId: data.projectId ?? '',
    projectTitle: data.projectTitle ?? '',
    status: data.status ?? 'pending',
    createdAt: toDateRequired(data.createdAt),
    respondedAt: toDate(data.respondedAt),
  };
}

/**
 * Convert Firestore document to Admin
 * @param id - Document ID
 * @param data - Document data from Firestore
 */
export function toAdmin(id: string, data: DocumentData): Admin {
  return {
    id,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    phone: data.phone,
    department: data.department ?? '',
    adminRole: data.adminRole ?? 'project_coordinator',
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    isActive: data.isActive ?? true,
    createdAt: toDateRequired(data.createdAt),
    updatedAt: toDateRequired(data.updatedAt),
  };
}

