/**
 * Test Data Generators
 * 
 * Utility functions to generate test data for e2e tests.
 * These functions create realistic test data that matches the application's data structures.
 */

import type { RegistrationData, Student, Supervisor, Admin, Application, Project } from '@/types/database';

/**
 * Generate a unique email address for testing
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@test.example.com`;
}

/**
 * Generate test registration data
 */
export function generateRegistrationData(overrides?: Partial<RegistrationData>): RegistrationData {
  const email = generateTestEmail('student');
  return {
    email,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Student',
    studentId: `ST${Date.now()}`,
    phone: '050-1234567',
    department: 'Computer Science',
    skills: 'JavaScript, TypeScript, React',
    interests: 'Web Development, Machine Learning',
    previousProjects: 'E-commerce website',
    preferredTopics: 'Full-stack development',
    ...overrides,
  };
}

/**
 * Generate test student data (for Firestore)
 */
export function generateStudentData(overrides?: Partial<Student>): Omit<Student, 'id'> {
  const firstName = overrides?.firstName || 'Test';
  const lastName = overrides?.lastName || 'Student';
  const email = overrides?.email || generateTestEmail('student');
  const now = new Date();

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    studentId: overrides?.studentId || `ST${Date.now()}`,
    phone: overrides?.phone || '050-1234567',
    department: overrides?.department || 'Computer Science',
    skills: overrides?.skills || 'JavaScript, TypeScript, React',
    interests: overrides?.interests || 'Web Development',
    previousProjects: overrides?.previousProjects || '',
    preferredTopics: overrides?.preferredTopics || '',
    partnerId: overrides?.partnerId || undefined,
    partnershipStatus: 'none',
    hasPartner: false,
    partnerName: '',
    partnerEmail: '',
    profileComplete: true,
    matchStatus: 'unmatched',
    registrationDate: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Generate test supervisor data (for Firestore)
 */
export function generateSupervisorData(overrides?: Partial<Supervisor>): Omit<Supervisor, 'id'> {
  const firstName = overrides?.firstName || 'Dr. Test';
  const lastName = overrides?.lastName || 'Supervisor';
  const email = overrides?.email || generateTestEmail('supervisor');
  const now = new Date();

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    phone: overrides?.phone || '050-9876543',
    department: overrides?.department || 'Computer Science',
    title: overrides?.title || 'Dr.',
    bio: overrides?.bio || 'Experienced supervisor in software engineering',
    researchInterests: overrides?.researchInterests || ['Machine Learning', 'Web Development'],
    expertiseAreas: overrides?.expertiseAreas || ['JavaScript', 'Python'],
    officeLocation: overrides?.officeLocation || 'Building A, Room 101',
    officeHours: overrides?.officeHours || 'Monday-Friday, 10:00-12:00',
    maxCapacity: overrides?.maxCapacity ?? 5,
    currentCapacity: overrides?.currentCapacity ?? 0,
    availabilityStatus: overrides?.availabilityStatus || 'available',
    suggestedTopics: overrides?.suggestedTopics || [],
    notificationPreference: 'immediate',
    isApproved: overrides?.isApproved ?? true,
    isActive: overrides?.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Generate test admin data (for Firestore)
 */
export function generateAdminData(overrides?: Partial<Admin>): Omit<Admin, 'id'> {
  const firstName = overrides?.firstName || 'Test';
  const lastName = overrides?.lastName || 'Admin';
  const email = overrides?.email || generateTestEmail('admin');
  const now = new Date();

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    phone: overrides?.phone || '050-1111111',
    department: overrides?.department || 'Computer Science',
    adminRole: overrides?.adminRole || 'system_admin',
    permissions: overrides?.permissions || [
      'manage_users',
      'manage_supervisors',
      'manage_students',
      'manage_projects',
      'view_reports',
    ],
    isActive: overrides?.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Generate test application data (for Firestore)
 */
export function generateApplicationData(
  studentId: string,
  supervisorId: string,
  overrides?: Partial<Application>
): Omit<Application, 'id'> {
  const now = new Date();

  return {
    studentId,
    studentName: overrides?.studentName || 'Test Student',
    studentEmail: overrides?.studentEmail || generateTestEmail('student'),
    supervisorId,
    supervisorName: overrides?.supervisorName || 'Dr. Test Supervisor',
    projectTitle: overrides?.projectTitle || 'Test Project Title',
    projectDescription: overrides?.projectDescription || 'Test project description',
    isOwnTopic: overrides?.isOwnTopic ?? true,
    studentSkills: overrides?.studentSkills || 'JavaScript, TypeScript',
    studentInterests: overrides?.studentInterests || 'Web Development',
    hasPartner: overrides?.hasPartner ?? false,
    appliedByStudentId: overrides?.appliedByStudentId || studentId,
    isLeadApplication: true,
    status: overrides?.status || 'pending',
    dateApplied: now,
    lastUpdated: now,
    ...overrides,
  };
}

/**
 * Generate test project data (for Firestore)
 */
export function generateProjectData(overrides?: Partial<Project>): Omit<Project, 'id'> {
  const now = new Date();
  
  // Generate project code if not provided
  let projectCode = overrides?.projectCode;
  if (!projectCode) {
    const year = new Date().getFullYear();
    const semester = Math.floor((new Date().getMonth() + 1) / 7) + 1; // 1 or 2
    const deptCode = 'C'; // Default to Computer Science
    const number = Math.floor(Math.random() * 99) + 1;
    projectCode = `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  }

  return {
    projectCode,
    studentIds: overrides?.studentIds || [],
    studentNames: overrides?.studentNames || [],
    supervisorId: overrides?.supervisorId || '',
    supervisorName: overrides?.supervisorName || 'Dr. Test Supervisor',
    coSupervisorId: overrides?.coSupervisorId || undefined,
    coSupervisorName: overrides?.coSupervisorName || undefined,
    title: overrides?.title || 'Test Project Title',
    description: overrides?.description || 'Test project description',
    status: overrides?.status || 'in_progress',
    phase: overrides?.phase || 'A',
    createdAt: now,
    updatedAt: now,
    approvedAt: overrides?.approvedAt || (overrides?.status === 'approved' || overrides?.status === 'in_progress' || overrides?.status === 'completed' ? now : undefined),
    completedAt: overrides?.completedAt || (overrides?.status === 'completed' ? now : undefined),
    ...overrides,
  };
}

