/**
 * Test data generators and helpers
 */

/**
 * Generate unique test identifier with timestamp and random suffix
 * This helps identify and clean up test data
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate test session ID for tracking all data created in a test
 * Use this to mark test data for cleanup
 */
export function generateTestSessionId(): string {
  return `test-session-${Date.now()}`;
}

/**
 * Generate test application data
 */
export function generateApplicationData(overrides?: Partial<{
  title: string;
  description: string;
  supervisorId: string;
}>) {
  return {
    title: overrides?.title || `Test Application ${generateTestId()}`,
    description: overrides?.description || 'This is a test application description.',
    supervisorId: overrides?.supervisorId || '',
  };
}

/**
 * Generate test partnership request data
 */
export function generatePartnershipRequestData(targetStudentId: string) {
  return {
    targetStudentId,
  };
}

