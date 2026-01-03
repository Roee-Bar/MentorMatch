/**
 * Supervisor Dashboard Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class SupervisorDashboard {
  readonly page: Page;
  readonly applicationsLink: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.applicationsLink = page.getByRole('link', { name: /applications/i });
    this.profileLink = page.getByRole('link', { name: /profile/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/authenticated/supervisor');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToApplications(): Promise<void> {
    await this.applicationsLink.click();
    await this.page.waitForURL(/\/authenticated\/supervisor\/applications/);
  }

  async navigateToProfile(): Promise<void> {
    await this.profileLink.click();
    await this.page.waitForURL(/\/authenticated\/supervisor\/profile/);
  }
}

