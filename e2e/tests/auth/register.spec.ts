/**
 * User Registration E2E Tests
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateRegistrationData } from '../../fixtures/test-data';
import { adminAuth } from '@/lib/firebase-admin';
import { cleanupUser } from '../../fixtures/db-helpers';

test.describe('User Registration @auth @smoke', () => {
  test('should successfully register a new student @smoke @fast', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const registrationData = generateRegistrationData();

    await registerPage.goto();
    await registerPage.register(registrationData);

    // Check for redirect to login page
    const redirected = await page.url().includes('/login');
    
    if (!redirected) {
      // Fallback: Verify user was created via API
      try {
        await page.waitForTimeout(2000); // Wait for registration to complete
        const user = await adminAuth.getUserByEmail(registrationData.email);
        expect(user, 'User should be created after registration').toBeTruthy();
        expect(user.emailVerified, 
          `Expected email to be unverified but got emailVerified=${user.emailVerified}`
        ).toBe(false);
        // Test passes if user was created
        await cleanupUser(user.uid);
        return;
      } catch (error: any) {
        // If user doesn't exist, test fails
        throw new Error(`Registration failed: User was not created. Error: ${error?.message || error}`);
      }
    }

    // If redirected, check for success message
    const messageVisible = await loginPage.isMessageVisible().catch(() => false);
    
    if (messageVisible) {
      const message = await loginPage.getMessage();
      expect(message.toLowerCase()).toContain('success');
    } else {
      // Fallback: Verify user was created
      const user = await adminAuth.getUserByEmail(registrationData.email);
      expect(user, 'User should be created after registration').toBeTruthy();
      expect(user.emailVerified, 
        `Expected email to be unverified but got emailVerified=${user.emailVerified}`
      ).toBe(false);
    }
    
    // Cleanup
    try {
      const user = await adminAuth.getUserByEmail(registrationData.email);
      await cleanupUser(user.uid);
    } catch (error) {
      // User might not exist, ignore
    }
  });
});

