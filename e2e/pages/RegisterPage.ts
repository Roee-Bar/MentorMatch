/**
 * Register Page Object Model
 */

import { Page, Locator } from '@playwright/test';
import type { RegistrationData } from '@/types/database';

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly studentIdInput: Locator;
  readonly phoneInput: Locator;
  readonly departmentSelect: Locator;
  readonly skillsTextarea: Locator;
  readonly interestsTextarea: Locator;
  readonly previousProjectsTextarea: Locator;
  readonly preferredTopicsTextarea: Locator;
  readonly submitButton: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/^password$/i);
    this.confirmPasswordInput = page.getByLabel(/confirm password/i);
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.studentIdInput = page.getByLabel(/student id/i);
    this.phoneInput = page.getByLabel(/phone/i);
    this.departmentSelect = page.getByLabel(/department/i);
    this.skillsTextarea = page.getByLabel(/skills/i);
    this.interestsTextarea = page.getByLabel(/interests/i);
    this.previousProjectsTextarea = page.getByLabel(/previous projects/i);
    this.preferredTopicsTextarea = page.getByLabel(/preferred topics/i);
    this.submitButton = page.getByRole('button', { name: /create account|register/i });
    this.message = page.locator('[role="status"], .error, .success').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: RegistrationData): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.studentIdInput.fill(data.studentId);
    await this.phoneInput.fill(data.phone);
    await this.departmentSelect.selectOption(data.department);
    
    if (data.skills) await this.skillsTextarea.fill(data.skills);
    if (data.interests) await this.interestsTextarea.fill(data.interests);
    if (data.previousProjects) await this.previousProjectsTextarea.fill(data.previousProjects);
    if (data.preferredTopics) await this.preferredTopicsTextarea.fill(data.preferredTopics);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    // Wait for navigation or message
    await Promise.race([
      this.page.waitForURL('/login', { timeout: 10000 }),
      this.message.waitFor({ state: 'visible', timeout: 5000 }),
    ]);
  }

  async register(data: RegistrationData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  async getMessage(): Promise<string> {
    return await this.message.textContent() || '';
  }

  async isMessageVisible(): Promise<boolean> {
    return await this.message.isVisible();
  }
}

