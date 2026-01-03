/**
 * Admin Dashboard Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class AdminDashboard {
  readonly page: Page;
  readonly studentsTable: Locator;
  readonly supervisorsTable: Locator;
  readonly applicationsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.studentsTable = page.locator('[data-testid="students-table"], table').first();
    this.supervisorsTable = page.locator('[data-testid="supervisors-table"], table').first();
    this.applicationsTable = page.locator('[data-testid="applications-table"], table').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/authenticated/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async getStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    const statCards = this.page.locator('[data-testid="stat-card"]');
    const count = await statCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = statCards.nth(i);
      const label = await card.locator('h3, .stat-label').textContent();
      const value = await card.locator('.stat-value, [data-testid="stat-value"]').textContent();
      if (label && value) {
        stats[label.trim()] = parseInt(value.trim()) || 0;
      }
    }
    
    return stats;
  }
}

