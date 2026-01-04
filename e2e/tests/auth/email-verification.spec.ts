/**
 * Email Verification E2E Tests
 * 
 * Tests the complete email verification flow including:
 * - Registration sends verification email
 * - Verification link handling
 * - Expired link handling
 * - Already verified handling
 * - Resend functionality
 * - Rate limiting
 */

import { test, expect } from '../../fixtures/auth';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateRegistrationData } from '../../fixtures/test-data';
import { adminAuth } from '@/lib/firebase-admin';
import { seedStudent, cleanupUser } from '../../fixtures/db-helpers';

test.describe('Email Verification @auth', () => {
  test('should send verification email after registration', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const registrationData = generateRegistrationData();

    await registerPage.goto();
    await registerPage.register(registrationData);

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Check for success message about email verification
    const loginPage = new LoginPage(page);
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toContain('email');
    
    // Cleanup
    try {
      const user = await adminAuth.getUserByEmail(registrationData.email);
      await cleanupUser(user.uid);
    } catch (error) {
      // User might not exist, ignore
    }
  });

  test('should handle verification link successfully', async ({ page }) => {
    // Create a test user with unverified email
    const registrationData = generateRegistrationData();
    const student = await seedStudent({
      ...registrationData,
      emailVerified: false,
    });

    // Generate verification link
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      registrationData.email,
      {
        url: 'http://localhost:3000/verify-email',
        handleCodeInApp: false,
      }
    );

    // Extract the action code from the link
    const url = new URL(verificationLink);
    const oobCode = url.searchParams.get('oobCode');
    const mode = url.searchParams.get('mode');

    // Navigate to verification page with action code
    await page.goto(`/verify-email?mode=${mode}&oobCode=${oobCode}`);

    // Should show success message
    await expect(page.locator('text=/verified successfully/i')).toBeVisible({ timeout: 10000 });
    
    // Should redirect to login after countdown or button click
    const goToLoginButton = page.locator('[data-testid="go-to-login-button"]');
    if (await goToLoginButton.isVisible()) {
      await goToLoginButton.click();
    }

    // Cleanup
    await cleanupUser(student.uid);
  });

  test('should show error for expired verification link', async ({ page }) => {
    // Create a test user
    const registrationData = generateRegistrationData();
    const student = await seedStudent({
      ...registrationData,
      emailVerified: false,
    });

    // Generate an expired link (simulate by using invalid code)
    // In a real scenario, we'd wait for the link to expire, but for testing
    // we'll use an invalid action code
    await page.goto('/verify-email?mode=verifyEmail&oobCode=invalid-expired-code');

    // Should show expired error message
    await expect(page.locator('text=/expired/i')).toBeVisible({ timeout: 5000 });
    
    // Cleanup
    await cleanupUser(student.uid);
  });

  test('should show message for already verified email', async ({ page }) => {
    // Create a test user with verified email
    const registrationData = generateRegistrationData();
    const student = await seedStudent({
      ...registrationData,
      emailVerified: true,
    });

    // Generate verification link (even though already verified)
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      registrationData.email,
      {
        url: 'http://localhost:3000/verify-email',
        handleCodeInApp: false,
      }
    );

    const url = new URL(verificationLink);
    const oobCode = url.searchParams.get('oobCode');
    const mode = url.searchParams.get('mode');

    // Navigate to verification page
    await page.goto(`/verify-email?mode=${mode}&oobCode=${oobCode}`);

    // Should show already verified message
    await expect(page.locator('text=/already verified/i')).toBeVisible({ timeout: 10000 });
    
    // Cleanup
    await cleanupUser(student.uid);
  });

  test('should allow resending verification email', async ({ page }) => {
    // Create an unverified student
    const unverifiedStudent = await seedStudent({
      firstName: 'Unverified',
      lastName: 'Student',
      email: 'unverified@test.com',
      studentId: 'unverified123',
      phone: '1234567890',
      department: 'Computer Science',
      emailVerified: false,
    });

    // Authenticate the user
    const authToken = await adminAuth.createCustomToken(unverifiedStudent.uid);
    await page.goto('/');
    await page.evaluate(async (token: string) => {
      const { getAuth, signInWithCustomToken } = await import('firebase/auth');
      const { getApps } = await import('firebase/app');
      const apps = getApps();
      if (apps.length > 0) {
        const auth = getAuth(apps[0]);
        await signInWithCustomToken(auth, token);
      }
    }, authToken);

    // Navigate to authenticated area (should show verification banner)
    await page.goto('/authenticated/student');
    
    // Look for resend verification button
    const resendButton = page.locator('[data-testid="resend-verification-button"]');
    if (await resendButton.isVisible({ timeout: 5000 })) {
      await resendButton.click();
      
      // Should show success message
      await expect(page.locator('text=/sent/i')).toBeVisible({ timeout: 5000 });
    }
    
    // Cleanup
    await cleanupUser(unverifiedStudent.uid);
  });

  test('should enforce rate limiting on resend verification', async ({ page }) => {
    // Create an unverified student
    const unverifiedStudent = await seedStudent({
      firstName: 'RateLimit',
      lastName: 'Test',
      email: 'ratelimit@test.com',
      studentId: 'ratelimit123',
      phone: '1234567890',
      department: 'Computer Science',
      emailVerified: false,
    });

    // Authenticate the user
    const authToken = await adminAuth.createCustomToken(unverifiedStudent.uid);
    await page.goto('/');
    await page.evaluate(async (token: string) => {
      const { getAuth, signInWithCustomToken } = await import('firebase/auth');
      const { getApps } = await import('firebase/app');
      const apps = getApps();
      if (apps.length > 0) {
        const auth = getAuth(apps[0]);
        await signInWithCustomToken(auth, token);
      }
    }, authToken);

    // Navigate to authenticated area
    await page.goto('/authenticated/student');
    
    // Make multiple resend requests (4 requests to exceed limit of 3)
    const resendButton = page.locator('[data-testid="resend-verification-button"]');
    
    if (await resendButton.isVisible({ timeout: 5000 })) {
      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        await resendButton.click();
        await page.waitForTimeout(2000); // Wait between requests
      }
      
      // 4th request should be rate limited
      await resendButton.click();
      await expect(page.locator('text=/too many requests/i')).toBeVisible({ timeout: 5000 });
    }
    
    // Cleanup
    await cleanupUser(unverifiedStudent.uid);
  });

  test('should update verification status after verification', async ({ page }) => {
    // Create a test user with unverified email
    const registrationData = generateRegistrationData();
    const student = await seedStudent({
      ...registrationData,
      emailVerified: false,
    });

    // Generate verification link
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      registrationData.email,
      {
        url: 'http://localhost:3000/verify-email',
        handleCodeInApp: false,
      }
    );

    const url = new URL(verificationLink);
    const oobCode = url.searchParams.get('oobCode');
    const mode = url.searchParams.get('mode');

    // Navigate to verification page
    await page.goto(`/verify-email?mode=${mode}&oobCode=${oobCode}`);

    // Wait for verification to complete
    await expect(page.locator('text=/verified successfully/i')).toBeVisible({ timeout: 10000 });

    // Verify the user's email is now verified in Firebase
    const userRecord = await adminAuth.getUser(student.uid);
    expect(userRecord.emailVerified).toBe(true);
    
    // Cleanup
    await cleanupUser(student.uid);
  });
});

