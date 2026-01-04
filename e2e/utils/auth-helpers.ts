/**
 * Authentication Helper Utilities
 * 
 * Reusable helpers for authentication operations in E2E tests.
 */

import { Page } from '@playwright/test';

/**
 * Verify that authentication is complete in the browser context
 * Checks Firebase auth state using modular SDK (v9+)
 */
export async function verifyAuthenticationComplete(
  page: Page,
  timeout: number = 15000
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 200;

  while (Date.now() - startTime < timeout) {
    const isAuthenticated = await page.evaluate(() => {
      try {
        // Check localStorage for Firebase auth state
        // Firebase stores auth state in localStorage with keys like 'firebase:authUser:...'
        const authKeys = Object.keys(window.localStorage).filter(key => 
          key.startsWith('firebase:authUser:')
        );
        
        if (authKeys.length > 0) {
          // Parse the auth state to verify it's valid
          const authKey = authKeys[0];
          const authState = JSON.parse(window.localStorage.getItem(authKey) || '{}');
          
          // Check if we have a valid token
          if (authState.stsTokenManager?.accessToken) {
            return true;
          }
        }
        
        // Also check if Firebase is available on window (if app exposes it)
        const firebaseAuth = (window as any).firebase?.auth?.();
        if (firebaseAuth?.currentUser) {
          return true;
        }
        
        return false;
      } catch (error) {
        // If check fails, return false
        return false;
      }
    });

    if (isAuthenticated) {
      // Wait a bit more to ensure auth state is fully propagated
      await page.waitForTimeout(300);
      return;
    }

    await page.waitForTimeout(checkInterval);
  }

  // Get current auth state for better error message
  const authState = await page.evaluate(() => {
    try {
      // Check localStorage for auth state (don't try to import Firebase)
      const authKeys = Object.keys(window.localStorage).filter(key => 
        key.startsWith('firebase:authUser:')
      );
      if (authKeys.length > 0) {
        const authKey = authKeys[0];
        const authState = JSON.parse(window.localStorage.getItem(authKey) || '{}');
        return {
          authAvailable: true,
          currentUser: !!authState.uid,
          currentUserId: authState.uid || null,
          hasToken: !!authState.stsTokenManager?.accessToken,
        };
      }
      return {
        authAvailable: false,
        currentUser: false,
        currentUserId: null,
        hasToken: false,
      };
    } catch (error: any) {
      return {
        authAvailable: false,
        currentUser: false,
        currentUserId: null,
        hasToken: false,
        error: error?.message || 'Unknown error',
      };
    }
  }).catch(() => ({
    authAvailable: false,
    currentUser: false,
    currentUserId: null,
    hasToken: false,
    error: 'Failed to check auth state',
  }));

  throw new Error(
    `Authentication not complete within ${timeout}ms. ` +
    `Auth state: ${JSON.stringify(authState)}`
  );
}

/**
 * Wait for authentication to complete with retry logic
 * Simplified for direct auth injection
 */
export async function waitForAuthentication(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  return verifyAuthenticationComplete(page, timeout);
}

/**
 * Verify user role by checking the current URL or page content
 */
export async function verifyUserRole(
  page: Page,
  expectedRole: 'student' | 'supervisor' | 'admin',
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 200;

  while (Date.now() - startTime < timeout) {
    const currentUrl = page.url();
    const rolePath = `/authenticated/${expectedRole}`;
    
    if (currentUrl.includes(rolePath)) {
      return;
    }

    await page.waitForTimeout(checkInterval);
  }

  throw new Error(
    `Expected user to be on ${expectedRole} dashboard, but current URL is: ${page.url()}`
  );
}

/**
 * Ensure user is authenticated, with retry logic
 */
export async function ensureAuthenticated(
  page: Page,
  role?: 'student' | 'supervisor' | 'admin',
  timeout: number = 15000
): Promise<void> {
  await verifyAuthenticationComplete(page, timeout);
  
  if (role) {
    await verifyUserRole(page, role, timeout);
  }
}

/**
 * Get Firebase ID token from the authenticated user in the browser context
 * This is needed for making authenticated API requests in tests
 * Works with modular SDK (v9+) by accessing the auth instance directly
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  try {
    // Get token from localStorage (where Firebase stores it)
    // The app's Firebase SDK should have synced the auth state by now
    const token = await page.evaluate(() => {
      try {
        const projectId = 'demo-test';
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authStateStr = window.localStorage.getItem(authKey);
        
        if (authStateStr) {
          const authState = JSON.parse(authStateStr);
          // Return the ID token (accessToken in Firebase's format)
          return authState?.stsTokenManager?.accessToken || null;
        }
        return null;
      } catch (error) {
        console.error('Error in getAuthToken evaluate:', error);
        return null;
      }
    });
    
    // If we got a token, return it
    if (token) {
      return token;
    }
    
    // Wait a bit and retry (sometimes Firebase needs time to sync)
    await page.waitForTimeout(1000);
    
    // Retry once more
    const retryToken = await page.evaluate(() => {
      try {
        const projectId = 'demo-test';
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authStateStr = window.localStorage.getItem(authKey);
        if (authStateStr) {
          const authState = JSON.parse(authStateStr);
          return authState?.stsTokenManager?.accessToken || null;
        }
        return null;
      } catch (e) {
        return null;
      }
    });
    
    return retryToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request with automatic token injection
 * This helper ensures all API requests include the Authorization header
 */
export async function authenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options: {
    data?: any;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<{ ok: () => boolean; status: () => number; json: () => Promise<any>; text: () => Promise<string> }> {
  // Get auth token
  const token = await getAuthToken(page);
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add Authorization header if token is available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Log warning if token is not available (helps debug auth issues)
    console.warn(`[authenticatedRequest] No auth token available for ${method} ${url}. Request may fail authentication.`);
  }
  
  // Make the request
  const requestOptions: any = {
    headers,
    timeout: options.timeout || 30000,
  };
  
  if (options.data) {
    requestOptions.data = options.data;
  }
  
  switch (method) {
    case 'GET':
      return await page.request.get(url, requestOptions);
    case 'POST':
      return await page.request.post(url, requestOptions);
    case 'PUT':
      return await page.request.put(url, requestOptions);
    case 'DELETE':
      return await page.request.delete(url, requestOptions);
    case 'PATCH':
      return await page.request.patch(url, requestOptions);
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

