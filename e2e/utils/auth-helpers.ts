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
    // Get token from Firebase SDK's currentUser (preferred method)
    // Also check localStorage and sessionStorage as fallbacks
    const token = await page.evaluate(async () => {
      try {
        // First, try to get token from Firebase SDK's currentUser
        // This works when we use signInWithCustomToken
        try {
          const { getAuth } = await import('firebase/auth');
          const { getApps } = await import('firebase/app');
          
          const apps = getApps();
          if (apps.length > 0) {
            const auth = getAuth(apps[0]);
            // Wait a bit for auth state to be available
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (auth.currentUser) {
              try {
                const idToken = await auth.currentUser.getIdToken(false);
                if (idToken) {
                  return idToken;
                }
              } catch (e) {
                // Token retrieval failed, try to refresh
                try {
                  const idToken = await auth.currentUser.getIdToken(true);
                  if (idToken) {
                    return idToken;
                  }
                } catch (refreshError) {
                  // Token refresh failed, continue to fallbacks
                }
              }
            }
          }
        } catch (e) {
          // Firebase SDK not available or error, continue to fallbacks
        }
        
        // Fallback 1: Check localStorage (legacy Firebase SDK format)
        const projectId = 'demo-test';
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authStateStr = window.localStorage.getItem(authKey);
        
        if (authStateStr) {
          try {
            const authState = JSON.parse(authStateStr);
            // Return the ID token (accessToken in Firebase's format)
            if (authState?.stsTokenManager?.accessToken) {
              return authState.stsTokenManager.accessToken;
            }
          } catch (e) {
            // Invalid JSON, continue
          }
        }
        
        // Fallback 2: Check sessionStorage (REST API fallback method)
        const testToken = sessionStorage.getItem('__test_id_token__');
        if (testToken) {
          return testToken;
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
    await page.waitForTimeout(1500);
    
    // Retry once more with longer wait
    const retryToken = await page.evaluate(async () => {
      try {
        // Try Firebase SDK again with longer wait
        try {
          const { getAuth } = await import('firebase/auth');
          const { getApps } = await import('firebase/app');
          
          const apps = getApps();
          if (apps.length > 0) {
            const auth = getAuth(apps[0]);
            // Wait longer for auth state
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (auth.currentUser) {
              try {
                const idToken = await auth.currentUser.getIdToken(false);
                if (idToken) {
                  return idToken;
                }
              } catch (e) {
                // Try refresh
                try {
                  const idToken = await auth.currentUser.getIdToken(true);
                  if (idToken) {
                    return idToken;
                  }
                } catch (refreshError) {
                  // Continue to fallbacks
                }
              }
            }
          }
        } catch (e) {
          // Continue to fallbacks
        }
        
        // Check localStorage
        const projectId = 'demo-test';
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authStateStr = window.localStorage.getItem(authKey);
        if (authStateStr) {
          try {
            const authState = JSON.parse(authStateStr);
            if (authState?.stsTokenManager?.accessToken) {
              return authState.stsTokenManager.accessToken;
            }
          } catch (e) {
            // Invalid JSON
          }
        }
        
        // Check sessionStorage
        const testToken = sessionStorage.getItem('__test_id_token__');
        if (testToken) {
          return testToken;
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
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'e2e/utils/auth-helpers.ts:330',message:'authenticatedRequest called',data:{method,url,hasToken:!!token,tokenLength:token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'e2e/utils/auth-helpers.ts:340',message:'No auth token available',data:{method,url},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
  }
  
  // Make the request
  const requestOptions: any = {
    headers,
    timeout: options.timeout || 30000,
  };
  
  if (options.data) {
    requestOptions.data = options.data;
  }
  
  let response;
  switch (method) {
    case 'GET':
      response = await page.request.get(url, requestOptions);
      break;
    case 'POST':
      response = await page.request.post(url, requestOptions);
      break;
    case 'PUT':
      response = await page.request.put(url, requestOptions);
      break;
    case 'DELETE':
      response = await page.request.delete(url, requestOptions);
      break;
    case 'PATCH':
      response = await page.request.patch(url, requestOptions);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'e2e/utils/auth-helpers.ts:357',message:'authenticatedRequest response',data:{method,url,status:response.status(),ok:response.ok()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  return response;
}

