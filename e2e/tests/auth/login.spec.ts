/**
 * User Login E2E Tests
 */

import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { seedStudent } from '../../fixtures/db-helpers';
import { waitForRoleBasedRedirect } from '../../utils/navigation-helpers';

test.describe('User Login @auth @smoke @critical', () => {
  test('should successfully login with valid credentials @smoke @critical @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';

    await loginPage.goto();
    await loginPage.login(email, password, 'student');

    // Should redirect to authenticated dashboard (handles two-step redirect: '/' → '/authenticated/student')
    await waitForRoleBasedRedirect(page, 'student', 15000);
  });
});

