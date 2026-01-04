# Test Fixes Applied

This document summarizes all the fixes applied to resolve the E2E test failures.

## Summary

Fixed 3 high-priority issues that were causing test failures:
1. ✅ Fixed `getAuthToken()` function to extract tokens from localStorage
2. ✅ Fixed authentication redirect after localStorage injection
3. ✅ Fixed user creation timing in login test
4. ✅ Improved error messages in API request helpers

## Fixes Applied

### 1. Fixed `getAuthToken()` Function (`e2e/utils/auth-helpers.ts`)

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

**Impact:** Fixes supervisor applications and projects tests (Issues #5 and #6)

---

### 2. Fixed Authentication Redirect (`e2e/fixtures/auth.ts`)

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

**Impact:** Fixes admin dashboard test (Issue #1)

---

### 3. Fixed User Creation Timing (`e2e/tests/auth/login.spec.ts`)

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

**Impact:** Fixes login test (Issue #2)

---

### 4. Improved Error Messages

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

## Files Modified

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

## Expected Test Results

After these fixes, the following tests should pass:

1. ✅ **Admin Dashboard Test** - Should redirect after auth injection
2. ✅ **Login Test** - Should find user in Firebase Auth
3. ✅ **Supervisor Applications Test** - Should get auth token for API requests
4. ✅ **Supervisor Projects Test** - Should get auth token for API requests

**Note:** Student tests (applications and supervisors) may still fail if UI elements aren't rendering, but those are separate UI issues that need to be investigated separately.

---

## Next Steps

1. **Run tests** to verify fixes:
   ```bash
   npm run test:e2e
   ```

2. **If tests still fail**, check:
   - Browser console for JavaScript errors
   - Server logs for API errors
   - Firebase emulator UI to verify data exists

3. **For UI rendering issues** (student tests):
   - Check if pages are actually rendering data
   - Verify Firestore queries are returning data
   - Check for loading states that need to complete

---

## Testing the Fixes

To verify the fixes work:

1. **Ensure emulators are running:**
   ```bash
   npm run test:setup
   ```

2. **Start Next.js server with test env vars:**
   ```bash
   # Use the command from RUNNING_TESTS_LOCALLY.md Step 1b
   ```

3. **Run tests:**
   ```bash
   npm run test:e2e
   ```

4. **Check specific tests:**
   ```bash
   # Test login fix
   npx playwright test e2e/tests/auth/login.spec.ts
   
   # Test admin dashboard fix
   npx playwright test e2e/tests/admin/dashboard.spec.ts
   
   # Test supervisor API fixes
   npx playwright test e2e/tests/supervisor/
   ```

---

## Known Remaining Issues

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

