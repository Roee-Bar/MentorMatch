/**
 * User Registration E2E Tests
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateRegistrationData } from '../../fixtures/test-data';
import { expectSuccessMessage, expectErrorMessage } from '../../utils/assertions';

test.describe('User Registration', () => {
  test('should successfully register a new student', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const registrationData = generateRegistrationData();

    await registerPage.goto();
    await registerPage.register(registrationData);

    // Should redirect to login page with success message
    await expect(page).toHaveURL('/login');
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toContain('success');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const registrationData = generateRegistrationData({
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
    });

    await registerPage.goto();
    await registerPage.fillForm(registrationData);
    await registerPage.submit();

    // Should show error message
    await expectErrorMessage(page, 'password');
    const message = await registerPage.getMessage();
    expect(message.toLowerCase()).toContain('password');
  });

  test('should show error when password is too short', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const registrationData = generateRegistrationData({
      password: '12345',
      confirmPassword: '12345',
    });

    await registerPage.goto();
    await registerPage.fillForm(registrationData);
    await registerPage.submit();

    // Should show error message
    await expectErrorMessage(page);
    const message = await registerPage.getMessage();
    expect(message.toLowerCase()).toContain('password');
  });

  test('should show error when required fields are missing', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    // Try to submit without filling form
    await registerPage.submit();

    // Browser validation should prevent submission
    // Check that we're still on the register page
    await expect(page).toHaveURL('/register');
  });

  test('should show error when email is already registered', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const registrationData = generateRegistrationData();

    // Register first time
    await registerPage.goto();
    await registerPage.register(registrationData);
    await page.waitForURL('/login');

    // Try to register again with same email
    await registerPage.goto();
    await registerPage.register(registrationData);

    // Should show error
    await expectErrorMessage(page);
    const message = await registerPage.getMessage();
    expect(message.toLowerCase()).toMatch(/email|already|exists/i);
  });
});

