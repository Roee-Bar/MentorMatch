/**
 * Student Dashboard Page Object Model
 */

import { Page } from '@playwright/test';
import { BasePage } from '../components/BasePage';
import { Modal } from '../components/Modal';
import { Selectors } from '../utils/selectors';
import { waitForURL, waitForStable } from '../utils/wait-strategies';
import { navigateToDashboard } from '../utils/navigation-helpers';

export class StudentDashboard extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await navigateToDashboard(this.page, 'student');
    await this.waitForPageReady();
  }

  async navigateToSupervisors(): Promise<void> {
    // Try to find a link or button with "browse supervisors" or "supervisors" text
    const link = this.page.getByRole('link', { name: /browse supervisors|supervisors/i }).first();
    const button = this.page.getByRole('button', { name: /browse supervisors|supervisors/i }).first();
    
    // Check which one exists and click it
    const linkVisible = await link.isVisible({ timeout: 2000 }).catch(() => false);
    const buttonVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (linkVisible) {
      await link.click();
    } else if (buttonVisible) {
      await button.click();
    } else {
      // Fallback: navigate directly
      await this.page.goto('/authenticated/student/supervisors');
    }
    await waitForURL(this.page, /\/authenticated\/student\/supervisors/);
  }

  async navigateToApplications(): Promise<void> {
    // Try to find a link or button with "applications" text
    const link = this.page.getByRole('link', { name: /applications/i }).first();
    const button = this.page.getByRole('button', { name: /applications/i }).first();
    
    // Check which one exists and click it
    const linkVisible = await link.isVisible({ timeout: 2000 }).catch(() => false);
    const buttonVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (linkVisible) {
      await link.click();
    } else if (buttonVisible) {
      await button.click();
    } else {
      // Fallback: navigate directly
      await this.page.goto('/authenticated/student/applications');
    }
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

