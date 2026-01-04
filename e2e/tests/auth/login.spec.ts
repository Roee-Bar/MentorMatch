/**
 * User Login and Logout E2E Tests
 */

import { test, expect } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth';
import { LoginPage } from '../../pages/LoginPage';
import { expectErrorMessage } from '../../utils/assertions';
import { seedStudent } from '../../fixtures/db-helpers';
import { waitForAnimations } from '../../utils/test-stability';
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

  test('should show error with invalid credentials @regression @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Test with invalid email
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'TestPassword123!');
    await expectErrorMessage(page);
    const message1 = await loginPage.getMessage();
    expect(message1.toLowerCase()).toMatch(/invalid|incorrect|error/i);

    // Test with invalid password (create user first)
    const { student } = await seedStudent();
    await loginPage.goto();
    await loginPage.login(student.email, 'WrongPassword123!');
    await expectErrorMessage(page, undefined);
    const message2 = await loginPage.getMessage();
    expect(message2.toLowerCase()).toMatch(/invalid|incorrect|error|password/i);
  });

  test('should show error when fields are empty @regression @ui', async ({ page }) => {
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

    // Test empty password
    const { student } = await seedStudent();
    await loginPage.goto();
    await page.getByLabel('Email Address').fill(student.email);
    
    const passwordInput = page.getByLabel('Password');
    const passwordRequired = await passwordInput.getAttribute('required');
    
    if (passwordRequired !== null) {
      await page.locator('[data-testid="login-button"]').click();
      await waitForAnimations(page, undefined, 500);
      await expect(page).toHaveURL(/\/login/);
    } else {
      await page.locator('[data-testid="login-button"]').click();
      try {
        await expectErrorMessage(page, undefined);
      } catch {
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });

  test('should successfully logout user @regression @fast', async ({ page }) => {
    // Use authenticated student fixture (pattern works for all roles)
    const { authenticatedStudent } = await authTest.use({ page });
    
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/student/);

    // Open user dropdown menu (desktop) or mobile menu
    const userMenuButton = page.getByRole('button', { name: /user menu/i });
    const userMenuExists = await userMenuButton.count() > 0;
    
    if (userMenuExists) {
      await userMenuButton.click();
      await page.waitForSelector('[role="menu"]', { state: 'visible', timeout: 5000 });
    } else {
      // Try mobile menu
      const mobileMenuButton = page.getByRole('button', { name: /open menu/i });
      if (await mobileMenuButton.count() > 0) {
        await mobileMenuButton.click();
        await page.waitForSelector('.mobile-menu-open', { state: 'visible', timeout: 5000 });
      }
    }

    // Find and click logout button inside the menu
    const logoutButton = page.getByRole('menuitem', { name: /logout/i });
    await logoutButton.click();

    // Should redirect to login or home page
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
  });
});

