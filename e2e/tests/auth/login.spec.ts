/**
 * User Login E2E Tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { expectErrorMessage, expectAuthenticatedDashboard } from '../../utils/assertions';
import { seedStudent } from '../../fixtures/db-helpers';

test.describe('User Login', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';

    await loginPage.goto();
    await loginPage.login(email, password);

    // Should redirect to authenticated dashboard
    await expect(page).toHaveURL(/\/(authenticated|$)/);
  });

  test('should show error with invalid email', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'TestPassword123!');

    // Should show error message
    await expectErrorMessage(page);
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toMatch(/invalid|incorrect|error/i);
  });

  test('should show error with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { student } = await seedStudent();
    const email = student.email;

    await loginPage.goto();
    await loginPage.login(email, 'WrongPassword123!');

    // Should show error message
    await expectErrorMessage(page);
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toMatch(/invalid|incorrect|error|password/i);
  });

  test('should show error when email is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('', 'TestPassword123!');

    // Browser validation should show error or prevent submission
    // Check that we're still on login page or error is shown
    const isOnLoginPage = page.url().includes('/login');
    const hasError = await loginPage.isMessageVisible();
    expect(isOnLoginPage || hasError).toBeTruthy();
  });

  test('should show error when password is empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { student } = await seedStudent();
    const email = student.email;

    await loginPage.goto();
    await loginPage.login(email, '');

    // Browser validation should show error or prevent submission
    const isOnLoginPage = page.url().includes('/login');
    const hasError = await loginPage.isMessageVisible();
    expect(isOnLoginPage || hasError).toBeTruthy();
  });
});

