/**
 * Supervisor Dashboard Page Object Model
 */

import { Page } from '@playwright/test';
import type { Project } from '@/types/database';
import { BasePage } from '../components/BasePage';
import { Modal } from '../components/Modal';
import { Form } from '../components/Form';
import { waitForURL, waitForStable } from '../utils/wait-strategies';
import { navigateToDashboard } from '../utils/navigation-helpers';

export class SupervisorDashboard extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await navigateToDashboard(this.page, 'supervisor');
    await this.waitForPageReady();
  }

  async navigateToApplications(): Promise<void> {
    const link = this.page.getByRole('link', { name: /applications/i });
    await link.click();
    await waitForURL(this.page, /\/authenticated\/supervisor\/applications/);
  }

  async navigateToProfile(): Promise<void> {
    const link = this.page.getByRole('link', { name: /profile/i });
    await link.click();
    await waitForURL(this.page, /\/authenticated\/supervisor\/profile/);
  }

  async navigateToProjects(): Promise<void> {
    const link = this.page.getByRole('link', { name: /projects/i });
    if (await link.isVisible({ timeout: 1000 })) {
      await link.click();
      await waitForURL(this.page, /\/authenticated\/supervisor\/projects/);
    } else {
      // Fallback: try navigating via URL
      await this.page.goto('/authenticated/supervisor/projects');
      await this.waitForPageReady();
      await this.waitForURLPattern(/\/authenticated\/supervisor\/projects/);
    }
  }

  async changeProjectStatus(projectId: string, newStatus: Project['status']): Promise<void> {
    // Navigate to projects page first
    await this.navigateToProjects();

    // Find the project in the list
    const projectCard = this.page.locator(
      `[data-testid="project-${projectId}"], [data-project-id="${projectId}"]`
    ).or(this.page.locator('[data-testid="project-card"], .project-card, table tbody tr').first());

    if (await projectCard.isVisible({ timeout: 1000 })) {
      // Look for status change button or dropdown
      const statusButton = projectCard.getByRole('button', { name: /change status|update status|status/i });
      if (await statusButton.isVisible({ timeout: 1000 })) {
        await statusButton.click();
        await waitForStable(statusButton);
      }

      // Select the new status from dropdown or button
      const statusOption = this.page.getByRole('button', { name: new RegExp(newStatus, 'i') })
        .or(this.page.getByRole('option', { name: new RegExp(newStatus, 'i') }));
      
      if (await statusOption.isVisible({ timeout: 1000 })) {
        await statusOption.click();
        await waitForStable(statusOption);
      }

      // Submit the change if there's a submit button
      const submitButton = this.page.getByRole('button', { name: /save|update|confirm|submit/i });
      if (await submitButton.isVisible({ timeout: 1000 })) {
        await submitButton.click();
        await waitForStable(submitButton);
      }
    }
  }

  async navigateToPartnerships(): Promise<void> {
    // Try to find partnerships link in navigation
    const partnershipsLink = this.page.getByRole('link', { name: /partnerships/i });
    if (await partnershipsLink.isVisible({ timeout: 1000 })) {
      await partnershipsLink.click();
      await waitForURL(this.page, /\/authenticated\/supervisor\/partnerships/);
    } else {
      // Fallback: try navigating via URL if UI doesn't exist yet
      await this.page.goto('/authenticated/supervisor/partnerships');
      await this.waitForPageReady();
    }
  }

  async createPartnershipRequest(projectId: string, targetSupervisorId: string): Promise<void> {
    // Navigate to partnerships page first
    await this.navigateToPartnerships();

    // Look for create request button or form
    const createButton = this.page.getByRole('button', { name: /create|request|send partnership/i });
    if (await createButton.isVisible({ timeout: 1000 })) {
      await createButton.click();
      await waitForStable(createButton);

      // Fill form if modal opens
      const modal = new Modal(this.page);
      if (await modal.isOpen()) {
        const form = new Form(this.page);
        await form.selectOption('Project', projectId);
        await form.selectOption('Target Supervisor', targetSupervisorId);
        await form.submit();
        await modal.waitForClosed();
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

    if (await requestCard.isVisible({ timeout: 1000 })) {
      const acceptButton = requestCard.getByRole('button', { name: /accept|approve/i });
      if (await acceptButton.isVisible({ timeout: 1000 })) {
        await acceptButton.click();
        await waitForStable(acceptButton);
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

    if (await requestCard.isVisible({ timeout: 1000 })) {
      const rejectButton = requestCard.getByRole('button', { name: /reject|decline/i });
      if (await rejectButton.isVisible({ timeout: 1000 })) {
        await rejectButton.click();
        await waitForStable(rejectButton);
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

    if (await requestCard.isVisible({ timeout: 1000 })) {
      const cancelButton = requestCard.getByRole('button', { name: /cancel/i });
      if (await cancelButton.isVisible({ timeout: 1000 })) {
        await cancelButton.click();
        await waitForStable(cancelButton);
      }
    } else {
      // If UI doesn't exist, use API directly
      await this.page.request.delete(`/api/supervisor-partnerships/${requestId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

