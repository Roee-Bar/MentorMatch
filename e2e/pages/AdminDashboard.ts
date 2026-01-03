/**
 * Admin Dashboard Page Object Model
 */

import { Page, Locator, expect } from '@playwright/test';

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
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for dashboard to be ready
    await this.page.waitForURL(/\/authenticated\/admin/, { timeout: 10000 });
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
    // Find the supervisor row in the SupervisorCapacitySection table
    const supervisorRow = this.page.locator(`[data-testid="supervisor-row-${supervisorId}"]`);
    await expect(supervisorRow).toBeVisible({ timeout: 10000 });

    // Click the "Edit Capacity" button for this supervisor
    const editButton = this.page.locator(`[data-testid="edit-capacity-${supervisorId}"]`);
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for the modal to appear
    await this.page.waitForTimeout(500);

    // Fill in the capacity override form in the modal
    const capacityInput = this.page.getByLabel(/maximum capacity/i);
    await expect(capacityInput).toBeVisible({ timeout: 5000 });
    await capacityInput.clear();
    await capacityInput.fill(newCapacity.toString());

    const reasonInput = this.page.getByLabel(/reason for change/i);
    await expect(reasonInput).toBeVisible({ timeout: 5000 });
    await reasonInput.fill(reason);

    // Submit the form
    const submitButton = this.page.getByRole('button', { name: /update capacity/i });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();

    // Wait for the update to complete and modal to close
    await this.page.waitForTimeout(2000);
    
    // Wait for success message or modal to disappear
    await this.page.waitForSelector('[data-testid="edit-capacity-modal"]', { state: 'hidden' }).catch(() => {
      // Modal might not have testid, so just wait a bit more
    });
  }
}

