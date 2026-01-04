# Application Issues Identified from E2E Test Failures

This document outlines the application-level issues discovered when running E2E tests locally. These are separate from infrastructure setup issues and represent actual bugs or missing functionality in the application.

## Summary

All 7 E2E tests are currently failing due to application logic issues. The test infrastructure is working correctly (emulators, server, test framework), but the application has bugs that prevent tests from passing.

## Issues by Test

### 1. Login Test Failure (`e2e/tests/auth/login.spec.ts`)

**Issue:** Login redirect not working properly

**Expected Behavior:**
- User logs in successfully
- Redirects to `/authenticated/student` (or appropriate role dashboard)

**Actual Behavior:**
- Login succeeds but stays on `/login` page
- Redirect to role-specific dashboard never happens

**Root Cause Analysis:**
- Login page (`app/login/page.tsx`) redirects to `/` after successful login (line 28)
- Home page (`app/page.tsx`) should detect authenticated user and redirect to role-specific dashboard
- The redirect logic in `app/page.tsx` depends on:
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
- `app/page.tsx` - Home page redirect logic (lines 13-117)
- `lib/auth.ts` - `getUserProfile` function
- `app/api/users/[id]/route.ts` - User profile API endpoint

**Fix Required:**
1. Ensure `getUserProfile` returns profile with `role` field
2. Verify redirect logic in `app/page.tsx` executes correctly
3. Add better error handling and logging for profile fetch failures
4. Consider increasing timeout or adding retry logic

---

### 2. Register Test Failure (`e2e/tests/auth/register.spec.ts`)

**Issue:** Success message not displayed after registration

**Expected Behavior:**
- User registers successfully
- Redirects to `/login` page
- Success message displayed on login page

**Actual Behavior:**
- Registration succeeds
- Redirects to `/login` page
- Success message is empty string (not displayed)

**Root Cause Analysis:**
- Registration page (`app/register/page.tsx`) sets message: "Registration successful! Redirecting to login..." (line 76)
- Then redirects to `/login` after 2 seconds (line 78)
- Login page doesn't receive the success message (messages are not passed via URL or state)

**Possible Causes:**
- Success message is cleared before redirect
- Login page doesn't check for success state from registration
- Message state is not persisted across navigation

**Files to Investigate:**
- `app/register/page.tsx` - Registration success handling (lines 75-79)
- `app/login/page.tsx` - Login page message display
- `e2e/pages/LoginPage.ts` - Test page object `getMessage()` method

**Fix Required:**
1. Pass success message via URL query parameter or session storage
2. Update login page to check for and display registration success message
3. Or update test to check for success message before redirect

---

### 3. Admin Dashboard Test Failure (`e2e/tests/admin/dashboard.spec.ts`)

**Issue:** Admin user not redirecting to dashboard

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
- `app/page.tsx` - Redirect logic for admin role (lines 37-39)
- `app/api/users/[id]/route.ts` - Verify admin users have `role: 'admin'` in profile
- `e2e/fixtures/db-helpers.ts` - Verify `seedAdmin` creates user with correct role

**Fix Required:**
1. Same fixes as Login Test #1
2. Verify admin user seeding creates correct role
3. Verify admin profile API returns correct role

---

### 4. Student Applications Test Failure (`e2e/tests/student/applications.spec.ts`)

**Issue:** Application cards not displaying

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

### 5. Student Supervisors Test Failure (`e2e/tests/student/supervisors.spec.ts`)

**Issue:** Supervisor list not displaying

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

### 6. Supervisor Applications Test Failure (`e2e/tests/supervisor/applications.spec.ts`)

**Issue:** API endpoint `/api/applications` returns error

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
- `e2e/tests/supervisor/applications.spec.ts` - Line 59: Wrong endpoint being called

**Fix Required:**
1. **Option A (Recommended):** Update test to use correct endpoint:
   ```typescript
   const response = await authenticatedRequest(page, 'GET', `/api/supervisors/${authenticatedSupervisor.uid}/applications`);
   ```

2. **Option B:** Change API endpoint to allow supervisors (if that's the intended behavior)

---

### 7. Supervisor Projects Test Failure (`e2e/tests/supervisor/projects.spec.ts`)

**Issue:** API endpoint `/api/projects?supervisorId=...` returns error

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
- `app/api/projects/route.ts` - Line 6-8: No query parameter filtering
- `app/api/supervisors/[id]/projects/route.ts` - Supervisor-specific endpoint
- `e2e/tests/supervisor/projects.spec.ts` - Line 38: Wrong endpoint being called

**Fix Required:**
1. **Option A (Recommended):** Update test to use correct endpoint:
   ```typescript
   const response = await authenticatedRequest(page, 'GET', `/api/supervisors/${authenticatedSupervisor.uid}/projects`);
   ```

2. **Option B:** Add query parameter support to `/api/projects` endpoint (if that's the intended behavior)

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

## Priority Fix Order

1. **High Priority:**
   - Login/Register redirect issues (#1, #2, #3) - Blocks all authenticated tests
   - API endpoint fixes (#6, #7) - Quick fixes, wrong endpoints

2. **Medium Priority:**
   - Student Applications display (#4)
   - Student Supervisors display (#5)

3. **Low Priority:**
   - Add missing test IDs
   - Improve error messages
   - Add loading states

## Testing After Fixes

After fixing these issues, run the tests again:

```bash
# Verify server is in test mode
curl -s http://localhost:3000/api/health | jq .testMode
# Should return: true

# Run tests
npm run test:e2e

# View detailed report
npm run test:e2e:report
```

## Related Documentation

- [Running Tests Locally](./RUNNING_TESTS_LOCALLY.md) - Infrastructure setup guide
- Test files in `e2e/tests/` - Individual test specifications
- API routes in `app/api/` - Endpoint implementations

