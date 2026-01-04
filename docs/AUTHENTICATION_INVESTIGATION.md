# Authentication and Redirect Logic Investigation

## Summary

All 7 E2E tests are failing due to authentication and redirect issues. This document identifies the root causes.

## Root Causes Identified

### 1. **API Authorization Check Failing for Self-Profile Fetch**

**Location:** `app/api/users/[id]/route.ts`

**Issue:** The `/api/users/[id]` endpoint requires `requireOwnerOrAdmin: true`, which should allow users to fetch their own profile. However, the authorization check may be failing.

**Code Flow:**
1. User logs in → Firebase Auth state is set
2. Home page (`app/page.tsx`) detects authenticated user
3. Calls `getUserProfile(user.uid, token)` → calls `/api/users/${uid}`
4. API endpoint checks authorization: `user.uid === resourceId` (should be true for own profile)
5. **If this check fails, API returns 403 Forbidden**
6. `getUserProfile` catches error and returns `{ success: false, error: ... }`
7. Home page sees `profile.success === false` and doesn't redirect
8. User stays on home page or login page

**Why it might fail:**
- Token might not be sent correctly in the Authorization header
- Token might be invalid or expired
- The `context.params.id` might not match `user.uid` (unlikely but possible)
- Firebase Admin SDK might not be able to verify the token from the emulator

**Files to check:**
- `lib/api/client.ts` - How token is sent in Authorization header
- `lib/middleware/auth.ts` - How token is verified
- `app/api/users/[id]/route.ts` - Authorization check logic

### 2. **Login Page Redirect Logic**

**Location:** `app/login/page.tsx` (line 28)

**Issue:** After successful login, the page redirects to `/` (home page) instead of waiting for the home page to detect auth and redirect to role-specific dashboard.

**Code:**
```typescript
if (result.success) {
  setMessage('Login successful!')
  router.push('/')  // ← Redirects to home
}
```

**Expected Flow:**
1. Login succeeds
2. Redirect to `/`
3. Home page detects authenticated user
4. Fetches profile
5. Redirects to role-specific dashboard

**Actual Flow (when profile fetch fails):**
1. Login succeeds
2. Redirect to `/`
3. Home page detects authenticated user
4. **Profile fetch fails (see issue #1)**
5. **No redirect happens - user stays on home page**

**Why tests fail:**
- Test expects redirect to `/authenticated/student` but user stays on `/login` or `/`
- This suggests the profile fetch is failing silently

### 3. **Registration Success Message Not Displayed**

**Location:** `app/register/page.tsx` (line 76)

**Issue:** After successful registration, the page shows a success message and redirects to `/login` after 2 seconds. However, the test expects to see a success message on the login page, but the message might not be persisting.

**Code:**
```typescript
if (response.success) {
  setMessage('Registration successful! Redirecting to login...')
  setTimeout(() => {
    router.push('/login')
  }, 2000)
}
```

**Why test fails:**
- Test checks for success message on login page
- But the message is set on register page, not login page
- Login page doesn't receive the message

### 4. **API Calls Failing in Authenticated Tests**

**Location:** Multiple test files (supervisor/applications.spec.ts, supervisor/projects.spec.ts)

**Issue:** API calls are returning `response.ok() === false`, indicating 401 Unauthorized or 403 Forbidden errors.

**Why this happens:**
- Tests use `authenticatedRequest` helper to make API calls
- The helper might not be sending the token correctly
- Or the token might be invalid/expired
- Or the authorization check is failing (similar to issue #1)

**Files to check:**
- `e2e/utils/auth-helpers.ts` - How `authenticatedRequest` works
- API endpoints that are failing

## Detailed Analysis

### Authentication Flow

1. **Login Flow:**
   ```
   User submits login form
   → signIn(email, password) [lib/auth.ts]
   → Firebase Auth signInWithEmailAndPassword
   → Success: router.push('/') [app/login/page.tsx]
   → Home page loads [app/page.tsx]
   → onAuthChange detects user
   → getUserProfile(user.uid, token) [lib/auth.ts]
   → apiFetch('/users/${uid}', { token }) [lib/api/client.ts]
   → GET /api/users/[id] [app/api/users/[id]/route.ts]
   → withAuth middleware checks authorization
   → If authorized: returns user profile
   → If not authorized: returns 403 Forbidden
   → getUserProfile catches error → returns { success: false }
   → Home page sees success: false → doesn't redirect
   ```

2. **Test Fixture Authentication:**
   ```
   Test creates user via seedStudent()
   → Creates Firebase Auth user
   → Creates user document in Firestore
   → Creates custom token
   → Authenticates via signInWithCustomToken (in browser)
   → Sets auth state in localStorage
   → Reloads page
   → Should trigger onAuthStateChanged
   → Should fetch profile and redirect
   ```

### Potential Issues

1. **Token Verification in Emulator:**
   - Firebase Admin SDK might not be able to verify tokens from the emulator correctly
   - Check if `adminAuth.verifyIdToken()` works with emulator tokens

2. **Authorization Check Logic:**
   - The check `user.uid === resourceId` should work for self-profile fetch
   - But if `context.params.id` doesn't match the route param, it will fail
   - Check Next.js App Router param passing

3. **API Response Format:**
   - `apiFetch` returns the JSON response directly
   - If API returns `{ success: true, data: user }`, `apiFetch` returns that
   - `getUserProfile` returns that same object
   - Frontend checks `profile.success && profile.data.role`
   - This should work if API call succeeds

4. **Timing Issues:**
   - Profile fetch might happen before Firebase SDK is fully initialized
   - Token might not be ready immediately after login
   - Race conditions between auth state change and profile fetch

## Recommended Fixes

### Fix 1: Ensure API Authorization Works for Self-Profile Fetch

**File:** `app/api/users/[id]/route.ts`

**Current code:**
```typescript
export const GET = withAuth<UserIdParams>(
  async (request: NextRequest, { params }, user) => {
    const fetchedUser = await userService.getUserById(params.id);
    if (!fetchedUser) {
      return ApiResponse.notFound('User');
    }
    return ApiResponse.success(fetchedUser);
  },
  { requireOwnerOrAdmin: true }
);
```

**Check:**
- Verify that `context.params.id` correctly contains the user ID from the URL
- Verify that `user.uid` matches `params.id` for self-profile fetch
- Add logging to see what values are being compared

### Fix 2: Improve Error Handling in Profile Fetch

**File:** `app/page.tsx`

**Current code:**
```typescript
const profile = await Promise.race([profilePromise, timeoutPromise]).catch(() => null) as any
```

**Issue:** If profile fetch fails, it returns `null`, and the code doesn't handle this case well.

**Fix:** Add better error handling and logging to see why profile fetch is failing.

### Fix 3: Fix Registration Success Message

**File:** `app/register/page.tsx`

**Issue:** Success message is shown on register page but test expects it on login page.

**Fix:** Use URL query parameter or session storage to pass success message to login page.

### Fix 4: Verify Token Sending in API Calls

**File:** `lib/api/client.ts`

**Check:**
- Verify that `Authorization: Bearer ${token}` header is being sent correctly
- Verify that token is valid and not expired
- Add logging to see if token is being sent

## Next Steps

1. Add logging to trace the authentication flow
2. Check server logs when running tests to see API errors
3. Verify Firebase Admin SDK can verify emulator tokens
4. Test the `/api/users/[id]` endpoint directly with a valid token
5. Check if there are any CORS or network issues preventing API calls

## Test Evidence

From test failures:
- Login test: Stays on `/login` instead of redirecting to `/authenticated/student`
- Register test: No success message found (empty string)
- Admin dashboard: Stays on `/` instead of `/authenticated/admin`
- Student/Supervisor tests: API calls returning `response.ok() === false`

All failures point to the same root cause: **Profile fetch is failing, preventing redirects and API calls from working.**

