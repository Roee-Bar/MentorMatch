/**
 * Test data generators and helpers
 */

/**
 * Generate unique test identifier
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

