/**
 * User Login E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { authenticatedRequest } from '../../utils/auth-helpers';

test.describe('User Login @auth @smoke @critical', () => {
  test('should successfully authenticate and access student dashboard @smoke @critical @fast @failing', async ({ page, authenticatedStudent }) => {
    // Auth fixture already handles authentication
    // Verify we're on the student dashboard
    await expect(page).toHaveURL(/\/authenticated\/student/);
    
    // Verify authentication via API as fallback
    const response = await authenticatedRequest(page, 'GET', `/api/users/${authenticatedStudent.uid}`);
    if (!response.ok()) {
      const status = response.status();
      const errorText = await response.text().catch(() => 'Unable to read error response');
      throw new Error(`API verification failed: ${status} - ${errorText}`);
    }
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('email', authenticatedStudent.email);
    expect(data.data).toHaveProperty('role', 'student');
  });
});
