/**
 * Visual Regression Utilities
 * 
 * Utilities for visual regression testing with Playwright.
 * Prepares infrastructure for screenshot comparison.
 */

import { Page, expect } from '@playwright/test';
import { TestConfig } from '../config/test-config';

/**
 * Visual regression configuration
 */
export interface VisualRegressionConfig {
  /** Threshold for pixel comparison (0-1) */
  threshold?: number;
  /** Maximum number of pixels that can differ */
  maxDiffPixels?: number;
  /** Maximum percentage of pixels that can differ */
  maxDiffPixelRatio?: number;
  /** Whether to ignore animations */
  animations?: 'disabled' | 'allow';
}

const defaultConfig: Required<VisualRegressionConfig> = {
  threshold: 0.2,
  maxDiffPixels: 100,
  maxDiffPixelRatio: 0.01,
  animations: 'disabled',
};

/**
 * Compare screenshot with baseline
 */
export async function compareScreenshot(
  page: Page,
  name: string,
  config?: VisualRegressionConfig
): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };
  
  await expect(page).toHaveScreenshot(name, {
    threshold: finalConfig.threshold,
    maxDiffPixels: finalConfig.maxDiffPixels,
    maxDiffPixelRatio: finalConfig.maxDiffPixelRatio,
    animations: finalConfig.animations,
  });
}

/**
 * Compare screenshot of specific element
 */
export async function compareElementScreenshot(
  page: Page,
  selector: string,
  name: string,
  config?: VisualRegressionConfig
): Promise<void> {
  const element = page.locator(selector).first();
  const finalConfig = { ...defaultConfig, ...config };
  
  await expect(element).toHaveScreenshot(name, {
    threshold: finalConfig.threshold,
    maxDiffPixels: finalConfig.maxDiffPixels,
    maxDiffPixelRatio: finalConfig.maxDiffPixelRatio,
    animations: finalConfig.animations,
  });
}

/**
 * Take screenshot for baseline (without comparison)
 */
export async function takeBaselineScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage: true 
  });
}

/**
 * Take screenshot of element for baseline
 */
export async function takeElementBaselineScreenshot(
  page: Page,
  selector: string,
  name: string
): Promise<void> {
  const element = page.locator(selector).first();
  await element.screenshot({ 
    path: `test-results/screenshots/${name}.png` 
  });
}

/**
 * Update screenshot baseline
 */
export async function updateBaseline(
  page: Page,
  name: string,
  fullPage: boolean = true
): Promise<void> {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}.png`,
    fullPage 
  });
}

export default {
  compareScreenshot,
  compareElementScreenshot,
  takeBaselineScreenshot,
  takeElementBaselineScreenshot,
  updateBaseline,
};

