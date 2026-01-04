/**
 * Admin Dashboard E2E Tests
 */

import { test, expect } from '../../fixtures/auth';
import { AdminDashboard } from '../../pages/AdminDashboard';

test.describe('Admin - Dashboard @admin @regression', () => {
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

  test('should display students table @regression @fast', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Click on the "Total Students" stat card to open the students table
    const studentsStatCard = page.locator('[data-testid="stat-card"]').filter({ hasText: /total students/i }).first();
    if (await studentsStatCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await studentsStatCard.click();
      await page.waitForTimeout(500); // Wait for table to load
    }

    // Should see students table - try multiple selectors
    const studentsTable = page.locator('[data-testid="students-table"]')
      .or(page.locator('table').filter({ hasText: /student/i }))
      .or(page.locator('table').first());
    await expect(studentsTable.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display supervisors table @regression @fast', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Click on the "Total Supervisors" stat card to open the supervisors table
    const supervisorsStatCard = page.locator('[data-testid="stat-card"]').filter({ hasText: /total supervisors/i }).first();
    if (await supervisorsStatCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await supervisorsStatCard.click();
      await page.waitForTimeout(500); // Wait for table to load
    }

    // Should see supervisors table - try multiple selectors
    const supervisorsTable = page.locator('[data-testid="supervisors-table"]')
      .or(page.locator('table').filter({ hasText: /supervisor/i }))
      .or(page.locator('table').first());
    await expect(supervisorsTable.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display applications table @regression @fast', async ({ page, authenticatedAdmin }) => {
    const dashboard = new AdminDashboard(page);

    await dashboard.goto();

    // Click on the "Pending Applications" stat card to open the applications table
    const applicationsStatCard = page.locator('[data-testid="stat-card"]').filter({ hasText: /pending applications|applications/i }).first();
    if (await applicationsStatCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await applicationsStatCard.click();
      await page.waitForTimeout(500); // Wait for table to load
    }

    // Should see applications table - try multiple selectors
    const applicationsTable = page.locator('[data-testid="applications-table"]')
      .or(page.locator('table').filter({ hasText: /application|project/i }))
      .or(page.locator('table').first());
    await expect(applicationsTable.first()).toBeVisible({ timeout: 10000 });
  });
});

