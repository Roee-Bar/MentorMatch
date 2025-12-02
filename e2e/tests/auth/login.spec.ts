import { test, expect } from '@playwright/test';
import { TEST_STUDENTS, TEST_SUPERVISORS, INVALID_CREDENTIALS } from '../../utils/test-data';

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should login successfully as a student', async ({ page }) => {
    // Fill in student credentials (Sarah Cohen)
    await page.fill('input[name="email"]', TEST_STUDENTS.sarahCohen.email);
    await page.fill('input[name="password"]', TEST_STUDENTS.sarahCohen.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to student dashboard
    await page.waitForURL(/\/authenticated\/student/, { timeout: 10000 });

    // Verify we're on the student dashboard
    await expect(page).toHaveURL(/\/authenticated\/student/);

    // Verify student dashboard elements are visible
    // Check for heading or key elements that indicate we're logged in
    await expect(page.locator('body')).toContainText('Student Dashboard', { timeout: 10000 });
  });

  test('should login successfully as a supervisor', async ({ page }) => {
    // Fill in supervisor credentials (Dr. Naomi Unkelos-Shpigel)
    await page.fill('input[name="email"]', TEST_SUPERVISORS.naomiUnkelos.email);
    await page.fill('input[name="password"]', TEST_SUPERVISORS.naomiUnkelos.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to supervisor dashboard
    await page.waitForURL(/\/authenticated\/supervisor/, { timeout: 10000 });

    // Verify we're on the supervisor dashboard
    await expect(page).toHaveURL(/\/authenticated\/supervisor/);

    // Verify supervisor dashboard elements are visible
    await expect(page.locator('body')).toContainText('Supervisor Dashboard', { timeout: 10000 });
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="email"]', INVALID_CREDENTIALS.email);
    await page.fill('input[name="password"]', INVALID_CREDENTIALS.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait a moment for error message to appear
    await page.waitForTimeout(2000);

    // Verify error message appears
    const errorMessage = page.locator('text=/error|invalid|wrong|incorrect/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Verify user stays on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to registration page from login', async ({ page }) => {
    // Click on "Sign up as Student" link
    await page.click('a[href="/register"]');

    // Verify navigation to register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[name="email"]', TEST_STUDENTS.sarahCohen.email);
    await page.fill('input[name="password"]', TEST_STUDENTS.sarahCohen.password);

    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');

    // The button text should change to "Logging in..."
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText(/logging in/i, { timeout: 1000 });
  });

  test('should have proper form validation attributes', async ({ page }) => {
    // Check email input has proper attributes
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');

    // Check password input has proper attributes
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });
});

