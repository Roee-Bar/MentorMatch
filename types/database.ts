// types/database.ts
// Database types for MentorMatch - Based on Phase A Requirements

// ============================================
// BASE USER TYPE (stored in 'users' collection)
// ============================================
export interface BaseUser {
  
  email: string;
  name: string;
  role: 'student' | 'supervisor' | 'admin';
  photoURL?: string;
  department?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// STUDENT TYPE (stored in 'students' collection)
// ============================================
export interface Student {
 
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  studentId: string;
  phone: string;
  department: string;
  academicYear: '3rd Year' | '4th Year' | 'Graduate';
  photoURL?: string;
  
  // Academic Information
  skills: string; // Comma-separated skills
  interests: string;
  previousProjects?: string;
  preferredTopics?: string;
  
  // Partner Information
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
  
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  title: string; // Dr., Prof., etc.
  photoURL?: string;
  
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
 
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  photoURL?: string;
  
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
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

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
  
  // Status
  status: ApplicationStatus;
  
  // Feedback
  supervisorFeedback?: string;
  
  // Timestamps
  dateApplied: Date;
  lastUpdated: Date;
  responseDate?: Date;
  
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
}

export interface DashboardStats {
  totalStudents: number;
  matchedStudents: number;
  pendingMatches: number;
  activeSupervisors: number;
}