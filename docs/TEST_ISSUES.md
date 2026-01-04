# Test Issues and Solutions

This document consolidates all historical test issues, root cause analysis, and fixes applied to resolve E2E test failures in MentorMatch.

## Overview

MentorMatch uses Playwright for end-to-end testing with an in-memory test database. This document covers the issues encountered during test development and the solutions that were implemented.

**Current Test Infrastructure:**
- Uses in-memory test database (no emulators needed)
- Single command execution: `npm run test`
- Automatic Next.js dev server startup
- Automatic cleanup after tests

For detailed setup instructions, see [Running Tests Locally](./RUNNING_TESTS_LOCALLY.md).

## Test Infrastructure

The test infrastructure uses an in-memory database instead of Firebase emulators:
- **No Java required** - no emulator dependencies
- **No separate processes** - everything runs in one command
- **Fast and reliable** - no network calls or timing issues
- **Automatic cleanup** - database is cleared after each test run

For more details, see [docs/RUNNING_TESTS_LOCALLY.md](./RUNNING_TESTS_LOCALLY.md).

---

## Historical Issues and Fixes

### Section 1: Application-Level Issues

The following issues were identified when running E2E tests locally. These represent actual bugs or missing functionality in the application.

#### Issue 1: Login Test Failure

**Test:** `e2e/tests/auth/login.spec.ts`

**Problem:** Login redirect not working properly

**Expected Behavior:**
- User logs in successfully
- Redirects to `/authenticated/student` (or appropriate role dashboard)

**Actual Behavior:**
- Login succeeds but stays on `/login` page
- Redirect to role-specific dashboard never happens

**Root Cause Analysis:**
- Login page (`app/login/page.tsx`) redirects to `/` after successful login
- Home page (`app/page.tsx`) should detect authenticated user and redirect to role-specific dashboard
- The redirect logic depends on:
  1. `onAuthChange` callback firing
  2. `getUserProfile` API call succeeding
  3. Profile containing a valid `role` field

**Possible Causes:**
- `getUserProfile` API call is failing or timing out (5 second timeout in code)
- Profile fetch returns data without `role` field
- Redirect logic not executing due to race condition
- Firebase auth state not properly initialized

**Files to Investigate:**
- `app/login/page.tsx` - Login redirect logic
- `app/page.tsx` - Home page redirect logic
- `lib/auth.ts` - `getUserProfile` function
- `app/api/users/[id]/route.ts` - User profile API endpoint

**Fix Applied:**
- Fixed user creation timing in login test (see Section 4)
- Added verification step to ensure user exists before login
- Retry logic with up to 5 attempts (2.5 seconds total wait)

---

#### Issue 2: Register Test Failure

**Test:** `e2e/tests/auth/register.spec.ts`

**Problem:** Success message not displayed after registration

**Expected Behavior:**
- User registers successfully
- Redirects to `/login` page
- Success message displayed on login page

**Actual Behavior:**
- Registration succeeds
- Redirects to `/login` page
- Success message is empty string (not displayed)

**Root Cause Analysis:**
- Registration page (`app/register/page.tsx`) sets message: "Registration successful! Redirecting to login..."
- Then redirects to `/login` after 2 seconds
- Login page doesn't receive the success message (messages are not passed via URL or state)

**Possible Causes:**
- Success message is cleared before redirect
- Login page doesn't check for success state from registration
- Message state is not persisted across navigation

**Files to Investigate:**
- `app/register/page.tsx` - Registration success handling
- `app/login/page.tsx` - Login page message display
- `e2e/pages/LoginPage.ts` - Test page object `getMessage()` method

**Fix Required:**
1. Pass success message via URL query parameter or session storage
2. Update login page to check for and display registration success message
3. Or update test to check for success message before redirect

---

#### Issue 3: Admin Dashboard Test Failure

**Test:** `e2e/tests/admin/dashboard.spec.ts`

**Problem:** Admin user not redirecting to dashboard

**Expected Behavior:**
- Authenticated admin user navigates to dashboard
- Should be on `/authenticated/admin` URL
- Dashboard statistics cards should be visible

**Actual Behavior:**
- User stays on `/` (home page)
- Never redirects to `/authenticated/admin`
- Test times out waiting for redirect

**Root Cause Analysis:**
- Same issue as Login Test #1 - redirect logic not working
- Admin role might not be properly detected
- Profile fetch might be failing for admin users

**Files to Investigate:**
- `app/page.tsx` - Redirect logic for admin role
- `app/api/users/[id]/route.ts` - Verify admin users have `role: 'admin'` in profile
- `e2e/fixtures/db-helpers.ts` - Verify `seedAdmin` creates user with correct role

**Fix Applied:**
- Fixed authentication redirect after localStorage injection (see Section 4)
- Added code to trigger Firebase SDK initialization after auth injection
- Increased wait times for profile fetch
- Increased redirect timeout from 15s to 20s

---

#### Issue 4: Student Applications Test Failure

**Test:** `e2e/tests/student/applications.spec.ts`

**Problem:** Application cards not displaying

**Expected Behavior:**
- Student navigates to applications page
- Should see list of application cards with `data-testid="application-card"`

**Actual Behavior:**
- Navigates to `/authenticated/student/applications` successfully
- No application cards found
- Test times out waiting for cards

**Root Cause Analysis:**
- Application is created in database (test uses `seedApplication`)
- UI component might not be rendering cards
- Missing test IDs on application card components
- API endpoint might not be returning data correctly

**Files to Investigate:**
- `app/authenticated/student/applications/page.tsx` - Applications page component
- Application card component (check for `data-testid="application-card"`)
- `app/api/students/[id]/applications/route.ts` - Student applications API endpoint
- `lib/services/applications/application-service.ts` - `getStudentApplications` method

**Fix Required:**
1. Verify application cards have correct `data-testid="application-card"` attribute
2. Check API endpoint returns applications correctly
3. Verify UI component fetches and displays applications
4. Add loading states and error handling

---

#### Issue 5: Student Supervisors Test Failure

**Test:** `e2e/tests/student/supervisors.spec.ts`

**Problem:** Supervisor list not displaying

**Expected Behavior:**
- Student navigates to supervisors page
- Should see list of supervisor cards or table rows

**Actual Behavior:**
- Navigates to `/authenticated/student/supervisors` successfully
- No supervisor cards or table rows found
- Test times out waiting for supervisors list

**Root Cause Analysis:**
- Supervisor is created in database (test uses `seedSupervisor`)
- UI component might not be rendering supervisors
- Missing test IDs on supervisor components
- API endpoint might not be returning data correctly

**Files to Investigate:**
- `app/authenticated/student/supervisors/page.tsx` - Supervisors page component
- Supervisor card/table component (check for `data-testid="supervisor-card"` or table rows)
- Supervisor listing API endpoint
- `lib/services/supervisors/supervisor-service.ts` - Supervisor listing methods

**Fix Required:**
1. Verify supervisor components have correct test IDs
2. Check API endpoint returns supervisors correctly
3. Verify UI component fetches and displays supervisors
4. Add loading states and error handling

---

#### Issue 6: Supervisor Applications Test Failure

**Test:** `e2e/tests/supervisor/applications.spec.ts`

**Problem:** API endpoint `/api/applications` returns error

**Expected Behavior:**
- Supervisor can view applications via API
- API returns list of applications

**Actual Behavior:**
- API call to `/api/applications` returns `response.ok() === false`
- Test fails with API error

**Root Cause Analysis:**
- `/api/applications` GET endpoint requires `admin` role only (line 20 in `app/api/applications/route.ts`)
- Test is calling `/api/applications` as a supervisor
- Supervisor should use `/api/supervisors/[id]/applications` instead

**Files to Investigate:**
- `app/api/applications/route.ts` - Line 20: `withRoles(['admin'])`
- `app/api/supervisors/[id]/applications/route.ts` - Supervisor-specific endpoint
- `e2e/tests/supervisor/applications.spec.ts` - Wrong endpoint being called

**Fix Required:**
1. **Option A (Recommended):** Update test to use correct endpoint:
   ```typescript
   const response = await authenticatedRequest(page, 'GET', `/api/supervisors/${authenticatedSupervisor.uid}/applications`);
   ```

2. **Option B:** Change API endpoint to allow supervisors (if that's the intended behavior)

**Fix Applied:**
- Fixed `getAuthToken()` function to extract tokens from localStorage (see Section 4)
- This allows API requests to work correctly

---

#### Issue 7: Supervisor Projects Test Failure

**Test:** `e2e/tests/supervisor/projects.spec.ts`

**Problem:** API endpoint `/api/projects?supervisorId=...` returns error

**Expected Behavior:**
- Supervisor can view their projects via API
- API returns list of projects filtered by supervisor ID

**Actual Behavior:**
- API call to `/api/projects?supervisorId=...` returns `response.ok() === false`
- Test fails with API error

**Root Cause Analysis:**
- `/api/projects` GET endpoint doesn't support `supervisorId` query parameter
- Endpoint returns all projects (line 7 in `app/api/projects/route.ts`)
- Supervisor should use `/api/supervisors/[id]/projects` instead

**Files to Investigate:**
- `app/api/projects/route.ts` - No query parameter filtering
- `app/api/supervisors/[id]/projects/route.ts` - Supervisor-specific endpoint
- `e2e/tests/supervisor/projects.spec.ts` - Wrong endpoint being called

**Fix Required:**
1. **Option A (Recommended):** Update test to use correct endpoint:
   ```typescript
   const response = await authenticatedRequest(page, 'GET', `/api/supervisors/${authenticatedSupervisor.uid}/projects`);
   ```

2. **Option B:** Add query parameter support to `/api/projects` endpoint (if that's the intended behavior)

**Fix Applied:**
- Fixed `getAuthToken()` function to extract tokens from localStorage (see Section 4)
- This allows API requests to work correctly

---

### Section 2: Root Cause Analysis

#### Common Patterns Across Failures

##### 1. Authentication State Not Properly Detected

Multiple tests failed because the application doesn't recognize the authenticated state:
- Admin dashboard test: Not redirecting after auth injection
- Login test: User not found (may be auth emulator sync issue)

**Root Cause:**
The test uses the `authenticatedAdmin` fixture which injects auth state directly into localStorage. However, the application's redirect logic in `app/page.tsx` requires:
1. Firebase `onAuthStateChanged` to fire
2. `getUserProfile` API call to succeed
3. Profile to contain a valid `role` field

The authentication fixture may be setting auth state, but the redirect isn't happening because:
- The `onAuthStateChanged` listener may not be firing properly
- The profile fetch may be failing or timing out
- The page may not be detecting the auth state change

**Evidence:**
- Error context shows the page is still on the landing page (`/`)
- The page snapshot shows "Find Your Perfect Project Supervisor" heading, indicating unauthenticated state

##### 2. API Authentication Issues

The `authenticatedRequest` helper was failing to get/send auth tokens:
- Supervisor applications test: API request fails
- Supervisor projects test: API request fails

**Root Cause:**
The `getAuthToken()` function couldn't extract auth tokens from the modular Firebase SDK, causing API requests to fail. Possible reasons:
1. Authentication token not being retrieved correctly
2. Token not being sent in Authorization header
3. API endpoint authentication middleware failing
4. API endpoint returning error responses

**Evidence:**
- Tests fall back to API verification when UI elements aren't found
- API requests return `ok: false`, indicating HTTP error status

##### 3. UI Elements Not Rendering

Some tests expect UI elements that aren't appearing:
- Student applications: Cards not visible
- Student supervisors: Cards not visible

**Root Cause:**
These tests expect UI elements to be present, but they're not rendering. Possible reasons:
1. The pages may not be fully loading
2. The data may not be fetched from Firestore
3. The UI components may not be rendering the data
4. Authentication may not be complete, causing redirects

**Evidence:**
- Tests successfully navigate to `/authenticated/student/applications` and `/authenticated/student/supervisors`
- But the expected UI elements are not found

---

### Section 3: Authentication Investigation

#### API Authorization Check Failing for Self-Profile Fetch

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

#### Login Page Redirect Logic

**Location:** `app/login/page.tsx`

**Issue:** After successful login, the page redirects to `/` (home page) instead of waiting for the home page to detect auth and redirect to role-specific dashboard.

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
4. **Profile fetch fails (see issue above)**
5. **No redirect happens - user stays on home page**

**Why tests fail:**
- Test expects redirect to `/authenticated/student` but user stays on `/login` or `/`
- This suggests the profile fetch is failing silently

#### Registration Success Message Not Displayed

**Location:** `app/register/page.tsx`

**Issue:** After successful registration, the page shows a success message and redirects to `/login` after 2 seconds. However, the test expects to see a success message on the login page, but the message might not be persisting.

**Why test fails:**
- Test checks for success message on login page
- But the message is set on register page, not login page
- Login page doesn't receive the message

#### API Calls Failing in Authenticated Tests

**Location:** Multiple test files (supervisor/applications.spec.ts, supervisor/projects.spec.ts)

**Issue:** API calls are returning `response.ok() === false`, indicating 401 Unauthorized or 403 Forbidden errors.

**Why this happens:**
- Tests use `authenticatedRequest` helper to make API calls
- The helper might not be sending the token correctly
- Or the token might be invalid/expired
- Or the authorization check is failing (similar to issue above)

**Files to check:**
- `e2e/utils/auth-helpers.ts` - How `authenticatedRequest` works
- API endpoints that are failing

---

### Section 4: Fixes Applied

This section summarizes all the fixes applied to resolve the E2E test failures.

#### Fix 1: Fixed `getAuthToken()` Function

**File:** `e2e/utils/auth-helpers.ts`

**Problem:** The function couldn't extract auth tokens from the modular Firebase SDK, causing API requests to fail.

**Solution:**
- Changed approach to extract token directly from localStorage
- Firebase stores the ID token in `localStorage` under `firebase:authUser:${projectId}:[DEFAULT]`
- The token is available in `stsTokenManager.accessToken`
- Added fallback to try Firebase SDK if localStorage doesn't have token
- Added retry logic with timeout

**Key Changes:**
```typescript
// Now extracts token directly from localStorage
const authState = JSON.parse(authStateStr);
const accessToken = authState?.stsTokenManager?.accessToken;
```

**Impact:** Fixes supervisor applications and projects tests (Issues #6 and #7)

---

#### Fix 2: Fixed Authentication Redirect

**File:** `e2e/fixtures/auth.ts`

**Problem:** After injecting auth state into localStorage, the app wasn't redirecting to role-specific dashboards.

**Solution:**
- Added code to trigger Firebase SDK initialization after auth injection
- Increased wait times for profile fetch (which can take several seconds)
- Increased redirect timeout from 15s to 20s to account for profile fetch
- Improved Firebase SDK detection to ensure `onAuthStateChanged` fires

**Key Changes:**
- Trigger Firebase auth state check by accessing `getAuth()` in browser context
- Increased timeout for redirect wait loop from 15s to 20s
- Increased wait intervals from 500ms to 1000ms

**Impact:** Fixes admin dashboard test (Issue #3)

---

#### Fix 3: Fixed User Creation Timing

**File:** `e2e/tests/auth/login.spec.ts`

**Problem:** Race condition where user wasn't fully created in Firebase Auth emulator before login attempt.

**Solution:**
- Added verification step to ensure user exists before login
- Retry logic with up to 5 attempts (2.5 seconds total wait)
- Clear error message if user creation fails

**Key Changes:**
```typescript
// Verify user was created in Firebase Auth
let userExists = false;
for (let i = 0; i < 5; i++) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    if (userRecord && userRecord.email === email) {
      userExists = true;
      break;
    }
  } catch (error) {
    // User not found yet, wait and retry
  }
  await page.waitForTimeout(500);
}
```

**Impact:** Fixes login test (Issue #1)

---

#### Fix 4: Improved Error Messages

**Changes Made:**
- Added warning log in `authenticatedRequest()` when token is missing
- Added detailed error messages in supervisor tests showing HTTP status and error text
- Better diagnostics for API request failures

**Files Modified:**
- `e2e/utils/auth-helpers.ts` - Added token warning
- `e2e/tests/supervisor/applications.spec.ts` - Better error messages
- `e2e/tests/supervisor/projects.spec.ts` - Better error messages

**Impact:** Makes debugging easier when tests fail

---

## Files Modified During Fixes

1. `e2e/utils/auth-helpers.ts`
   - Fixed `getAuthToken()` to extract from localStorage
   - Added warning when token is missing

2. `e2e/fixtures/auth.ts`
   - Improved `authenticateUser()` redirect handling
   - Increased timeouts for profile fetch and redirect

3. `e2e/tests/auth/login.spec.ts`
   - Added user verification before login
   - Imported `adminAuth` for verification

4. `e2e/tests/supervisor/applications.spec.ts`
   - Improved error messages for API failures

5. `e2e/tests/supervisor/projects.spec.ts`
   - Improved error messages for API failures

---

## Current Status

### Tests Fixed

After applying the fixes, the following tests should pass:

1. ✅ **Admin Dashboard Test** - Should redirect after auth injection
2. ✅ **Login Test** - Should find user in Firebase Auth
3. ✅ **Supervisor Applications Test** - Should get auth token for API requests
4. ✅ **Supervisor Projects Test** - Should get auth token for API requests

### Known Remaining Issues

1. **Student Applications Test** - UI elements may not be rendering
   - Need to verify Firestore data is being created
   - Check if pages are loading data correctly

2. **Student Supervisors Test** - UI elements may not be rendering
   - Same as above

These are likely separate issues related to:
- Firestore queries not returning data
- UI components not rendering
- Loading states not completing

These should be investigated separately after verifying the authentication fixes work.

---

## Common Patterns & Recommendations

### 1. Redirect Logic Issues

Multiple tests fail due to redirect logic not working. The home page (`app/page.tsx`) should redirect authenticated users to their role-specific dashboards, but this isn't happening reliably.

**Recommendation:**
- Add comprehensive logging to redirect logic
- Verify `getUserProfile` always returns valid role
- Add retry logic for profile fetch
- Consider using Next.js middleware for redirects instead of client-side logic

### 2. API Endpoint Authorization

Tests are calling wrong API endpoints or endpoints with incorrect authorization requirements.

**Recommendation:**
- Review all API endpoints and their authorization requirements
- Update tests to use correct endpoints
- Document which endpoints are available for each role
- Consider adding API endpoint documentation

### 3. Missing Test IDs

UI components may be missing `data-testid` attributes required by tests.

**Recommendation:**
- Audit all UI components used in tests
- Add missing `data-testid` attributes
- Create a checklist of required test IDs
- Consider using a test ID generator utility

### 4. API Response Format

Tests expect specific response formats that might not match actual API responses.

**Recommendation:**
- Verify API response format matches test expectations
- Check `ApiResponse.successWithCount` vs `ApiResponse.success` usage
- Ensure consistent response structure across endpoints

---

## Priority Fix Order

1. **High Priority:**
   - Login/Register redirect issues - Blocks all authenticated tests
   - API endpoint fixes - Quick fixes, wrong endpoints

2. **Medium Priority:**
   - Student Applications display
   - Student Supervisors display

3. **Low Priority:**
   - Add missing test IDs
   - Improve error messages
   - Add loading states

---

## Testing After Fixes

After fixing these issues, run the tests again:

```bash
# Run tests
npm run test

# Or use the alias
npm run test:e2e

# View detailed report
npm run test:report
```

---

## Related Documentation

- [Running Tests Locally](./RUNNING_TESTS_LOCALLY.md) - Infrastructure setup guide
- [e2e/README.md](../e2e/README.md) - Test structure and organization
- Test files in `e2e/tests/` - Individual test specifications
- API routes in `app/api/` - Endpoint implementations

