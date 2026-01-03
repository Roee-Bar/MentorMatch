/**
 * Login Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email Address');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: /login/i });
    this.registerLink = page.getByRole('link', { name: /sign up/i });
    this.message = page.locator('[role="status"], .error, .success').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for form to be ready
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async login(email: string, password: string): Promise<void> {
    // Only fill fields if they have values (for testing empty field validation)
    if (email) {
      await this.emailInput.fill(email);
    }
    if (password) {
      await this.passwordInput.fill(password);
    }
    
    await this.loginButton.click();
    
    // Wait for navigation or message with better error handling
    // Use Promise.race with shorter timeouts to avoid hanging
    try {
      await Promise.race([
        this.page.waitForURL(/\/(authenticated|$)/, { timeout: 8000 }),
        this.message.waitFor({ state: 'visible', timeout: 5000 }),
      ]);
    } catch (error) {
      // If neither navigation nor message appears within timeout,
      // check if we're still on login page (browser validation may have prevented submission)
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/authenticated')) {
        // Still on login page - form may not have submitted due to browser validation
        // Don't throw error, let the test handle the assertion
        return;
      }
      // If we navigated, that's fine - don't throw
    }
  }

  async getMessage(): Promise<string> {
    return await this.message.textContent() || '';
  }

  async isMessageVisible(): Promise<boolean> {
    return await this.message.isVisible();
  }
}

