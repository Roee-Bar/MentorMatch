/**
 * Protected Routes E2E Tests
 */

import { test, expect } from '@playwright/test';
import { expectRedirectToLogin } from '../../utils/assertions';

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing student dashboard without auth', async ({ page }) => {
    await page.goto('/authenticated/student');
    // Wait for navigation to complete - protected routes redirect to '/' instead of '/login'
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
    await expectRedirectToLogin(page);
  });

  test('should redirect to login when accessing supervisor dashboard without auth', async ({ page }) => {
    await page.goto('/authenticated/supervisor');
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
    await expectRedirectToLogin(page);
  });

  test('should redirect to login when accessing admin dashboard without auth', async ({ page }) => {
    await page.goto('/authenticated/admin');
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
    await expectRedirectToLogin(page);
  });

  test('should redirect to login when accessing student applications without auth', async ({ page }) => {
    await page.goto('/authenticated/student/applications');
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
    await expectRedirectToLogin(page);
  });

  test('should redirect to login when accessing supervisor applications without auth', async ({ page }) => {
    await page.goto('/authenticated/supervisor/applications');
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
    await expectRedirectToLogin(page);
  });

  test('should allow access to public routes without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
  });
});

