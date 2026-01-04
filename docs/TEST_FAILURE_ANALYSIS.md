# Test Failure Analysis

This document analyzes the issues found in the 6 failed E2E tests.

## Summary

**Test Results:**
- ✅ 1 test passed
- ❌ 6 tests failed
- Total: 7 tests executed

## Failed Tests Overview

1. **Admin Dashboard Test** - Authentication redirect issue
2. **Login Test** - User not found in Firebase Auth
3. **Student Applications Test** - Missing UI elements
4. **Student Supervisors Test** - Missing UI elements
5. **Supervisor Applications Test** - API request failure
6. **Supervisor Projects Test** - API request failure

---

## Issue 1: Admin Dashboard - Authentication Redirect Failure

**Test:** `e2e/tests/admin/dashboard.spec.ts`
**Error:** Expected URL `/authenticated/admin`, but received `http://localhost:3000/`

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

**Potential Solutions:**
1. Ensure `onAuthStateChanged` fires after auth injection
2. Verify `getUserProfile` API endpoint is accessible and returns correct data
3. Add longer wait times for redirect after auth injection
4. Check if Firebase SDK is properly initialized when auth is injected

---

## Issue 2: Login Test - User Not Found

**Test:** `e2e/tests/auth/login.spec.ts`
**Error:** "No account found with this email address."

**Root Cause:**
The test creates a user via `seedStudent()` which:
1. Creates a Firebase Auth user via `adminAuth.createUser()`
2. Creates Firestore documents (`users`, `students`)

However, when the login form tries to authenticate:
- The user may not exist in the Firebase Auth emulator
- There may be a timing issue where the user isn't fully created before login attempt
- The email/password combination may not match

**Evidence:**
- Error context shows: `"No account found with this email address."`
- Email in form: `student-1767552931375-751@test.example.com`
- Password: `TestPassword123!`

**Potential Solutions:**
1. Add a wait after `seedStudent()` to ensure user is fully created
2. Verify the user exists in Firebase Auth emulator before login
3. Check if there's a race condition between user creation and login
4. Ensure password is correctly set during user creation

---

## Issue 3 & 4: Student Tests - Missing UI Elements

**Tests:**
- `e2e/tests/student/applications.spec.ts` - Application cards not visible
- `e2e/tests/student/supervisors.spec.ts` - Supervisor cards not visible

**Error:** `element(s) not found` - Expected elements with `data-testid="application-card"` or `data-testid="supervisor-card"` not found

**Root Cause:**
These tests expect UI elements to be present, but they're not rendering. Possible reasons:
1. The pages may not be fully loading
2. The data may not be fetched from Firestore
3. The UI components may not be rendering the data
4. Authentication may not be complete, causing redirects

**Evidence:**
- Tests successfully navigate to `/authenticated/student/applications` and `/authenticated/student/supervisors`
- But the expected UI elements are not found

**Potential Solutions:**
1. Check if the pages are actually rendering the data
2. Verify Firestore queries are returning data
3. Check if there are loading states that need to complete
4. Verify the test data is being created correctly in Firestore
5. Check browser console for JavaScript errors

---

## Issue 5 & 6: Supervisor Tests - API Request Failures

**Tests:**
- `e2e/tests/supervisor/applications.spec.ts` - API request to `/api/applications` fails
- `e2e/tests/supervisor/projects.spec.ts` - API request to `/api/projects?supervisorId=...` fails

**Error:** `expect(response.ok()).toBeTruthy()` - Received `false`

**Root Cause:**
The `authenticatedRequest` helper is making API calls that are failing. Possible reasons:
1. **Authentication token not being retrieved correctly** - The `getAuthToken()` function may not be able to extract the token from the browser context
2. **Token not being sent in Authorization header** - The token may be null/undefined
3. **API endpoint authentication middleware failing** - The `withAuth` middleware may be rejecting the request
4. **API endpoint returning error responses** - The endpoints may be returning 4xx/5xx errors

**Evidence:**
- Tests fall back to API verification when UI elements aren't found
- API requests return `ok: false`, indicating HTTP error status

**API Endpoints:**
- `/api/applications` - Requires authentication (`withAuth`)
- `/api/projects?supervisorId=...` - Requires authentication (`withAuth`)

**Potential Solutions:**
1. **Fix `getAuthToken()` function** - It's trying multiple methods to get the token but may not be working with the modular Firebase SDK
2. **Verify token is in localStorage** - Check if the auth state is properly stored
3. **Check API middleware** - Verify `withAuth` is correctly validating tokens
4. **Add better error logging** - Log the actual HTTP status and error message from API responses
5. **Verify token format** - Ensure the token being sent matches what the API expects

---

## Common Patterns Across Failures

### 1. Authentication State Not Properly Detected

Multiple tests fail because the application doesn't recognize the authenticated state:
- Admin dashboard test: Not redirecting after auth injection
- Login test: User not found (may be auth emulator sync issue)

### 2. API Authentication Issues

The `authenticatedRequest` helper is failing to get/send auth tokens:
- Supervisor applications test: API request fails
- Supervisor projects test: API request fails

### 3. UI Elements Not Rendering

Some tests expect UI elements that aren't appearing:
- Student applications: Cards not visible
- Student supervisors: Cards not visible

---

## Recommended Investigation Steps

### 1. Verify Authentication Flow

```bash
# Check if users are being created in Firebase Auth emulator
# Access: http://localhost:4000 (Emulator UI)
# Navigate to Authentication section
```

### 2. Check API Endpoints Manually

```bash
# Get auth token from browser console after login
# Test API endpoint:
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/applications
```

### 3. Check Browser Console

Run tests with `--headed` flag to see browser console errors:
```bash
npm run test:e2e:headed
```

### 4. Verify Firestore Data

Check if test data is being created:
- Access Firestore emulator UI: http://localhost:4000
- Check `users`, `students`, `supervisors`, `applications`, `projects` collections

### 5. Check Server Logs

The Next.js dev server logs may show:
- API request errors
- Authentication failures
- Firestore query issues

---

## Priority Fixes

### High Priority

1. **Fix `getAuthToken()` function** - This affects multiple tests
   - File: `e2e/utils/auth-helpers.ts`
   - Issue: Not able to extract token from modular Firebase SDK

2. **Fix authentication redirect** - Admin dashboard test
   - File: `e2e/fixtures/auth.ts` - `authenticateUser()` function
   - Issue: `onAuthStateChanged` may not fire after localStorage injection

3. **Fix user creation timing** - Login test
   - File: `e2e/fixtures/db-helpers.ts` - `seedStudent()` function
   - Issue: Race condition between user creation and login

### Medium Priority

4. **Verify UI rendering** - Student tests
   - Check if pages are actually rendering data
   - Verify Firestore queries are working

5. **Improve error messages** - All tests
   - Add better logging to understand what's failing
   - Log API response status and body

### Low Priority

6. **Add retry logic** - For flaky tests
7. **Improve test data setup** - Ensure all required data is created

---

## Next Steps

1. **Run tests with verbose logging** to see detailed error messages
2. **Check browser console** during test execution for JavaScript errors
3. **Verify Firebase emulator data** to ensure test data is being created
4. **Test API endpoints manually** with Postman/curl to isolate issues
5. **Review authentication flow** in the application code to understand expected behavior

