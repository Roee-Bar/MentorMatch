/**
 * User Login E2E Tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { seedStudent } from '../../fixtures/db-helpers';

test.describe('User Login @auth @smoke @critical', () => {
  test('should successfully login with valid credentials @smoke @critical @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user in test process (for reference)
    const { student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';

    // Create user in server process via API so login will work
    const seedResponse = await page.request.post('http://localhost:3000/api/auth/test-seed', {
      data: {
        role: 'student',
        userData: {
          email,
          password,
          fullName: student.fullName,
          department: student.department,
          ...student,
        },
      },
    });
    
    const seedData = await seedResponse.json();
    expect(seedData.success).toBe(true);

    // Navigate to login page
    await loginPage.goto();
    
    // Login
    await loginPage.login(email, password, 'student');

    // Wait for initial redirect to home page
    await page.waitForURL(/\/(login|\/)$/, { timeout: 5000 });
    
    // Wait a bit for auth state to propagate
    await page.waitForTimeout(1000);
    
    // Wait for redirect to student dashboard
    // The login redirects to '/' which then redirects to '/authenticated/student'
    await page.waitForURL(/\/authenticated\/student/, { timeout: 20000 });
    
    // Verify we're on the student dashboard
    await expect(page).toHaveURL(/\/authenticated\/student/);
  });
});
