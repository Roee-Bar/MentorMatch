/**
 * User Logout E2E Tests
 */

import { test, expect } from '../../fixtures/auth';

test.describe('User Logout', () => {
  test('should successfully logout student user', async ({ page, authenticatedStudent }) => {
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/student/);

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login or home page
    await expect(page).toHaveURL(/\/(login|$)/);
  });

  test('should successfully logout supervisor user', async ({ page, authenticatedSupervisor }) => {
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/supervisor/);

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login or home page
    await expect(page).toHaveURL(/\/(login|$)/);
  });

  test('should successfully logout admin user', async ({ page, authenticatedAdmin }) => {
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/admin/);

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login or home page
    await expect(page).toHaveURL(/\/(login|$)/);
  });
});

