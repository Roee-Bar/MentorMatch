/**
 * Login Page Object Model
 */

import { Page } from '@playwright/test';
import { BasePage } from '../components/BasePage';
import { Form } from '../components/Form';
import { Selectors } from '../utils/selectors';
import { waitForURL } from '../utils/wait-strategies';

export class LoginPage extends BasePage {
  private readonly form: Form;

  constructor(page: Page) {
    super(page);
    this.form = new Form(page, Selectors.loginForm);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageReady();
    // Wait for form to be ready
    await this.waitForElement(Selectors.loginEmailInput);
  }

  async login(email: string, password: string): Promise<void> {
    // Only fill fields if they have values (for testing empty field validation)
    if (email) {
      await this.form.fillField('Email Address', email);
    }
    if (password) {
      await this.form.fillField('Password', password);
    }
    
    await this.page.locator(Selectors.loginButton).click();
    
    // Wait for navigation or message with better error handling
    try {
      await Promise.race([
        waitForURL(this.page, /\/(authenticated|$)/, 8000),
        this.page.locator(Selectors.errorMessage).first().waitFor({ state: 'visible', timeout: 5000 }),
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
    return await this.getText(Selectors.errorMessage);
  }

  async isMessageVisible(): Promise<boolean> {
    return await this.elementExists(Selectors.errorMessage);
  }
}

