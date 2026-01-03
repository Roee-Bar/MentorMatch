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
}

