/**
 * Debug Helpers
 * 
 * Enhanced debugging utilities for test failures and troubleshooting.
 */

import { Page, Locator } from '@playwright/test';
import { TestConfig } from '../config/test-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Debug page state - takes screenshot and logs page information
 */
export async function debugPageState(
  page: Page,
  context: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const debugDir = path.join(process.cwd(), 'test-results', 'debug');
  
  // Ensure debug directory exists
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  const filename = `debug-${context}-${timestamp}`;
  const screenshotPath = path.join(debugDir, `${filename}.png`);
  
  // Take screenshot
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  // Log page information
  const pageInfo = {
    url: page.url(),
    title: await page.title(),
    timestamp: new Date().toISOString(),
    context,
  };
  
  console.log(`[DEBUG ${context}] URL: ${pageInfo.url}`);
  console.log(`[DEBUG ${context}] Title: ${pageInfo.title}`);
  console.log(`[DEBUG ${context}] Screenshot: ${screenshotPath}`);
  
  // Save page info to file
  const infoPath = path.join(debugDir, `${filename}.json`);
  fs.writeFileSync(infoPath, JSON.stringify(pageInfo, null, 2));
}

/**
 * Log network activity for a duration
 */
export async function logNetworkActivity(
  page: Page,
  duration: number = 5000
): Promise<void> {
  const requests: Array<{ method: string; url: string; timestamp: number }> = [];
  const responses: Array<{ status: number; url: string; timestamp: number }> = [];
  
  const requestHandler = (request: any) => {
    requests.push({
      method: request.method(),
      url: request.url(),
      timestamp: Date.now(),
    });
  };
  
  const responseHandler = (response: any) => {
    responses.push({
      status: response.status(),
      url: response.url(),
      timestamp: Date.now(),
    });
  };
  
  page.on('request', requestHandler);
  page.on('response', responseHandler);
  
  await page.waitForTimeout(duration);
  
  page.off('request', requestHandler);
  page.off('response', responseHandler);
  
  console.log('=== Network Activity ===');
  console.log(`Requests (${requests.length}):`);
  requests.forEach(req => {
    console.log(`  ${req.method} ${req.url}`);
  });
  console.log(`Responses (${responses.length}):`);
  responses.forEach(res => {
    console.log(`  ${res.status} ${res.url}`);
  });
  console.log('=======================');
}

/**
 * Capture test context for debugging
 */
export async function captureTestContext(
  page: Page,
  testName: string,
  additionalInfo?: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const debugDir = path.join(process.cwd(), 'test-results', 'debug');
  
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  const context = {
    testName,
    timestamp: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    viewport: page.viewportSize(),
    ...additionalInfo,
  };
  
  // Take screenshot
  const screenshotPath = path.join(debugDir, `context-${testName}-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  // Save context
  const contextPath = path.join(debugDir, `context-${testName}-${timestamp}.json`);
  fs.writeFileSync(contextPath, JSON.stringify({ ...context, screenshotPath }, null, 2));
  
  console.log(`[DEBUG] Test context saved: ${contextPath}`);
  console.log(`[DEBUG] Screenshot saved: ${screenshotPath}`);
}

/**
 * Interactive debug - pause test execution
 */
export async function interactiveDebug(
  page: Page,
  message: string = 'Test paused for debugging'
): Promise<void> {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[DEBUG] ${message}`);
  console.log(`[DEBUG] URL: ${page.url()}`);
  console.log(`[DEBUG] Title: ${await page.title()}`);
  console.log(`[DEBUG] Test execution paused. Press Enter to continue...`);
  console.log(`${'='.repeat(50)}\n`);
  
  // In headed mode, this will pause the browser
  // In CI, this will just log
  if (process.env.CI !== 'true') {
    await page.pause();
  }
}

/**
 * Log console messages from the page
 */
export async function logConsoleMessages(
  page: Page,
  duration: number = 5000
): Promise<void> {
  const messages: Array<{ type: string; text: string; timestamp: number }> = [];
  
  const messageHandler = (msg: any) => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now(),
    });
  };
  
  page.on('console', messageHandler);
  
  await page.waitForTimeout(duration);
  
  page.off('console', messageHandler);
  
  console.log('=== Console Messages ===');
  messages.forEach(msg => {
    const prefix = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${msg.type}] ${msg.text}`);
  });
  console.log('========================');
}

/**
 * Get element information for debugging
 */
export async function getElementInfo(locator: Locator): Promise<Record<string, any>> {
  const element = await locator.first().elementHandle();
  if (!element) {
    return { error: 'Element not found' };
  }
  
  return await element.evaluate((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    
    return {
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      textContent: el.textContent?.substring(0, 100),
      innerHTML: el.innerHTML.substring(0, 200),
      boundingBox: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      styles: {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        zIndex: styles.zIndex,
      },
      attributes: Array.from(el.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string>),
    };
  });
}

/**
 * Debug element - logs detailed information about an element
 */
export async function debugElement(
  locator: Locator,
  context: string = 'element'
): Promise<void> {
  const info = await getElementInfo(locator);
  console.log(`[DEBUG ${context}]`, JSON.stringify(info, null, 2));
}

/**
 * Wait and debug - waits for condition and logs debug info on failure
 */
export async function waitAndDebug(
  condition: () => Promise<boolean>,
  page: Page,
  timeout: number = TestConfig.timeouts.action,
  debugContext: string = 'wait'
): Promise<void> {
  const startTime = Date.now();
  const interval = 100;
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await page.waitForTimeout(interval);
  }
  
  // Condition failed, debug
  await debugPageState(page, debugContext);
  throw new Error(`Condition not met within ${timeout}ms. Debug info saved.`);
}

export default {
  debugPageState,
  logNetworkActivity,
  captureTestContext,
  interactiveDebug,
  logConsoleMessages,
  getElementInfo,
  debugElement,
  waitAndDebug,
};

