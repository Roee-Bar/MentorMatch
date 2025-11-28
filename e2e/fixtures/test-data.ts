/**
 * Test credentials and data for E2E tests
 * 
 * Note: These test accounts should be created in your Firebase test environment
 * before running E2E tests. You can use the seed data functionality to create them.
 */

export const TEST_USERS = {
  student: {
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    name: 'Test Student',
    studentId: 'S001',
  },
  supervisor: {
    email: 'supervisor@test.com',
    password: 'password123',
    role: 'supervisor',
    name: 'Test Supervisor',
    department: 'Computer Science',
    specialization: 'Machine Learning',
    maxStudents: 5,
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    name: 'Test Admin',
  },
};

/**
 * Additional test users for multi-user scenarios
 */
export const ADDITIONAL_TEST_USERS = {
  student2: {
    email: 'student2@test.com',
    password: 'password123',
    role: 'student',
    name: 'Second Test Student',
    studentId: 'S002',
  },
  supervisor2: {
    email: 'supervisor2@test.com',
    password: 'password123',
    role: 'supervisor',
    name: 'Second Test Supervisor',
    department: 'Software Engineering',
    specialization: 'Web Development',
    maxStudents: 3,
  },
};

/**
 * Test application data
 */
export const TEST_APPLICATION = {
  projectTitle: 'E2E Test Project',
  projectDescription: 'This is a test project for E2E testing',
  expectedOutcomes: 'Test outcomes',
  methodology: 'Agile methodology',
};

/**
 * Helper function to generate unique email for registration tests
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  return `${prefix}.${timestamp}@braude.ac.il`;
}

/**
 * Helper function to generate unique student ID
 */
export function generateUniqueStudentId(): string {
  const timestamp = Date.now();
  return `S${timestamp.toString().slice(-6)}`;
}

/**
 * Test application form data for submission tests
 */
export const TEST_APPLICATION_FORM = {
  projectTitle: 'AI-Powered Learning Platform',
  projectDescription: 'Development of an intelligent tutoring system using machine learning algorithms to provide personalized learning experiences for students.',
  skills: 'Python, TensorFlow, React',
  interests: 'Machine Learning, Education Technology',
};

