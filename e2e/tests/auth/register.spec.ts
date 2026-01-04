/**
 * User Registration E2E Tests
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateRegistrationData } from '../../fixtures/test-data';
import { expectErrorMessage } from '../../utils/assertions';

test.describe('User Registration @auth @smoke @regression', () => {
  test('should successfully register a new student @smoke @fast', async ({ page }) => {
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

  test('should show error when password validation fails @regression @ui @fast', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    // Test password mismatch
    const registrationData1 = generateRegistrationData({
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
    });

    await registerPage.goto();
    await registerPage.fillForm(registrationData1);
    await registerPage.submit();

    await expectErrorMessage(page, 'password');
    const message1 = await registerPage.getMessage();
    expect(message1.toLowerCase()).toContain('password');

    // Test password too short
    const registrationData2 = generateRegistrationData({
      password: '12345',
      confirmPassword: '12345',
    });

    await registerPage.goto();
    await registerPage.fillForm(registrationData2);
    await registerPage.submit();

    await expectErrorMessage(page);
    const message2 = await registerPage.getMessage();
    expect(message2.toLowerCase()).toContain('password');
  });

  test('should show error when email is already registered @regression @api @fast', async ({ page }) => {
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

