# Login Flow Mapping

## Overview
This document maps out the complete login flow in MentorMatch, identifying all components involved and the redundant API requests that occur during authentication.

---

## Login Flow Sequence

### Step 1: User Initiates Login
**Location:** `app/login/page.tsx`

**Action:**
- User enters email and password
- Form submission triggers `handleLogin()`
- Calls `signIn(email, password)` from `lib/auth.ts`

**Code Reference:**
```40:58:app/login/page.tsx
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setMessage('Login successful!')
        router.push('/')
      } else {
        setMessage(`${result.error}`)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
```

---

### Step 2: Firebase Authentication
**Location:** `lib/auth.ts`

**Action:**
- `signIn()` calls Firebase `signInWithEmailAndPassword(auth, email, password)`
- On success, Firebase auth state changes
- Returns `{ success: true, user: userCredential.user }`

**Code Reference:**
```16:24:lib/auth.ts
export const signIn = async (email: string, password: string) => {
  // Firebase Auth
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: getFirebaseErrorMessage(error) };
  }
};
```

**API Calls:** None (Firebase SDK handles authentication)

---

### Step 3: Redirect to Home Page
**Location:** `app/login/page.tsx`

**Action:**
- On successful login, user is redirected to `/` (home page)
- Firebase auth state change triggers `onAuthStateChanged` listeners

**Code Reference:**
```47:49:app/login/page.tsx
      if (result.success) {
        setMessage('Login successful!')
        router.push('/')
```

---

### Step 4: Firebase Auth State Change Triggers Multiple Listeners

When Firebase auth state changes, **4 different components** simultaneously listen via `onAuthChange()` and each makes a redundant `getUserProfile()` call:

---

## Redundant API Calls Analysis

### Call #1: Home Page (`app/page.tsx`)
**Location:** `app/page.tsx` (lines 13-100)

**Trigger:** `onAuthChange()` listener fires when user logs in

**Action Flow:**
1. Listens to `onAuthChange()`
2. Gets Firebase ID token: `user.getIdToken()`
3. Calls `getUserProfile(user.uid, token)` **with retry logic (3 attempts)**
4. On success, redirects user to role-specific page:
   - Student → `/authenticated/student`
   - Supervisor → `/authenticated/supervisor`
   - Admin → `/authenticated/admin`

**Code Reference:**
```13:100:app/page.tsx
  useEffect(() => {
    let mounted = true
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          
          // Try to fetch profile with retries
          let profile: any = null
          const maxRetries = 3
          const isTestEnv = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
          
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const profilePromise = getUserProfile(user.uid, token)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Increased timeout
              )
              
              profile = await Promise.race([profilePromise, timeoutPromise])
              
              if (profile?.success && profile?.data?.role) {
                break // Success, exit retry loop
              }
              
              // If profile fetch returned but without success, log it
              if (profile && !profile.success) {
                console.warn(`Profile fetch failed (attempt ${attempt + 1}/${maxRetries}):`, profile.error || 'Unknown error')
              }
            } catch (error: any) {
              console.warn(`Profile fetch error (attempt ${attempt + 1}/${maxRetries}):`, error?.message || error)
              profile = null
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < maxRetries - 1 && mounted) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
              // Refresh token for next attempt
              try {
                const newToken = await user.getIdToken(true) // Force refresh
                // Update token for next iteration (token is already captured in closure)
              } catch {
                // Token refresh failed, continue with existing token
              }
            }
          }
          
          if (mounted && profile?.success && profile?.data?.role) {
            // Redirect authenticated users directly to their role-specific page
            const role = profile.data.role
            switch (role) {
              case 'student':
                router.replace('/authenticated/student')
                return
              case 'supervisor':
                router.replace('/authenticated/supervisor')
                return
              case 'admin':
                router.replace('/authenticated/admin')
                return
              default:
                console.warn(`Unknown role: ${role}`)
                if (mounted) setLoading(false)
                return
            }
          } else {
            // Profile fetch failed after all retries
            console.error('Failed to fetch user profile after retries:', {
              success: profile?.success,
              error: profile?.error,
              hasData: !!profile?.data,
              hasRole: !!profile?.data?.role
            })
            if (mounted) setLoading(false)
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error)
          if (mounted) setLoading(false)
        }
      } else {
        if (mounted) setLoading(false)
      }
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [router])
```

**API Endpoint Called:** `GET /api/users/{uid}`
**Special Notes:** Includes retry logic with exponential backoff (up to 3 attempts)

---

### Call #2: Authenticated Layout (`app/authenticated/layout.tsx`)
**Location:** `app/authenticated/layout.tsx` (lines 24-93)

**Trigger:** `onAuthChange()` listener fires when user logs in

**Action Flow:**
1. Listens to `onAuthChange()`
2. Gets Firebase ID token: `user.getIdToken()`
3. Calls `getUserProfile(user.uid, token)`
4. Sets user and userProfile state for layout
5. Shows loading spinner until profile is fetched

**Code Reference:**
```24:93:app/authenticated/layout.tsx
  useEffect(() => {
    const isTestEnv = typeof window !== 'undefined' && 
      (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
    
    // Timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[AUTH LAYOUT] Loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    const unsubscribe = onAuthChange(async (user) => {
      if (isTestEnv) {
        console.log('[AUTH LAYOUT] onAuthChange called with user:', user ? { uid: user.uid, email: user.email } : null);
      }
      
      if (!user) {
        if (isTestEnv) {
          console.log('[AUTH LAYOUT] No user, redirecting to /');
        }
        router.replace('/');
        return;
      }

      try {
        const token = await user.getIdToken();
        if (isTestEnv) {
          console.log('[AUTH LAYOUT] Got token, fetching profile for uid:', user.uid);
        }
        
        const profile = await getUserProfile(user.uid, token);
        
        if (isTestEnv) {
          console.log('[AUTH LAYOUT] Profile fetch result:', { success: profile.success, hasData: !!profile.data, error: profile.error });
        }
        
        if (profile.success && profile.data) {
          setUser(user);
          setUserProfile(profile.data);
        } else {
          if (isTestEnv) {
            console.error('[AUTH LAYOUT] Profile fetch failed:', profile.error);
            // In test mode, set user anyway to allow page to render
            // The page-level auth checks will handle authorization
            setUser(user);
            setUserProfile({ uid: user.uid, email: user.email, role: 'admin' }); // Default role for test
          } else {
            router.replace('/');
          }
        }
      } catch (error: any) {
        if (isTestEnv) {
          console.error('[AUTH LAYOUT] Error in auth flow:', error);
          // In test mode, set user anyway to allow page to render
          setUser(user);
          setUserProfile({ uid: user.uid, email: user.email, role: 'admin' }); // Default role for test
        } else {
          router.replace('/');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [router, loading]);
```

**API Endpoint Called:** `GET /api/users/{uid}`
**Special Notes:** Has 10-second timeout for loading state

---

### Call #3: useAuth Hook (`lib/hooks/useAuth.ts`)
**Location:** `lib/hooks/useAuth.ts` (lines 73-105)

**Trigger:** `onAuthChange()` listener fires when user logs in

**Action Flow:**
1. Listens to `onAuthChange()`
2. Gets Firebase ID token: `user.getIdToken()`
3. Calls `getUserProfile(user.uid, token)`
4. Verifies user role and handles role-based redirects
5. Sets userId and userProfile state
6. Returns auth state to consuming components

**Code Reference:**
```73:105:lib/hooks/useAuth.ts
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      // Get user profile to verify role
      const token = await user.getIdToken();
      const profile = await getUserProfile(user.uid, token);

      if (!profile.success || !profile.data) {
        router.replace(ROUTES.HOME);
        return;
      }

      const userRole = profile.data.role as UserRole;

      // If expectedRole is specified, check if user has the correct role
      if (options?.expectedRole && userRole !== options.expectedRole) {
        // Redirect to the appropriate page based on user's actual role
        const redirectTo = ROLE_ROUTES[userRole] || ROUTES.HOME;
        router.replace(redirectTo);
        return;
      }

      setUserId(user.uid);
      setUserProfile(profile.data as BaseUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router, options?.expectedRole]);
```

**API Endpoint Called:** `GET /api/users/{uid}`
**Special Notes:** Used by authenticated pages for role-based access control

---

### Call #4: Header Component (`app/components/Header.tsx`)
**Location:** `app/components/Header.tsx` (lines 22-36)

**Trigger:** `onAuthChange()` listener fires when user logs in

**Action Flow:**
1. Listens to `onAuthChange()`
2. Gets Firebase ID token: `user.getIdToken()`
3. Calls `getUserProfile(user.uid, token)`
4. Sets userProfile state for displaying user info in header (avatar, name, dropdown menu)

**Code Reference:**
```22:36:app/components/Header.tsx
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        const token = await user.getIdToken()
        const profile = await getUserProfile(user.uid, token)
        if (profile.success) {
          setUserProfile(profile.data)
        }
      } else {
        setUserProfile(null)
      }
    })
    return () => unsubscribe()
  }, [])
```

**API Endpoint Called:** `GET /api/users/{uid}`
**Special Notes:** Used for UI display only (user name, avatar, navigation links)

---

## API Endpoint Details

### getUserProfile Function
**Location:** `lib/auth.ts` (lines 37-62)

**Implementation:**
```37:62:lib/auth.ts
export const getUserProfile = async (uid: string, token: string) => {
  try {
    const response = await apiFetch(`/users/${uid}`, { token });
    
    // Ensure response has the expected format
    if (response && typeof response === 'object') {
      // If apiFetch returns the response directly, it should have success and data
      if (response.success !== undefined) {
        return response;
      }
      // If it's just the data object, wrap it
      if (response.data) {
        return { success: true, data: response.data };
      }
      // If it's the user object directly, wrap it
      return { success: true, data: response };
    }
    
    return { success: false, error: 'Invalid response format' };
  } catch (error: any) {
    // Provide more detailed error information
    const errorMessage = error?.message || 'Failed to fetch user profile';
    console.warn('getUserProfile error:', { uid, error: errorMessage });
    return { success: false, error: errorMessage };
  }
};
```

**API Endpoint:** `GET /api/users/{uid}`
**Headers:** `Authorization: Bearer {token}`

---

## Complete Login Flow Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│ User submits login form                                         │
│ Location: app/login/page.tsx                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ signIn() called                                                 │
│ Location: lib/auth.ts                                           │
│ Action: Firebase signInWithEmailAndPassword()                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Firebase auth state changes                                     │
│ onAuthStateChanged fires                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────────┐    ┌───────────────────┐
│ app/page.tsx      │    │ Header Component  │
│ onAuthChange()    │    │ onAuthChange()    │
│                   │    │                   │
│ getUserProfile()  │    │ getUserProfile()  │
│ (with retries)    │    │                   │
│                   │    │ API Call #4       │
│ API Call #1       │    └───────────────────┘
│                   │
│ Redirects to      │
│ /authenticated/*  │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ User lands on authenticated page                                 │
│ (e.g., /authenticated/student)                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────────┐    ┌───────────────────┐
│ Layout Component  │    │ Page Component    │
│ onAuthChange()    │    │ useAuth() hook    │
│                   │    │                   │
│ getUserProfile()  │    │ getUserProfile()  │
│                   │    │                   │
│ API Call #2       │    │ API Call #3       │
└───────────────────┘    └───────────────────┘
```

---

## Summary of Redundant Requests

### Total API Calls on Login: **4 identical requests**

| # | Component | Location | Purpose | Retry Logic | Timing |
|---|-----------|----------|---------|-------------|--------|
| 1 | Home Page | `app/page.tsx` | Role-based redirect | ✅ Yes (3 attempts) | Immediate after login |
| 2 | Layout | `app/authenticated/layout.tsx` | Layout state management | ❌ No | When landing on authenticated page |
| 3 | useAuth Hook | `lib/hooks/useAuth.ts` | Role verification & access control | ❌ No | When page uses useAuth() |
| 4 | Header | `app/components/Header.tsx` | UI display (name, avatar) | ❌ No | Immediate after login |

**All calls:** `GET /api/users/{uid}` with same token

---

## Impact Analysis

### Performance Impact
- **4x unnecessary network requests** for the same data
- **Increased server load** - 4 database queries for identical user data
- **Slower page load** - Multiple parallel requests compete for resources
- **Potential race conditions** - All 4 calls happen simultaneously

### User Experience Impact
- **Delayed page rendering** - Components wait for their own profile fetch
- **Inconsistent loading states** - Different components show loading at different times
- **Potential UI flicker** - Components update independently

### Code Maintainability Impact
- **Duplicate logic** - Same profile fetching code in 4 places
- **Hard to debug** - Multiple sources of truth for user profile
- **Difficult to optimize** - Changes require updates in 4 locations

---

## Current State vs. Ideal State

### Current State
```
Login → Firebase Auth Change → 4x getUserProfile() calls → 4x API requests
```

### Ideal State
```
Login → Firebase Auth Change → 1x getUserProfile() call → 1x API request → Shared context
```

---

## Recommendations for Consolidation

### Option 1: AuthContext (Recommended)
- Create a single `AuthContext` that fetches user profile once
- Store profile in React Context
- All components consume from context instead of fetching independently
- **Expected reduction:** 4 requests → 1 request

### Option 2: Shared State Management
- Use a state management library (Zustand, Redux, etc.)
- Fetch profile once and store in global state
- Components subscribe to state changes
- **Expected reduction:** 4 requests → 1 request

### Option 3: Server-Side Session
- Include user profile in JWT token or session
- Eliminate need for separate profile fetch
- **Expected reduction:** 4 requests → 0 requests (profile in token)

---

## Next Steps

1. **Review this mapping** to confirm accuracy
2. **Decide on consolidation approach** (AuthContext recommended)
3. **Implement single source of truth** for user profile
4. **Remove redundant calls** from all 4 locations
5. **Test login flow** to ensure functionality is maintained
6. **Monitor API calls** to verify reduction

---

## Notes

- The `app/page.tsx` call includes retry logic, which could result in **up to 3 additional requests** if the first attempt fails
- All components use the same `getUserProfile()` function, ensuring consistency in API endpoint and request format
- The Header component call is the least critical as it's only for UI display
- The useAuth hook is used by multiple pages, so removing its call would require careful refactoring

