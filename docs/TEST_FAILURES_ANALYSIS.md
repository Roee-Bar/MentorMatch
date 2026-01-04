# Test Failures Analysis and Fixes

## Summary

Out of 24 tests, 7 are failing:
- **5 email verification tests** - Message display issues
- **1 registration test** - Redirect not happening  
- **1 supervisor projects test** - Project not found in API response

## Issue 1: Registration Redirect Failure

### Test: `register.spec.ts` - "should successfully register a new student"

**Error:**
```
Expected: "http://localhost:3000/login"
Received: "http://localhost:3000/register"
Timeout: 10000ms
```

**Root Cause:**
The registration page (`app/register/page.tsx`) checks for test environment and should redirect immediately, but the redirect isn't happening. Looking at the code:

```typescript:69:88:app/register/page.tsx
const isTestEnv = process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true';

try {
  setMessage('Creating your account...')
  const response = await apiClient.registerUser(formData)

  if (response.success) {
    setMessage('Registration successful! Redirecting to login...')
    if (isTestEnv) {
      router.push('/login?registered=true')
    } else {
      setTimeout(() => {
        router.push('/login?registered=true')
      }, 2000)
    }
  }
}
```

**Problem:**
The `apiFetch` function in `lib/api/client.ts` throws an error if `!response.ok`, but the registration API returns status 201 (created), which is `ok`. However, the response structure is `{ success: true, message: "...", data: {...} }`. The `apiFetch` function returns `data` directly, so `response.success` should work.

**However**, there's a potential issue: if an error occurs during registration (like email sending failure), the registration still succeeds but might throw an error that prevents the redirect.

**Fix:**
The redirect should happen regardless of email sending success. The issue is likely that `setLoading(false)` is only called in the catch block, but not after successful registration. Also, we should ensure the redirect happens even if there are warnings.

**Solution:**
1. Ensure `setLoading(false)` is called after redirect
2. Add error handling to ensure redirect happens even if there are non-critical errors
3. Make the redirect more robust by using `router.replace` instead of `router.push` to avoid navigation issues

---

## Issue 2: Email Verification Message Display Failures (5 tests)

### Tests Failing:
1. `email-verification.spec.ts:21` - "should send verification email after registration"
2. `email-verification.spec.ts:45` - "should handle verification link successfully"  
3. `email-verification.spec.ts:83` - "should show error for expired verification link"
4. `email-verification.spec.ts:103` - "should show message for already verified email"
5. `email-verification.spec.ts:286` - "should update verification status after verification"

**Error Pattern:**
```
Locator: locator('text=/verified successfully/i')
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

**Root Cause Analysis:**

#### Test 1: Registration redirect issue (same as Issue 1)
The test expects redirect to `/login` but stays on `/register`.

#### Tests 2-5: Verification message display
The tests are looking for text patterns like:
- `/verified successfully/i`
- `/expired/i`  
- `/already verified/i`

But the actual messages come from `SUCCESS_MESSAGES.EMAIL_VERIFIED` and `ERROR_MESSAGES` constants:

```typescript:85:87:lib/constants/error-messages.ts
EMAIL_VERIFIED: 'Your email address has been verified successfully! You can now log in.',
VERIFICATION_EXPIRED: 'This verification link has expired. Please request a new verification email.',
VERIFICATION_ALREADY_VERIFIED: 'Your email address has already been verified. You can now log in.',
```

**Problem:**
1. The test looks for `/verified successfully/i` but the message is "Your email address has been verified successfully! You can now log in." - this should match, but might not be visible.
2. The `StatusMessage` component might not be rendering the message correctly
3. The verification state might not be set properly before the component renders

**Looking at verify-email page:**
```typescript:96:105:app/verify-email/page.tsx
if (data.success && data.data) {
  setResult({
    state: data.data.alreadyVerified ? 'already-verified' : 'success',
    message: data.data.alreadyVerified 
      ? ERROR_MESSAGES.VERIFICATION_ALREADY_VERIFIED 
      : SUCCESS_MESSAGES.EMAIL_VERIFIED,
    email: data.data.email,
  });
  startCountdown(3);
}
```

The issue is that the test endpoint `/api/auth/test-verify-email` returns:
```typescript:86:90:app/api/auth/test-verify-email/route.ts
return ApiResponse.success({
  verified: true,
  email: userRecord.email,
  message: 'Email verified successfully',
});
```

But the page expects `data.data` structure, and checks `data.data.alreadyVerified`. The test endpoint returns `{ success: true, data: { verified: true, email: ..., message: ... } }`, so `data.data` exists, but `data.data.alreadyVerified` is undefined.

**Fix:**
1. Update test endpoint to return `alreadyVerified` field when appropriate
2. Ensure the message is displayed correctly in StatusMessage component
3. Update test expectations to match actual message text or make messages more testable

---

## Issue 3: Supervisor Projects API Failure

### Test: `supervisor/projects.spec.ts` - "should change project status to completed"

**Error:**
```
expect(projectExists).toBeTruthy();
Received: false
```

**Root Cause:**
The test creates a project and then queries `/api/supervisors/${authenticatedSupervisor.uid}/projects`. The API endpoint calls `projectService.getSupervisorProjects(params.id)` which queries:

```typescript:20:24:lib/services/projects/project-service.ts
async getSupervisorProjects(supervisorId: string): Promise<Project[]> {
  return this.query([
    { field: 'supervisorId', operator: '==', value: supervisorId }
  ]);
}
```

**Problem:**
The project is created with `supervisorId: authenticatedSupervisor.uid`, but the query might not be finding it. Possible issues:
1. The project document might not have `supervisorId` field set correctly
2. The query might not be working in test database
3. The project might not be created before the query runs

**Looking at seedProject:**
```typescript:200:220:e2e/fixtures/db-helpers.ts
export async function seedProject(overrides?: Partial<Project>): Promise<{ project: Project }> {
  const projectData = generateProjectData(overrides);
  // ... creates project with supervisorId
}
```

**Fix:**
1. Verify the project is created with correct `supervisorId` field
2. Ensure the query works correctly in test database
3. Add logging to debug why project isn't found
4. Check if there's a timing issue - project might not be committed before query

---

## Recommended Fixes

### Fix 1: Registration Redirect

**File:** `app/register/page.tsx`

```typescript
if (response.success) {
  setMessage('Registration successful! Redirecting to login...')
  // Always redirect, regardless of email sending status
  if (isTestEnv) {
    // Use replace to avoid back button issues
    router.replace('/login?registered=true')
  } else {
    setTimeout(() => {
      router.replace('/login?registered=true')
    }, 2000)
  }
  setLoading(false) // Ensure loading is cleared
  return // Exit early to prevent further execution
}
```

### Fix 2: Email Verification Messages

**File:** `app/api/auth/test-verify-email/route.ts`

Update the response to include `alreadyVerified`:

```typescript
// Check if already verified
if (userRecord.emailVerified) {
  return ApiResponse.success({
    verified: true,
    email: userRecord.email,
    message: 'Email already verified',
    alreadyVerified: true, // Add this field
  });
}

// After updating
return ApiResponse.success({
  verified: true,
  email: userRecord.email,
  message: 'Email verified successfully',
  alreadyVerified: false, // Add this field
});
```

**File:** `app/verify-email/page.tsx`

Ensure the message is displayed correctly. The StatusMessage component should show the message, but we need to verify it's rendering.

### Fix 3: Supervisor Projects Query

**File:** `e2e/tests/supervisor/projects.spec.ts`

Add debugging and ensure project is created correctly:

```typescript
// After creating project
const projectDoc = await adminDb.collection('projects').doc(project.id).get();
expect(projectDoc.exists).toBeTruthy();
const projectData = projectDoc.data();
expect(projectData?.supervisorId).toBe(authenticatedSupervisor.uid);

// Then query API
const response = await authenticatedRequest(page, 'GET', `/api/supervisors/${authenticatedSupervisor.uid}/projects`);
```

---

## Comparison with Passing Tests

### Passing Tests Pattern:
- **Login test** (`login.spec.ts`): Uses auth fixtures, doesn't rely on UI navigation
- **Other tests**: Use API fallbacks and database verification instead of relying solely on UI

### Key Differences:
1. **Passing tests** use `authenticatedRequest` helper for API calls
2. **Passing tests** verify state in database directly
3. **Passing tests** don't rely on complex UI interactions
4. **Failing tests** rely on:
   - Client-side redirects (registration)
   - Client-side message display (verification)
   - UI state synchronization (projects)

### Recommendation:
Update failing tests to follow the same pattern as passing tests:
- Use API verification as primary check
- Use UI verification as secondary/fallback
- Verify database state directly when possible

