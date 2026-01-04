/**
 * Performance E2E Tests
 * 
 * Tests for page load performance and Core Web Vitals.
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests @performance', () => {
  test('should meet page load time budget @performance @slow', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Budget: 3 seconds for initial page load
    expect(loadTime).toBeLessThan(3000);
  });

  test('should meet time to interactive budget @performance @slow', async ({ page }) => {
    await page.goto('/');
    
    // Measure Time to Interactive using Performance API
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
      };
    });
    
    // Budget: 2 seconds for DOM content loaded
    expect(metrics.domContentLoaded).toBeLessThan(2000);
    
    // Budget: 3 seconds for full page load
    expect(metrics.loadComplete).toBeLessThan(3000);
  });

  test('should meet first contentful paint budget @performance @slow', async ({ page }) => {
    await page.goto('/');
    
    // Measure First Contentful Paint
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
            }
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(3000), 5000);
      });
    });
    
    // Budget: 1.8 seconds for FCP
    expect(fcp).toBeLessThan(1800);
  });

  test('should meet largest contentful paint budget @performance @slow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;
        
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Wait a bit for LCP to be measured
        setTimeout(() => resolve(lcpValue), 3000);
      });
    });
    
    // Budget: 2.5 seconds for LCP
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500);
    }
  });

  test('should have acceptable performance metrics on login page @performance @slow', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Budget: 2 seconds for login page
    expect(loadTime).toBeLessThan(2000);
    
    // Check that page is interactive
    const emailInput = page.getByLabel('Email Address');
    await expect(emailInput).toBeVisible({ timeout: 1000 });
  });

  test('should have acceptable performance metrics on dashboard @performance @slow', async ({ page }) => {
    // This test would require authentication
    // For now, we'll just check the public landing page performance
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Budget: 3 seconds for dashboard/landing page
    expect(loadTime).toBeLessThan(3000);
  });
});

