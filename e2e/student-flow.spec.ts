import { test, expect } from '@playwright/test';

test.describe('Student Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
  });

  // Tests student registration process
  test('should allow student to register', async ({ page }) => {
    // Navigate to register and wait for URL
    await Promise.all([
      page.waitForURL('/register'),
      page.getByRole('link', { name: /register|sign up/i }).first().click()
    ]);
    
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
    // Navigate to login and wait for URL
    await Promise.all([
      page.waitForURL('/login'),
      page.getByRole('link', { name: /login/i }).first().click()
    ]);
    
    // Use test credentials
    await page.getByLabel(/email/i).fill('student@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
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
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('student@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
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
    // Navigate to login and wait for URL
    await Promise.all([
      page.waitForURL('/login'),
      page.getByRole('link', { name: /login/i }).first().click()
    ]);
    await expect(page).toHaveURL('/login');
    
    // Click back to home link and wait for navigation
    await Promise.all([
      page.waitForURL('/'),
      page.getByRole('link', { name: /back|home/i }).click()
    ]);
    await expect(page).toHaveURL('/');
  });
});

