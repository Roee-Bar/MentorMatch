/**
 * User Login E2E Tests
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { expectErrorMessage, expectAuthenticatedDashboard } from '../../utils/assertions';
import { seedStudent } from '../../fixtures/db-helpers';
import { waitForStableState, waitForAnimations } from '../../utils/test-stability';

test.describe('User Login @auth @smoke @critical', () => {
  test('should successfully login with valid credentials @smoke @critical @fast', async ({ page }) => {
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

  test('should show error with invalid email @regression @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'TestPassword123!');

    // Should show error message
    await expectErrorMessage(page);
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toMatch(/invalid|incorrect|error/i);
  });

  test('should show error with invalid password @regression @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { student } = await seedStudent();
    const email = student.email;

    await loginPage.goto();
    await loginPage.login(email, 'WrongPassword123!');

    // Should show error message - wait for it with timeout
    // Don't wait for navigation since login will fail
    await expectErrorMessage(page, undefined);
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toMatch(/invalid|incorrect|error|password/i);
  });

  test('should show error when email is empty @regression @ui', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    
    // Try to submit with empty email - browser validation may prevent this
    await page.getByLabel('Password').fill('TestPassword123!');
    
    // Check if email field has required attribute (browser validation)
    const emailInput = page.getByLabel('Email Address');
    const emailRequired = await emailInput.getAttribute('required');
    
    if (emailRequired !== null) {
      // Browser validation will prevent submission
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for browser validation message or check that form didn't submit
      await waitForAnimations(page, undefined, 500);
      
      // Should still be on login page (form didn't submit)
      await expect(page).toHaveURL(/\/login/);
    } else {
      // If no browser validation, try to submit and check for error
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for either error message or stay on login page
      try {
        await expectErrorMessage(page, undefined);
      } catch {
        // If no error message, should still be on login page
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });

  test('should show error when password is empty @regression @ui', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { student } = await seedStudent();
    const email = student.email;

    await loginPage.goto();
    
    // Try to submit with empty password - browser validation may prevent this
    await page.getByLabel('Email Address').fill(email);
    
    // Check if password field has required attribute (browser validation)
    const passwordInput = page.getByLabel('Password');
    const passwordRequired = await passwordInput.getAttribute('required');
    
    if (passwordRequired !== null) {
      // Browser validation will prevent submission
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for browser validation message or check that form didn't submit
      await waitForAnimations(page, undefined, 500);
      
      // Should still be on login page (form didn't submit)
      await expect(page).toHaveURL(/\/login/);
    } else {
      // If no browser validation, try to submit and check for error
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for either error message or stay on login page
      try {
        await expectErrorMessage(page, undefined);
      } catch {
        // If no error message, should still be on login page
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });
});

