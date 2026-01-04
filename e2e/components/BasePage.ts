/**
 * Base Page Class
 * 
 * Abstract base class for all page objects.
 * Provides common functionality and structure.
 */

import { Page, Locator } from '@playwright/test';
import { TestConfig } from '../config/test-config';
import { waitForPageLoad, waitForURL } from '../utils/wait-strategies';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the page
   * Must be implemented by subclasses
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be fully loaded
   */
  protected async waitForPageReady(): Promise<void> {
    await waitForPageLoad(this.page);
  }

  /**
   * Wait for URL to match pattern
   */
  protected async waitForURLPattern(
    pattern: string | RegExp,
    timeout?: number
  ): Promise<void> {
    await waitForURL(this.page, pattern, timeout);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for element to be visible
   */
  protected async waitForElement(
    selector: string,
    timeout: number = TestConfig.timeouts.action
  ): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /**
   * Check if element exists
   */
  protected async elementExists(selector: string): Promise<boolean> {
    const count = await this.page.locator(selector).count();
    return count > 0;
  }

  /**
   * Get text content of element
   */
  protected async getText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    const text = await element.textContent();
    return text?.trim() || '';
  }

  /**
   * Click element with retry
   */
  protected async clickWithRetry(
    selector: string,
    retries: number = 3
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Fill field with retry
   */
  protected async fillWithRetry(
    selector: string,
    value: string,
    retries: number = 3
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.fill(selector, value);
        const actualValue = await this.page.inputValue(selector);
        if (actualValue === value) {
          return;
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(500);
      }
    }
  }
}

