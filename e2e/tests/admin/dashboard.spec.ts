/**
 * Admin Dashboard E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';

test.describe('Admin - Dashboard', () => {
  test('should display dashboard statistics', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see dashboard with stats
    await expect(page).toHaveURL(/\/authenticated\/admin/);
    
    // Check for stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display students table', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see students table
    await expect(dashboard.studentsTable).toBeVisible({ timeout: 10000 });
  });

  test('should display supervisors table', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see supervisors table
    await expect(dashboard.supervisorsTable).toBeVisible({ timeout: 10000 });
  });

  test('should display applications table', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see applications table
    await expect(dashboard.applicationsTable).toBeVisible({ timeout: 10000 });
  });
});

