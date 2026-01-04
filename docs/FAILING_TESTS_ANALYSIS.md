# Failing Tests Analysis and Fixes

## Summary

7 tests are currently failing with the `@failing` tag:
- 5 email verification tests
- 1 registration test  
- 1 supervisor projects test

## Issues Identified

### 1. Registration Redirect Issue ✅ FIXED
**Test**: `register.spec.ts` - "should successfully register a new student"

**Problem**: Page stays on `/register` instead of redirecting to `/login` after successful registration.

**Root Cause**: The redirect code was using `window.location.href` with `setTimeout` in test mode, which Playwright might not detect reliably.

**Fix Applied**: Changed to use `router.push('/login?registered=true')` in both test and production modes for better Playwright compatibility.

**Status**: Fixed - needs verification

### 2. Verification Page Text Not Appearing ⚠️ IN PROGRESS
**Tests**: 
- "should handle verification link successfully"
- "should show error for expired verification link"
- "should show message for already verified email"
- "should update verification status after verification"

**Problem**: Tests look for text patterns like `/verified successfully/i`, `/expired/i`, `/already verified/i` but can't find them on the page.

**Root Cause Analysis**:
- The messages come from `SUCCESS_MESSAGES.EMAIL_VERIFIED` and `ERROR_MESSAGES` constants
- `SUCCESS_MESSAGES.EMAIL_VERIFIED` = "Your email address has been verified successfully! You can now log in." (contains "verified successfully")
- `ERROR_MESSAGES.VERIFICATION_EXPIRED` = "This verification link has expired. Please request a new verification email." (contains "expired")
- `ERROR_MESSAGES.VERIFICATION_ALREADY_VERIFIED` = "Your email address has already been verified. You can now log in." (contains "already verified")

**Possible Issues**:
1. The test-verify-email endpoint might be returning an error response that doesn't match what the frontend expects
2. The page might not be loading correctly or the API call is failing
3. The StatusMessage component might not be rendering the text properly
4. There might be a timing issue where the page redirects before the message is visible

**Fixes Applied**:
- Updated test-verify-email endpoint to return consistent error response format with email field
- Ensured error responses include email field for frontend compatibility

**Status**: Partially fixed - needs further investigation

### 3. Connection Refused Errors ⚠️ NEEDS INVESTIGATION
**Tests**: Some tests fail with `net::ERR_CONNECTION_REFUSED` or `connect ECONNREFUSED`

**Problem**: Server might not be ready when tests try to connect, or there's a timing issue.

**Possible Causes**:
1. Playwright's webServer might not be fully ready when tests start
2. Tests might be running in parallel and overwhelming the server
3. There might be a build/configuration issue (see supervisor projects test)

**Status**: Needs investigation

### 4. Supervisor Projects Test - Module Not Found Error ⚠️ SEPARATE ISSUE
**Test**: `projects.spec.ts` - "should change project status to completed"

**Problem**: Error: `Cannot find module './vendor-chunks/@opentelemetry.js'`

**Root Cause**: This is a build/configuration issue, not a test logic issue. The Next.js build might be missing dependencies or there's a webpack configuration issue.

**Status**: Separate build issue - needs investigation

## Next Steps

1. **Run tests again** to verify registration redirect fix works
2. **Investigate verification page issues**:
   - Check if test-verify-email endpoint is being called correctly
   - Verify response format matches frontend expectations
   - Check if page is loading correctly in test environment
   - Add logging to see what's happening during verification
3. **Fix connection refused errors**:
   - Check Playwright webServer configuration
   - Add retry logic or wait for server to be ready
4. **Fix supervisor projects test**:
   - Check Next.js build configuration
   - Verify all dependencies are installed
   - Check webpack configuration

## Files Modified

1. `app/register/page.tsx` - Fixed redirect to use `router.push` instead of `window.location.href`
2. `app/api/auth/test-verify-email/route.ts` - Updated error response format to include email field

## Test Commands

```bash
# Run all failing tests
npx playwright test --grep "@failing"

# Run specific test
npx playwright test e2e/tests/auth/register.spec.ts --grep "@failing"

# Run with UI for debugging
npx playwright test --grep "@failing" --ui
```
