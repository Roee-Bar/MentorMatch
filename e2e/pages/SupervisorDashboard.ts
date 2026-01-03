/**
 * Supervisor Dashboard Page Object Model
 */

import { Page, Locator } from '@playwright/test';
import type { Project } from '@/types/database';

export class SupervisorDashboard {
  readonly page: Page;
  readonly applicationsLink: Locator;
  readonly profileLink: Locator;
  readonly projectsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.applicationsLink = page.getByRole('link', { name: /applications/i });
    this.profileLink = page.getByRole('link', { name: /profile/i });
    this.projectsLink = page.getByRole('link', { name: /projects/i });
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

  async navigateToProjects(): Promise<void> {
    if (await this.projectsLink.isVisible()) {
      await this.projectsLink.click();
      await this.page.waitForURL(/\/authenticated\/supervisor\/projects/);
    } else {
      // Fallback: try navigating via URL
      await this.page.goto('/authenticated/supervisor/projects');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async changeProjectStatus(projectId: string, newStatus: Project['status']): Promise<void> {
    // Navigate to projects page first
    await this.navigateToProjects();

    // Find the project in the list
    const projectCard = this.page.locator(
      `[data-testid="project-${projectId}"], [data-project-id="${projectId}"]`
    ).or(this.page.locator('[data-testid="project-card"], .project-card, table tbody tr').first());

    if (await projectCard.isVisible()) {
      // Look for status change button or dropdown
      const statusButton = projectCard.getByRole('button', { name: /change status|update status|status/i });
      if (await statusButton.isVisible()) {
        await statusButton.click();
        await this.page.waitForTimeout(500);
      }

      // Select the new status from dropdown or button
      const statusOption = this.page.getByRole('button', { name: new RegExp(newStatus, 'i') })
        .or(this.page.getByRole('option', { name: new RegExp(newStatus, 'i') }));
      
      if (await statusOption.isVisible()) {
        await statusOption.click();
        await this.page.waitForTimeout(500);
      }

      // Submit the change if there's a submit button
      const submitButton = this.page.getByRole('button', { name: /save|update|confirm|submit/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await this.page.waitForTimeout(2000);
      }
    }
  }
}

