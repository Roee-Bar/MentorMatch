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
  const authState = await page.evaluate(async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      return {
        authAvailable: !!auth,
        currentUser: auth?.currentUser !== null,
        currentUserId: auth?.currentUser?.uid || null,
      };
    } catch (error: any) {
      return {
        authAvailable: false,
        currentUser: false,
        currentUserId: null,
        error: error?.message || 'Unknown error',
      };
    }
  }).catch(() => ({
    authAvailable: false,
    currentUser: false,
    currentUserId: null,
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
    // Access the Firebase auth instance from the app's module
    // The app uses modular SDK, so we import it directly in the browser context
    const token = await page.evaluate(async () => {
      try {
        // Import Firebase auth from the app's module
        // We need to use dynamic import to access the module
        // The app exports auth from '@/lib/firebase'
        
        // First, check if auth state exists in localStorage
        const projectId = 'demo-test'; // Test project ID
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authStateStr = window.localStorage.getItem(authKey);
        
        if (!authStateStr) {
          // No auth state found
          return null;
        }
        
        try {
          const authState = JSON.parse(authStateStr);
          const accessToken = authState?.stsTokenManager?.accessToken;
          
          if (accessToken) {
            // We have the access token (ID token) directly from localStorage
            return accessToken;
          }
        } catch (e) {
          // Failed to parse auth state
        }
        
        // If we don't have the token in localStorage, try to get it from Firebase SDK
        // We need to access the auth instance from the app
        // Since we can't directly import from '@/lib/firebase', we'll use a workaround
        
        // Try to access auth via window if the app exposes it
        const windowAuth = (window as any).__FIREBASE_AUTH__;
        if (windowAuth) {
          const currentUser = windowAuth.currentUser;
          if (currentUser) {
            try {
              return await currentUser.getIdToken();
            } catch (e) {
              // Token refresh failed
            }
          }
        }
        
        // Last resort: try to dynamically import and use Firebase auth
        // This requires the app to be loaded and Firebase initialized
        try {
          // Wait a bit for Firebase to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try to get auth instance from Firebase app
          // We'll use the Firebase SDK directly if available
          const { getAuth } = await import('firebase/auth');
          const { getApps, initializeApp } = await import('firebase/app');
          
          // Get or initialize the app
          const apps = getApps();
          let app;
          if (apps.length > 0) {
            app = apps[0];
          } else {
            // Initialize with test config
            app = initializeApp({
              apiKey: 'test-api-key',
              authDomain: 'localhost',
              projectId: 'demo-test',
              storageBucket: 'demo-test.appspot.com',
              messagingSenderId: '123456789',
              appId: '1:123456789:web:test'
            });
          }
          
          const auth = getAuth(app);
          const currentUser = auth.currentUser;
          
          if (currentUser) {
            return await currentUser.getIdToken();
          }
        } catch (e) {
          // Failed to import or use Firebase SDK
          console.warn('Failed to get token via Firebase SDK:', e);
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
    
    // Wait a bit and try again (sometimes Firebase needs time to initialize)
    await page.waitForTimeout(1000);
    
    // Retry: get token from localStorage directly
    const retryToken = await page.evaluate(async () => {
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

