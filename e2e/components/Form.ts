/**
 * Form Component
 * 
 * Reusable component for interacting with forms.
 */

import { Page, Locator } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { waitForStable } from '../utils/wait-strategies';
import { TestConfig } from '../config/test-config';

export class Form {
  private readonly page: Page;
  private readonly formSelector: string;

  constructor(page: Page, formSelector?: string) {
    this.page = page;
    this.formSelector = formSelector || 'form';
  }

  /**
   * Get the form element
   */
  private get form(): Locator {
    return this.page.locator(this.formSelector).first();
  }

  /**
   * Fill a form field by label
   * Handles ambiguous labels by prioritizing fields with name attributes or test IDs
   */
  async fillField(label: string, value: string): Promise<void> {
    const fields = this.page.getByLabel(label);
    const count = await fields.count();
    
    if (count === 0) {
      throw new Error(`No field found with label: ${label}`);
    }
    
    if (count === 1) {
      // Single match, use it directly
      const field = fields.first();
      await waitForStable(field);
      await field.fill(value);
      return;
    }
    
    // Multiple matches - try to find the most specific one
    // Prioritize fields with name attributes or test IDs
    for (let i = 0; i < count; i++) {
      const field = fields.nth(i);
      const name = await field.getAttribute('name');
      const testId = await field.getAttribute('data-testid');
      
      if (name || testId) {
        // Use this field if it has a name or test ID
        await waitForStable(field);
        await field.fill(value);
        return;
      }
    }
    
    // If no field has name/testId, use the first one
    const field = fields.first();
    await waitForStable(field);
    await field.fill(value);
  }

  /**
   * Fill a form field by name attribute
   */
  async fillFieldByName(name: string, value: string): Promise<void> {
    const field = this.page.locator(`[name="${name}"]`);
    await waitForStable(field);
    await field.fill(value);
  }

  /**
   * Fill a form field using data-testid
   */
  async fillFieldByTestId(testId: string, value: string): Promise<void> {
    const field = this.page.locator(`[data-testid="${testId}"]`);
    await waitForStable(field);
    await field.fill(value);
  }

  /**
   * Select an option in a select field by label
   */
  async selectOption(label: string, value: string): Promise<void> {
    const select = this.page.getByLabel(label);
    await waitForStable(select);
    await select.selectOption(value);
  }

  /**
   * Select an option in a select field by name
   */
  async selectOptionByName(name: string, value: string): Promise<void> {
    const select = this.page.locator(`[name="${name}"]`);
    await waitForStable(select);
    await select.selectOption(value);
  }

  /**
   * Check a checkbox by label
   */
  async checkCheckbox(label: string): Promise<void> {
    const checkbox = this.page.getByLabel(label);
    await waitForStable(checkbox);
    await checkbox.check();
  }

  /**
   * Uncheck a checkbox by label
   */
  async uncheckCheckbox(label: string): Promise<void> {
    const checkbox = this.page.getByLabel(label);
    await waitForStable(checkbox);
    await checkbox.uncheck();
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    const submitButton = this.form.locator(Selectors.submitButton).first();
    await waitForStable(submitButton);
    await submitButton.click();
  }

  /**
   * Submit the form by clicking a button with specific text
   */
  async submitWithButton(buttonText: string): Promise<void> {
    const button = this.page.getByRole('button', { name: new RegExp(buttonText, 'i') });
    await waitForStable(button);
    await button.click();
  }

  /**
   * Get field value by label
   */
  async getFieldValue(label: string): Promise<string> {
    const field = this.page.getByLabel(label);
    return await field.inputValue();
  }

  /**
   * Get field value by name
   */
  async getFieldValueByName(name: string): Promise<string> {
    const field = this.page.locator(`[name="${name}"]`);
    return await field.inputValue();
  }

  /**
   * Check if field has error
   */
  async fieldHasError(label: string): Promise<boolean> {
    const field = this.page.getByLabel(label);
    const ariaInvalid = await field.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }

  /**
   * Get error message for a field
   */
  async getFieldError(fieldName: string): Promise<string> {
    const errorElement = this.page.locator(
      `[data-error-for="${fieldName}"], [aria-describedby*="${fieldName}"]`
    ).first();
    
    if (await errorElement.isVisible({ timeout: 1000 })) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  /**
   * Clear a field by label
   */
  async clearField(label: string): Promise<void> {
    const field = this.page.getByLabel(label);
    await waitForStable(field);
    await field.clear();
  }

  /**
   * Check if form is valid
   */
  async isValid(): Promise<boolean> {
    const formElement = await this.form.elementHandle();
    if (!formElement) return false;
    
    return await formElement.evaluate((form: HTMLFormElement) => {
      return form.checkValidity();
    });
  }
}

