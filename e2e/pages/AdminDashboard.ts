/**
 * Admin Dashboard Page Object Model
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from '../components/BasePage';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { Form } from '../components/Form';
import { Selectors } from '../utils/selectors';
import { waitForURL, waitForStable } from '../utils/wait-strategies';
import { navigateToDashboard } from '../utils/navigation-helpers';

export class AdminDashboard extends BasePage {
  readonly studentsTable: Table;
  readonly supervisorsTable: Table;
  readonly applicationsTable: Table;

  constructor(page: Page) {
    super(page);
    this.studentsTable = new Table(page, '[data-testid="students-table"]');
    this.supervisorsTable = new Table(page, '[data-testid="supervisors-table"]');
    this.applicationsTable = new Table(page, '[data-testid="applications-table"]');
  }

  async goto(): Promise<void> {
    await navigateToDashboard(this.page, 'admin');
    await this.waitForPageReady();
  }

  async getStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    const statCards = this.page.locator(Selectors.statCard);
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
    if (await supervisorsTab.isVisible({ timeout: 1000 })) {
      await supervisorsTab.click();
      await waitForStable(supervisorsTab);
    }

    // Find and click on the supervisor row
    const supervisorRowByTestId = this.page.locator(`[data-testid="supervisor-row-${supervisorId}"]`);
    let supervisorRow: Locator;
    
    if (await supervisorRowByTestId.isVisible({ timeout: 1000 }).catch(() => false)) {
      supervisorRow = supervisorRowByTestId;
    } else {
      supervisorRow = await this.supervisorsTable.getRow(0);
    }
    
    if (await supervisorRow.isVisible({ timeout: 1000 })) {
      await supervisorRow.click();
      await waitForStable(supervisorRow);
    }
  }

  async overrideSupervisorCapacity(supervisorId: string, newCapacity: number, reason: string): Promise<void> {
    // Wait for page to be fully loaded
    await this.waitForPageReady();
    
    // Wait for supervisor capacity section to be visible
    const capacitySection = this.page.locator('[data-testid="supervisor-capacity-section"]');
    await capacitySection.waitFor({ state: 'visible', timeout: 10000 }).catch(async () => {
      // If section not found by test ID, try to find any table
      const anyTable = this.page.locator('table').last();
      await anyTable.waitFor({ state: 'visible', timeout: 10000 });
    });
    
    // Scroll to capacity section to ensure it's visible
    await capacitySection.scrollIntoViewIfNeeded().catch(() => {
      // Fallback: scroll to bottom
      this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });
    await this.page.waitForTimeout(500);
    
    // Find the supervisor row - scroll into view if needed
    const supervisorRow = this.page.locator(`[data-testid="supervisor-row-${supervisorId}"]`);
    await supervisorRow.scrollIntoViewIfNeeded();
    await expect(supervisorRow).toBeVisible({ timeout: 10000 });

    // Click the "Edit Capacity" button
    const editButton = this.page.locator(`[data-testid="edit-capacity-${supervisorId}"]`);
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for modal and fill form
    const modal = new Modal(this.page);
    await modal.waitForOpen();
    
    const form = new Form(this.page);
    await form.fillField('Maximum Capacity', newCapacity.toString());
    await form.fillField('Reason for Change', reason);
    
    // Submit the form
    await form.submitWithButton('Update Capacity');
    
    // Wait for modal to close
    await modal.waitForClosed();
  }
}

