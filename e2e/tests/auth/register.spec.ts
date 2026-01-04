/**
 * User Registration E2E Tests
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateRegistrationData } from '../../fixtures/test-data';

test.describe('User Registration @auth @smoke', () => {
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
});

