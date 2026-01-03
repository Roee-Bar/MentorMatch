/**
 * Modal Component
 * 
 * Reusable component for interacting with modals/dialogs.
 */

import { Page, Locator } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { waitForStable, waitForElementState } from '../utils/wait-strategies';
import { TestConfig } from '../config/test-config';

export class Modal {
  private readonly page: Page;
  private readonly modalSelector: string;

  constructor(page: Page, modalSelector?: string) {
    this.page = page;
    this.modalSelector = modalSelector || Selectors.modal;
  }

  /**
   * Get the modal element
   */
  private get modal(): Locator {
    return this.page.locator(this.modalSelector).first();
  }

  /**
   * Check if modal is open
   */
  async isOpen(): Promise<boolean> {
    try {
      return await this.modal.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for modal to be open
   */
  async waitForOpen(timeout: number = TestConfig.timeouts.action): Promise<void> {
    await waitForElementState(this.modal, 'visible', timeout);
    await waitForStable(this.modal);
  }

  /**
   * Wait for modal to be closed
   */
  async waitForClosed(timeout: number = TestConfig.timeouts.action): Promise<void> {
    await waitForElementState(this.modal, 'hidden', timeout);
  }

  /**
   * Get modal title
   */
  async getTitle(): Promise<string> {
    const titleElement = this.modal.locator(Selectors.modalTitle);
    return await titleElement.textContent() || '';
  }

  /**
   * Close modal using close button
   */
  async close(): Promise<void> {
    const closeButton = this.modal.locator(Selectors.modalCloseButton);
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
      await this.waitForClosed();
    }
  }

  /**
   * Click confirm button
   */
  async confirm(): Promise<void> {
    const confirmButton = this.modal.locator(Selectors.modalConfirmButton);
    await confirmButton.click();
    await this.waitForClosed();
  }

  /**
   * Click cancel button
   */
  async cancel(): Promise<void> {
    const cancelButton = this.modal.locator(Selectors.modalCancelButton);
    if (await cancelButton.isVisible({ timeout: 1000 })) {
      await cancelButton.click();
      await this.waitForClosed();
    }
  }

  /**
   * Get modal content text
   */
  async getContent(): Promise<string> {
    return await this.modal.textContent() || '';
  }

  /**
   * Check if modal contains text
   */
  async containsText(text: string): Promise<boolean> {
    const content = await this.getContent();
    return content.includes(text);
  }
}

