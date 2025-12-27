import { test, expect } from '@playwright/test';
import { loginAs } from '../../utils/setup';

test.describe('Authentication - Logout', () => {
  test('TC-AUTH-005: Logout', async ({ page }) => {
    // Login as any user
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/authenticated\/admin/);

    // Find and click user menu/logout button
    // Look for common logout patterns: user menu, dropdown, or logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]').first();
    
    // If logout is in a dropdown, we might need to click the user menu first
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Menu"), .user-menu').first();
    
    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(500);
    }

    // Click logout
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Fallback: try to find any logout link/button
      const anyLogout = page.locator('text=/logout/i').first();
      if (await anyLogout.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyLogout.click();
      }
    }

    // Wait for redirect to home or login
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
  });
});

