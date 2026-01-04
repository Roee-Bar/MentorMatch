/**
 * Student Dashboard Page Object Model
 */

import { Page } from '@playwright/test';
import { BasePage } from '../components/BasePage';
import { Modal } from '../components/Modal';
import { Selectors } from '../utils/selectors';
import { waitForURL, waitForStable } from '../utils/wait-strategies';

export class StudentDashboard extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/authenticated/student');
    await this.waitForPageReady();
    // Wait for navigation links to be ready
    await this.waitForURLPattern(/\/authenticated\/student/);
  }

  async navigateToSupervisors(): Promise<void> {
    const link = this.page.getByRole('link', { name: /browse supervisors|supervisors/i });
    await link.click();
    await waitForURL(this.page, /\/authenticated\/student\/supervisors/);
  }

  async navigateToApplications(): Promise<void> {
    const link = this.page.getByRole('link', { name: /applications/i });
    await link.click();
    await waitForURL(this.page, /\/authenticated\/student\/applications/);
  }

  async navigateToProfile(): Promise<void> {
    const link = this.page.getByRole('link', { name: /profile/i });
    await link.click();
    await waitForURL(this.page, /\/authenticated\/student\/profile/);
  }

  async deleteApplication(applicationId: string): Promise<void> {
    // Navigate to applications page first
    await this.navigateToApplications();

    // Find the application in the list
    const applicationCard = this.page.locator(
      Selectors.applicationCardById(applicationId)
    ).or(this.page.locator(Selectors.applicationCard).first());

    if (await applicationCard.isVisible()) {
      // Look for delete button within the application card
      const deleteButton = applicationCard.locator(Selectors.deleteButton).first();
      if (await deleteButton.isVisible({ timeout: 1000 })) {
        await deleteButton.click();
        await waitForStable(deleteButton);

        // Handle confirmation dialog if it appears
        const modal = new Modal(this.page);
        if (await modal.isOpen()) {
          await modal.confirm();
        }
      }
    }
  }
}

