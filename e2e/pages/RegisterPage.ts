/**
 * Register Page Object Model
 */

import { Page } from '@playwright/test';
import type { RegistrationData } from '@/types/database';
import { BasePage } from '../components/BasePage';
import { Form } from '../components/Form';
import { Selectors } from '../utils/selectors';
import { waitForURL } from '../utils/wait-strategies';

export class RegisterPage extends BasePage {
  private readonly form: Form;

  constructor(page: Page) {
    super(page);
    this.form = new Form(page, Selectors.registerForm);
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await this.waitForPageReady();
    // Wait for form to be ready
    await this.waitForElement(Selectors.registerEmailInput);
  }

  async fillForm(data: RegistrationData): Promise<void> {
    await this.form.fillField('Email Address', data.email);
    // Use fillFieldByName for password fields to avoid ambiguity (both have label "Password")
    await this.form.fillFieldByName('password', data.password);
    await this.form.fillFieldByName('confirmPassword', data.confirmPassword);
    await this.form.fillField('First Name', data.firstName);
    await this.form.fillField('Last Name', data.lastName);
    await this.form.fillField('Student ID', data.studentId);
    await this.form.fillField('Phone', data.phone);
    await this.form.selectOption('Department', data.department);
    
    if (data.skills) await this.form.fillField('Technical Skills', data.skills);
    if (data.interests) await this.form.fillField('Research Interests', data.interests);
    if (data.previousProjects) await this.form.fillField('Previous Projects (Optional)', data.previousProjects);
    if (data.preferredTopics) await this.form.fillField('Preferred Project Topics (Optional)', data.preferredTopics);
  }

  async submit(): Promise<void> {
    await this.page.locator(Selectors.registerSubmitButton).click();
    // Wait for navigation to /login with longer timeout
    // Prioritize URL navigation over message display
    try {
      await this.page.waitForURL('/login', { timeout: 15000 });
    } catch (error) {
      // If navigation doesn't happen, check for error message
      // This allows the test to handle redirect failure gracefully
      const messageSelector = `${Selectors.errorMessage}, ${Selectors.successMessage}`;
      const messageVisible = await this.page.locator(messageSelector).first().isVisible({ timeout: 5000 }).catch(() => false);
      if (!messageVisible) {
        // No message and no redirect - registration may have failed or redirect is broken
        // Let the test handle verification via API fallback
        return;
      }
    }
  }

  async register(data: RegistrationData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  async getMessage(): Promise<string> {
    // Wait for either error or success message to be visible
    // Exclude Next.js route announcer which also has role="alert"
    const messageSelector = `${Selectors.errorMessage}:not(#__next-route-announcer__), ${Selectors.successMessage}:not(#__next-route-announcer__)`;
    const messageElement = this.page.locator(messageSelector).first();
    await messageElement.waitFor({ state: 'visible', timeout: 8000 });
    return await messageElement.textContent() || '';
  }

  async isMessageVisible(): Promise<boolean> {
    const messageSelector = `${Selectors.errorMessage}, ${Selectors.successMessage}`;
    return await this.elementExists(messageSelector);
  }
}

