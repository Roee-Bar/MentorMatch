/**
 * User Login E2E Tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { seedStudent } from '../../fixtures/db-helpers';

test.describe('User Login @auth @smoke @critical', () => {
  test('should successfully login with valid credentials @smoke @critical @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { uid, student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';

    // Navigate to login page
    await loginPage.goto();
    
    // Login
    await loginPage.login(email, password, 'student');

    // Wait for redirect to complete
    // The login redirects to '/' which then redirects to '/authenticated/student'
    await page.waitForURL(/\/authenticated\/student/, { timeout: 15000 });
    
    // Verify we're on the student dashboard
    await expect(page).toHaveURL(/\/authenticated\/student/);
  });
});
