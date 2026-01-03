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
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for navigation links to be ready
    await this.page.waitForURL(/\/authenticated\/supervisor/, { timeout: 10000 });
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
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForURL(/\/authenticated\/supervisor\/projects/, { timeout: 10000 });
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

  async navigateToPartnerships(): Promise<void> {
    // Try to find partnerships link in navigation
    const partnershipsLink = this.page.getByRole('link', { name: /partnerships/i });
    if (await partnershipsLink.isVisible()) {
      await partnershipsLink.click();
      await this.page.waitForURL(/\/authenticated\/supervisor\/partnerships/);
    } else {
      // Fallback: try navigating via URL if UI doesn't exist yet
      await this.page.goto('/authenticated/supervisor/partnerships');
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async createPartnershipRequest(projectId: string, targetSupervisorId: string): Promise<void> {
    // Navigate to partnerships page first
    await this.navigateToPartnerships();

    // Look for create request button or form
    const createButton = this.page.getByRole('button', { name: /create|request|send partnership/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await this.page.waitForTimeout(500);

      // Fill form if modal opens
      const projectSelect = this.page.getByLabel(/project/i).or(this.page.locator('select[name="projectId"]'));
      const supervisorSelect = this.page.getByLabel(/supervisor|target/i).or(this.page.locator('select[name="targetSupervisorId"]'));

      if (await projectSelect.isVisible()) {
        await projectSelect.selectOption(projectId);
      }
      if (await supervisorSelect.isVisible()) {
        await supervisorSelect.selectOption(targetSupervisorId);
      }

      const submitButton = this.page.getByRole('button', { name: /submit|create|send/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await this.page.waitForTimeout(2000);
      }
    } else {
      // If UI doesn't exist, use API directly
      await this.page.request.post('/api/supervisor-partnerships/request', {
        data: {
          targetSupervisorId,
          projectId,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  async acceptPartnershipRequest(requestId: string): Promise<void> {
    await this.navigateToPartnerships();

    // Find the request in the list
    const requestCard = this.page.locator(
      `[data-testid="partnership-request-${requestId}"], [data-request-id="${requestId}"]`
    ).or(this.page.locator('[data-testid="partnership-request"], .partnership-request, table tbody tr').first());

    if (await requestCard.isVisible()) {
      const acceptButton = requestCard.getByRole('button', { name: /accept|approve/i });
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await this.page.waitForTimeout(2000);
      }
    } else {
      // If UI doesn't exist, use API directly
      await this.page.request.post(`/api/supervisor-partnerships/${requestId}/respond`, {
        data: { action: 'accept' },
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async rejectPartnershipRequest(requestId: string): Promise<void> {
    await this.navigateToPartnerships();

    // Find the request in the list
    const requestCard = this.page.locator(
      `[data-testid="partnership-request-${requestId}"], [data-request-id="${requestId}"]`
    ).or(this.page.locator('[data-testid="partnership-request"], .partnership-request, table tbody tr').first());

    if (await requestCard.isVisible()) {
      const rejectButton = requestCard.getByRole('button', { name: /reject|decline/i });
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        await this.page.waitForTimeout(2000);
      }
    } else {
      // If UI doesn't exist, use API directly
      await this.page.request.post(`/api/supervisor-partnerships/${requestId}/respond`, {
        data: { action: 'reject' },
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async cancelPartnershipRequest(requestId: string): Promise<void> {
    await this.navigateToPartnerships();

    // Find the request in the list
    const requestCard = this.page.locator(
      `[data-testid="partnership-request-${requestId}"], [data-request-id="${requestId}"]`
    ).or(this.page.locator('[data-testid="partnership-request"], .partnership-request, table tbody tr').first());

    if (await requestCard.isVisible()) {
      const cancelButton = requestCard.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await this.page.waitForTimeout(2000);
      }
    } else {
      // If UI doesn't exist, use API directly
      await this.page.request.delete(`/api/supervisor-partnerships/${requestId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

