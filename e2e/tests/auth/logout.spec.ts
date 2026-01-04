/**
 * User Logout E2E Tests
 */

import { test, expect } from '../../fixtures/auth';

test.describe('User Logout', () => {
  test('should successfully logout student user', async ({ page, authenticatedStudent }) => {
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/student/);

    // Open user dropdown menu (desktop) or mobile menu
    // Try desktop dropdown first (user avatar button)
    const userMenuButton = page.getByRole('button', { name: /user menu/i });
    const userMenuExists = await userMenuButton.count() > 0;
    
    if (userMenuExists) {
      await userMenuButton.click();
      // Wait for dropdown to be visible
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

  test('should successfully logout supervisor user', async ({ page, authenticatedSupervisor }) => {
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/supervisor/);

    // Open user dropdown menu (desktop) or mobile menu
    const userMenuButton = page.getByRole('button', { name: /user menu/i });
    const userMenuExists = await userMenuButton.count() > 0;
    
    if (userMenuExists) {
      await userMenuButton.click();
      await page.waitForSelector('[role="menu"]', { state: 'visible', timeout: 5000 });
    } else {
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

  test('should successfully logout admin user', async ({ page, authenticatedAdmin }) => {
    // User should be authenticated
    await expect(page).toHaveURL(/\/authenticated\/admin/);

    // Open user dropdown menu (desktop) or mobile menu
    const userMenuButton = page.getByRole('button', { name: /user menu/i });
    const userMenuExists = await userMenuButton.count() > 0;
    
    if (userMenuExists) {
      await userMenuButton.click();
      await page.waitForSelector('[role="menu"]', { state: 'visible', timeout: 5000 });
    } else {
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

