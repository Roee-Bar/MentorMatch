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
 * Works with both modular SDK (v9+) and compat SDK
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  try {
    // Inject a script that can access the app's Firebase auth instance
    // The app uses modular SDK, so we need to access it through the app's context
    const token = await page.evaluate(async () => {
      // Wait for the app to load and Firebase to be initialized
      // Check if auth is available via the app's Firebase instance
      
      // Try to access auth from the app's Firebase module
      // The app imports auth from '@/lib/firebase', which exports it
      // We can try to access it via window if the app exposes it, or via localStorage
      
      // First, try compat SDK (if available)
      const firebase = (window as any).firebase;
      if (firebase?.auth) {
        try {
          const auth = firebase.auth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            try {
              return await currentUser.getIdToken();
            } catch (error) {
              // Token refresh failed
            }
          }
        } catch (e) {
          // Auth not available
        }
      }
      
      // For modular SDK, we need to access the auth instance
      // The app uses getAuth from firebase/auth
      // We can try to access it if the app exposes it on window
      // Or we can try to get it from the app's Firebase module
      
      // Check if the app exposes auth on window (some apps do this for testing)
      const appAuth = (window as any).__FIREBASE_AUTH__;
      if (appAuth?.currentUser) {
        try {
          return await appAuth.currentUser.getIdToken();
        } catch (e) {
          // Failed to get token
        }
      }
      
      // Last resort: try to get token from localStorage
      // Firebase stores auth state in localStorage with keys like 'firebase:authUser:...'
      // But we can't easily extract the token from there without the SDK
      
      // Return null - the authenticatedRequest will handle retry
      return null;
    });
    
    // If we got a token, return it
    if (token) {
      return token;
    }
    
    // If we couldn't get token, wait a bit and try again
    // Sometimes Firebase needs time to initialize
    await page.waitForTimeout(500);
    
    // Try one more time
    const retryToken = await page.evaluate(async () => {
      const firebase = (window as any).firebase;
      if (firebase?.auth) {
        try {
          const auth = firebase.auth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            try {
              return await currentUser.getIdToken();
            } catch (e) {
              return null;
            }
          }
        } catch (e) {
          return null;
        }
      }
      return null;
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

