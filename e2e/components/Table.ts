/**
 * Table Component
 * 
 * Reusable component for interacting with tables.
 */

import { Page, Locator } from '@playwright/test';
import { Selectors } from '../utils/selectors';
import { waitForStable } from '../utils/wait-strategies';
import { TestConfig } from '../config/test-config';

export class Table {
  private readonly page: Page;
  private readonly tableSelector: string;

  constructor(page: Page, tableSelector?: string) {
    this.page = page;
    this.tableSelector = tableSelector || Selectors.table;
  }

  /**
   * Get the table element
   */
  private get table(): Locator {
    return this.page.locator(this.tableSelector).first();
  }

  /**
   * Get all table rows
   */
  async getRows(): Promise<Locator> {
    await waitForStable(this.table);
    return this.table.locator(Selectors.tableRow);
  }

  /**
   * Get row count
   */
  async getRowCount(): Promise<number> {
    const rows = await this.getRows();
    return await rows.count();
  }

  /**
   * Get a specific row by index (0-based)
   */
  async getRow(index: number): Promise<Locator> {
    const rows = await this.getRows();
    return rows.nth(index);
  }

  /**
   * Get row by text content
   */
  async getRowByText(text: string): Promise<Locator | null> {
    const rows = await this.getRows();
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      if (rowText && rowText.includes(text)) {
        return row;
      }
    }
    
    return null;
  }

  /**
   * Get all headers
   */
  async getHeaders(): Promise<Locator> {
    await waitForStable(this.table);
    return this.table.locator(Selectors.tableHeader);
  }

  /**
   * Get header text
   */
  async getHeaderText(): Promise<string[]> {
    const headers = await this.getHeaders();
    const count = await headers.count();
    const headerTexts: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const header = headers.nth(i);
      const text = await header.textContent();
      if (text) {
        headerTexts.push(text.trim());
      }
    }
    
    return headerTexts;
  }

  /**
   * Get cell value by row and column index
   */
  async getCell(rowIndex: number, columnIndex: number): Promise<string> {
    const row = await this.getRow(rowIndex);
    const cells = row.locator('td, th');
    const cell = cells.nth(columnIndex);
    return await cell.textContent() || '';
  }

  /**
   * Get all cell values in a row
   */
  async getRowValues(rowIndex: number): Promise<string[]> {
    const row = await this.getRow(rowIndex);
    const cells = row.locator('td, th');
    const count = await cells.count();
    const values: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const text = await cell.textContent();
      if (text) {
        values.push(text.trim());
      }
    }
    
    return values;
  }

  /**
   * Click a cell in a row
   */
  async clickCell(rowIndex: number, columnIndex: number): Promise<void> {
    const row = await this.getRow(rowIndex);
    const cells = row.locator('td, th');
    const cell = cells.nth(columnIndex);
    await waitForStable(cell);
    await cell.click();
  }

  /**
   * Click a button in a row
   */
  async clickButtonInRow(rowIndex: number, buttonText: string): Promise<void> {
    const row = await this.getRow(rowIndex);
    const button = row.getByRole('button', { name: new RegExp(buttonText, 'i') });
    await waitForStable(button);
    await button.click();
  }

  /**
   * Check if table has rows
   */
  async hasRows(): Promise<boolean> {
    const count = await this.getRowCount();
    return count > 0;
  }

  /**
   * Check if table is empty
   */
  async isEmpty(): Promise<boolean> {
    return !(await this.hasRows());
  }

  /**
   * Wait for table to have minimum number of rows
   */
  async waitForRows(minRows: number = 1, timeout: number = TestConfig.timeouts.assertion): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const count = await this.getRowCount();
      if (count >= minRows) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    
    throw new Error(`Table did not have at least ${minRows} rows within ${timeout}ms`);
  }
}

