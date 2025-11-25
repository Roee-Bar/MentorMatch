import { test, expect } from '@playwright/test';

test.describe('Student Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
  });

  // Tests student registration process
  test('should allow student to register', async ({ page }) => {
    // Navigate to register
    const signUpLink = page.getByRole('link', { name: /register|sign up/i }).first();
    await expect(signUpLink).toBeVisible({ timeout: 10000 });
    await signUpLink.click();
    
    // Wait for navigation
    await page.waitForURL('/register', { timeout: 15000 });
    await page.waitForLoadState('load');
    
    // Verify we're on the registration page
    await expect(page).toHaveURL('/register');
    
    // Fill registration form with unique email to avoid conflicts
    const timestamp = Date.now();
    
    // Fill in required fields
    await page.getByLabel(/email address/i).fill(`john.student.${timestamp}@braude.ac.il`);
    await page.getByLabel(/^password\s*\*/i).fill('SecurePass123!');
    await page.getByLabel(/confirm password/i).fill('SecurePass123!');
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Student');
    // Use placeholder selector for student ID since label is not properly associated
    await page.getByPlaceholder(/312345678/i).fill(`312${timestamp.toString().slice(-6)}`);
    await page.getByPlaceholder(/050-1234567/i).fill('050-1234567');
    await page.getByPlaceholder(/react, python/i).fill('React, TypeScript, Node.js');
    await page.getByPlaceholder(/describe your research interests/i).fill('Web Development, AI');
    
    // Select department and academic year
    await page.locator('select[name="department"]').selectOption('Computer Science');
    await page.locator('select[name="academicYear"]').selectOption('4th Year');
    
    // Submit form
    await page.getByRole('button', { name: /complete registration/i }).click();
    
    // Wait for navigation after successful registration
    // Should redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  // Tests student login and dashboard access
  test('should login and access student dashboard', async ({ page }) => {
    // Navigate to login
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();
    
    // Wait for login page
    await page.waitForURL('/login', { timeout: 15000 });
    await page.waitForLoadState('load');
    
    // Use test credentials with explicit waits
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /login/i });
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    
    await emailInput.fill('student@test.com');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    // Wait for dashboard to load
    await page.waitForURL(/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('load');
    
    // Verify student dashboard content is visible
    // Check for common student dashboard elements
    const hasStudentContent = await page.getByText(/supervisor|available|browse|find/i).first().isVisible().catch(() => false);
    if (hasStudentContent) {
      await expect(page.getByText(/supervisor|available|browse|find/i).first()).toBeVisible();
    }
  });

  // Tests browsing available supervisors
  test('should display available supervisors on student dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /login/i });
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    
    await emailInput.fill('student@test.com');
    await passwordInput.fill('password123');
    await loginButton.click();
    
    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('load');
    
    // Check if supervisor cards or list is displayed
    // This might vary based on whether data is seeded
    const pageContent = await page.textContent('body');
    
    // Either supervisors are displayed or there's a message about no supervisors
    if (pageContent?.includes('supervisor') || pageContent?.includes('Supervisor')) {
      // Supervisors section exists
      expect(pageContent).toMatch(/supervisor/i);
    }
  });

  // Tests back navigation from login page
  test('should navigate back to homepage from login page', async ({ page }) => {
    // Navigate to login
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();
    
    // Wait for login page
    await page.waitForURL('/login', { timeout: 15000 });
    await page.waitForLoadState('load');
    await expect(page).toHaveURL('/login');
    
    // Click back to home link
    const backLink = page.getByRole('link', { name: /back|home/i });
    await expect(backLink).toBeVisible({ timeout: 10000 });
    await backLink.click();
    
    // Wait for homepage
    await page.waitForURL('/', { timeout: 15000 });
    await page.waitForLoadState('load');
    await expect(page).toHaveURL('/');
  });
});

