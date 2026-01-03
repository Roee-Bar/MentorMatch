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
    
    // Wait for stat cards to load
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
    
    // Check that we have stat cards
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display students table', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see students table
    const studentsTable = page.locator('[data-testid="students-table"]');
    await expect(studentsTable).toBeVisible({ timeout: 10000 });
  });

  test('should display supervisors table', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see supervisors table
    const supervisorsTable = page.locator('[data-testid="supervisors-table"]');
    await expect(supervisorsTable).toBeVisible({ timeout: 10000 });
  });

  test('should display applications table', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Should see applications table
    const applicationsTable = page.locator('[data-testid="applications-table"]');
    await expect(applicationsTable).toBeVisible({ timeout: 10000 });
  });
});

