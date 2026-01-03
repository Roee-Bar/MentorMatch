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
    await this.form.fillField('Password', data.password);
    await this.form.fillField('Confirm Password', data.confirmPassword);
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
    // Wait for navigation or message with better error handling
    // Check for both error and success messages
    const messageSelector = `${Selectors.errorMessage}, ${Selectors.successMessage}`;
    try {
      await Promise.race([
        waitForURL(this.page, '/login', 10000),
        this.page.locator(messageSelector).first().waitFor({ state: 'visible', timeout: 8000 }),
      ]);
    } catch (error) {
      // If neither navigation nor message appears, wait a bit more for form validation
      await this.page.waitForTimeout(1000);
    }
  }

  async register(data: RegistrationData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  async getMessage(): Promise<string> {
    // Wait for either error or success message to be visible
    const messageSelector = `${Selectors.errorMessage}, ${Selectors.successMessage}`;
    await this.waitForElement(messageSelector, 8000);
    return await this.getText(messageSelector);
  }

  async isMessageVisible(): Promise<boolean> {
    const messageSelector = `${Selectors.errorMessage}, ${Selectors.successMessage}`;
    return await this.elementExists(messageSelector);
  }
}

