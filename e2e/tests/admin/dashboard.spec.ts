/**
 * Admin Dashboard E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';

test.describe('Admin - Dashboard @admin @smoke', () => {
  test('should display dashboard statistics @smoke @fast', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see dashboard with stats
    await expect(page).toHaveURL(/\/authenticated\/admin/);
    
    // Wait for stat cards to load
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
    
    // Check that we have stat cards
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

