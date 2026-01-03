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
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Wait for navigation or message with better error handling
    try {
      await Promise.race([
        this.page.waitForURL(/\/(authenticated|$)/, { timeout: 10000 }),
        this.message.waitFor({ state: 'visible', timeout: 5000 }),
      ]);
    } catch (error) {
      // If neither navigation nor message appears, wait a bit more
      await this.page.waitForTimeout(1000);
    }
  }

  async getMessage(): Promise<string> {
    return await this.message.textContent() || '';
  }

  async isMessageVisible(): Promise<boolean> {
    return await this.message.isVisible();
  }
}

