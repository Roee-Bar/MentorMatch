// types/database.ts
// Database types for MentorMatch - Based on Phase A Requirements

// ============================================
// BASE USER TYPE (stored in 'users' collection)
// ============================================
export interface BaseUser {
  id: string; // Firestore document ID
  email: string;
  name: string;
  role: 'student' | 'supervisor' | 'admin';
  department?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// SESSION/AUTH USER TYPE (for application use)
// ============================================
export type UserRole = 'student' | 'supervisor' | 'admin';

// Session/Auth user type - extends database BaseUser with session-specific fields
export interface User extends Omit<BaseUser, 'createdAt' | 'updatedAt'> {
  // Optional role-specific preview fields for UI
  studentId?: string;
  degree?: string;
  expertise?: string[];
}

// ============================================
// STUDENT TYPE (stored in 'students' collection)
// ============================================
export interface Student {
  id: string; // Document ID from Firestore
 
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  studentId: string;
  phone: string;
  department: string;
  
  // Academic Information
  skills: string; // Comma-separated skills
  interests: string;
  previousProjects?: string;
  preferredTopics?: string;
  
  // Partner Information - NEW PARTNERSHIP SYSTEM
  partnerId?: string;  // Firebase UID of matched partner
  partnershipStatus: 'none' | 'pending_sent' | 'pending_received' | 'paired';
  
  // DEPRECATED - Keep for migration reference only
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
  
  // Status
  profileComplete: boolean;
  matchStatus: 'unmatched' | 'pending' | 'matched';
  assignedSupervisorId?: string;
  assignedProjectId?: string;
  
  // Timestamps
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SUPERVISOR TYPE (stored in 'supervisors' collection)
// ============================================
export interface Supervisor {
  id: string; // Document ID from Firestore
  
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  title: string; // Dr., Prof., etc.
  
  // Professional Information
  bio: string;
  researchInterests: string[]; // Array of research areas
  expertiseAreas: string[]; // Array of expertise
  officeLocation?: string;
  officeHours?: string;
  
  // Capacity Management
  maxCapacity: number; // Maximum projects they can supervise
  currentCapacity: number; // Current number of projects
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  
  // Project Topics (suggestions for students)
  suggestedTopics?: ProjectTopic[];
  
  // Notification Preferences
  notificationPreference: 'immediate' | 'daily' | 'custom';
  notificationHour?: number; // Hour of day for custom notifications (0-23)
  
  // Status
  isApproved: boolean; // Admin approval status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ADMIN TYPE (stored in 'admins' collection)
// ============================================
export interface Admin {
  id: string; // Document ID from Firestore
 
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  
  // Admin Role
  adminRole: 'project_coordinator' | 'department_secretary' | 'system_admin';
  permissions: AdminPermission[];
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type AdminPermission = 
  | 'manage_users'
  | 'manage_supervisors'
  | 'manage_students'
  | 'manage_projects'
  | 'view_reports'
  | 'export_data'
  | 'import_data'
  | 'system_settings';

// ============================================
// PROJECT TOPIC TYPE
// ============================================
export interface ProjectTopic {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isAvailable: boolean;
}

// ============================================
// APPLICATION STATUS TYPE
// ============================================
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

// ============================================
// APPLICATION TYPE (stored in 'applications' collection)
// ============================================
export interface Application {
  id: string;
  
  // Participants
  studentId: string;
  studentName: string;
  studentEmail: string;
  supervisorId: string;
  supervisorName: string;
  
  // Project Details
  projectTitle: string;
  projectDescription: string;
  proposedTopicId?: string; // If selecting from supervisor's topics
  isOwnTopic: boolean; // true if student proposed their own topic
  
  // Student Information (snapshot at time of application)
  studentSkills: string;
  studentInterests: string;
  
  // Partner Information
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
  
  // Project-Based Capacity Tracking
  linkedApplicationId?: string; // References partner's application ID
  isLeadApplication: boolean; // True for the first application in a pair (or solo)
  projectId?: string; // Optional reference to created Project (for future use)
  
  // Status
  status: ApplicationStatus;
  
  // Feedback
  supervisorFeedback?: string;
  
  // Timestamps
  dateApplied: Date;
  lastUpdated: Date;
  responseDate?: Date;
  resubmittedDate?: Date; // When application was last resubmitted
  
  // For display purposes
  responseTime?: string;
}

// ============================================
// PROJECT TYPE (stored in 'projects' collection)
// ============================================
export interface Project {
  id: string;
  projectCode: string; // e.g., "25-2-D-01"
  
  // Participants
  studentIds: string[];
  studentNames: string[];
  supervisorId: string;
  supervisorName: string;
  coSupervisorId?: string;
  coSupervisorName?: string;
  
  // Project Details
  title: string;
  description: string;
  
  // Status
  status: 'pending_approval' | 'approved' | 'in_progress' | 'completed';
  phase: 'A' | 'B';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
}

// ============================================
// HELPER TYPES FOR UI
// ============================================
export interface SupervisorCardData {
  id: string;
  name: string;
  department: string;
  bio: string;
  expertiseAreas: string[];
  researchInterests: string[];
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  currentCapacity: string; // e.g., "2/5 projects"
  contact: string;
}

export interface ApplicationCardData {
  id: string;
  projectTitle: string;
  projectDescription: string;
  supervisorName: string;
  dateApplied: string;
  status: ApplicationStatus;
  responseTime: string;
  comments?: string;
  hasPartner?: boolean;
  partnerName?: string;
  linkedApplicationId?: string;
  isLeadApplication?: boolean;
}

export interface DashboardStats {
  // Existing fields
  totalStudents: number;
  matchedStudents: number;
  pendingMatches: number;
  activeSupervisors: number;
  
  // NEW fields
  totalSupervisors: number;              // Total supervisor accounts
  approvedApplications: number;          // Approved project applications
  pendingApplications: number;           // Pending project applications
  studentsWithoutApprovedApp: number;    // Students without any approved application
  totalAvailableCapacity: number;        // Sum of available supervisor slots
}

// ============================================
// STUDENT PARTNERSHIP TYPES
// ============================================

// Partnership Request Type (stored in 'partnership_requests' collection)
export interface StudentPartnershipRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterStudentId: string;
  requesterDepartment: string;
  targetStudentId: string;
  targetStudentName: string;
  targetStudentEmail: string;
  targetDepartment: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
}

// Student Card Data for UI
export interface StudentCardData {
  id: string;
  fullName: string;
  studentId: string;
  department: string;
  email: string;
  skills: string;
  interests: string;
  preferredTopics?: string;
  previousProjects?: string;
  partnershipStatus: 'none' | 'pending_sent' | 'pending_received' | 'paired';
  partnerId?: string;
}