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

  async navigateToSupervisorDetails(supervisorId: string): Promise<void> {
    // Navigate to supervisors section
    const supervisorsTab = this.page.getByRole('tab', { name: /supervisors/i });
    if (await supervisorsTab.isVisible()) {
      await supervisorsTab.click();
      await this.page.waitForTimeout(500);
    }

    // Find and click on the supervisor row
    const supervisorRow = this.page.locator(`[data-testid="supervisor-row-${supervisorId}"], table tbody tr`).first();
    if (await supervisorRow.isVisible()) {
      await supervisorRow.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async overrideSupervisorCapacity(supervisorId: string, newCapacity: number, reason: string): Promise<void> {
    // Navigate to supervisor details first
    await this.navigateToSupervisorDetails(supervisorId);

    // Look for capacity override button or action
    const overrideButton = this.page.getByRole('button', { name: /override capacity|change capacity|edit capacity/i });
    if (await overrideButton.isVisible()) {
      await overrideButton.click();
      await this.page.waitForTimeout(500);
    }

    // Fill in the capacity override form
    const capacityInput = this.page.getByLabel(/max capacity|capacity/i);
    if (await capacityInput.isVisible()) {
      await capacityInput.fill(newCapacity.toString());
    }

    const reasonInput = this.page.getByLabel(/reason/i);
    if (await reasonInput.isVisible()) {
      await reasonInput.fill(reason);
    }

    // Submit the form
    const submitButton = this.page.getByRole('button', { name: /save|update|submit|confirm/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await this.page.waitForTimeout(2000);
    }
  }
}

