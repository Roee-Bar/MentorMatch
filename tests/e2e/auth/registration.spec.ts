import { test, expect } from '@playwright/test';

test.describe('Authentication - Registration', () => {
  test('TC-AUTH-006: Registration - New Student', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);

    // Fill account information
    const timestamp = Date.now();
    const testEmail = `test.student.${timestamp}@e.braude.ac.il`;
    const testPassword = 'Test123!';

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Fill personal information
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Student');
    await page.fill('input[name="studentId"]', `312${timestamp.toString().slice(-6)}`);
    await page.fill('input[name="phone"]', '050-1234567');
    await page.selectOption('select[name="department"]', 'Software Engineering');

    // Fill academic information
    await page.fill('input[name="skills"]', 'React, TypeScript, Node.js');
    await page.fill('textarea[name="interests"]', 'Web development and full-stack applications');
    await page.fill('textarea[name="previousProjects"]', 'E-commerce platform');
    await page.fill('input[name="preferredTopics"]', 'Web Development, AI');

    // Don't check hasPartner for this test
    // Submit form
    const responsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/auth/register') || url.includes('/api/users');
      },
      { timeout: 15000 }
    );

    await page.click('button[type="submit"]');

    // Wait for response
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    // Wait for success message
    await page.waitForSelector('text=/successful|verification/i', { timeout: 10000 });

    // Verify redirect to verify-email or login page
    await expect(page).toHaveURL(/\/(verify-email|login)/, { timeout: 10000 });
  });
});

