/**
 * User Login E2E Tests
 */

import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { seedStudent } from '../../fixtures/db-helpers';
import { waitForRoleBasedRedirect } from '../../utils/navigation-helpers';
import { adminAuth } from '@/lib/firebase-admin';

test.describe('User Login @auth @smoke @critical', () => {
  test('should successfully login with valid credentials @smoke @critical @fast', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Create test user
    const { uid, student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';

    // Verify user was created in Firebase Auth (wait for emulator to sync)
    // This helps avoid "user not found" errors due to timing issues
    let userExists = false;
    for (let i = 0; i < 5; i++) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        if (userRecord && userRecord.email === email) {
          userExists = true;
          break;
        }
      } catch (error) {
        // User not found yet, wait and retry
      }
      await page.waitForTimeout(500);
    }

    if (!userExists) {
      throw new Error(`User ${email} was not created in Firebase Auth after multiple attempts`);
    }

    await loginPage.goto();
    await loginPage.login(email, password, 'student');

    // Should redirect to authenticated dashboard (handles two-step redirect: '/' → '/authenticated/student')
    await waitForRoleBasedRedirect(page, 'student', 15000);
  });
});

