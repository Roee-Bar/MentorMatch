/**
 * Student Dashboard Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class StudentDashboard {
  readonly page: Page;
  readonly supervisorsLink: Locator;
  readonly applicationsLink: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.supervisorsLink = page.getByRole('link', { name: /browse supervisors|supervisors/i });
    this.applicationsLink = page.getByRole('link', { name: /applications/i });
    this.profileLink = page.getByRole('link', { name: /profile/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/authenticated/student');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSupervisors(): Promise<void> {
    await this.supervisorsLink.click();
    await this.page.waitForURL(/\/authenticated\/student\/supervisors/);
  }

  async navigateToApplications(): Promise<void> {
    await this.applicationsLink.click();
    await this.page.waitForURL(/\/authenticated\/student\/applications/);
  }

  async navigateToProfile(): Promise<void> {
    await this.profileLink.click();
    await this.page.waitForURL(/\/authenticated\/student\/profile/);
  }

  async deleteApplication(applicationId: string): Promise<void> {
    // Navigate to applications page first
    await this.navigateToApplications();

    // Find the application in the list (could be by ID, title, or position)
    const applicationCard = this.page.locator(
      `[data-testid="application-${applicationId}"], [data-application-id="${applicationId}"]`
    ).or(this.page.locator('[data-testid="application-card"], .application-card, table tbody tr').first());

    if (await applicationCard.isVisible()) {
      // Look for delete button within the application card
      const deleteButton = applicationCard.getByRole('button', { name: /delete|remove/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await this.page.waitForTimeout(500);

        // Handle confirmation dialog if it appears
        const confirmButton = this.page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await this.page.waitForTimeout(2000);
        }
      }
    }
  }
}

