# Email Verification System - Readiness Checklist

This document provides a comprehensive checklist to ensure the email verification system is ready for production use.

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

**Required Variables:**
- [ ] `RESEND_API_KEY` - Set in production environment
- [ ] `RESEND_FROM_EMAIL` - Configured (or defaults to `onboarding@resend.dev`)
- [ ] `NEXT_PUBLIC_APP_URL` - Set to production URL (e.g., `https://yourdomain.com`)

**Verification:**
```bash
# Check environment variables are set
echo $RESEND_API_KEY
echo $RESEND_FROM_EMAIL
echo $NEXT_PUBLIC_APP_URL
```

**For Development:**
```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Code Compilation Check

- [ ] Run TypeScript compilation: `npm run build` or `npx tsc --noEmit`
- [ ] Verify no linting errors: `npm run lint` (if configured)
- [ ] Check all imports resolve correctly

### 3. Firebase Configuration

- [ ] Firebase Admin SDK credentials are configured
- [ ] Firebase Auth is enabled in Firebase Console
- [ ] Email verification is enabled in Firebase Auth settings
- [ ] Action URL domain is authorized in Firebase Console (for production)

**Firebase Console Settings:**
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain if not already listed
3. Verify email templates are configured (optional - we use custom templates)

### 4. Resend Account Setup

- [ ] Resend account is active
- [ ] API key has proper permissions
- [ ] Domain is verified in Resend (for production)
- [ ] From email address is verified (if using custom domain)

## Testing Checklist

### Test 1: Registration Flow

**Steps:**
1. Register a new user via `/api/auth/register`
2. Check server logs for verification email sent confirmation
3. Verify user account is created with `emailVerified: false`

**Expected Results:**
- ✅ User account created successfully
- ✅ Verification email sent (check logs)
- ✅ Registration response includes message about email verification
- ✅ Account creation succeeds even if email sending fails (graceful degradation)

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "studentId": "12345",
    "phone": "1234567890",
    "department": "Computer Science"
  }'
```

### Test 2: Email Delivery

**Steps:**
1. Register a new user
2. Check email inbox (or Resend dashboard)
3. Verify email contains:
   - Verification link button
   - Expiration notice (1 hour)
   - Support information
   - Proper styling

**Expected Results:**
- ✅ Email received within 30 seconds
- ✅ Email has correct subject: "Verify your MentorMatch email address"
- ✅ Verification link is clickable
- ✅ Email styling matches design system

**Resend Dashboard:**
- Check https://resend.com/emails for delivery status
- Verify emails are not bouncing

### Test 3: Verification Link

**Steps:**
1. Click verification link from email
2. Verify redirect to `/login?verified=true`
3. Check user's `emailVerified` status is now `true`

**Expected Results:**
- ✅ Link redirects correctly
- ✅ User's email is verified in Firebase Auth
- ✅ Link expires after 1 hour (test with expired link)

**Manual Verification:**
```bash
# Check verification status
curl -X GET http://localhost:3000/api/auth/verify-email \
  -H "Authorization: Bearer <user_token>"
```

### Test 4: Unverified User Access

**Steps:**
1. Register a new user (don't verify email)
2. Try to access protected API routes
3. Verify access is blocked with appropriate error

**Expected Results:**
- ✅ Unverified users receive 403 error
- ✅ Error message: "Email verification required..."
- ✅ Users can still access public routes

**Test with `requireVerifiedEmail`:**
```typescript
// In any protected route
import { requireVerifiedEmail } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const authResult = await requireVerifiedEmail(request);
  if (!authResult.authorized) {
    return ApiResponse.error(authResult.error || 'Forbidden', authResult.status);
  }
  // ... rest of handler
}
```

### Test 5: Error Handling

**Test Scenarios:**

1. **Email Service Unavailable:**
   - [ ] Temporarily remove `RESEND_API_KEY`
   - [ ] Register a new user
   - [ ] Verify registration still succeeds
   - [ ] Check error is logged appropriately

2. **Invalid Email Format:**
   - [ ] Try to register with invalid email
   - [ ] Verify validation error is returned

3. **Network Failures:**
   - [ ] Simulate network failure (disable internet)
   - [ ] Verify retry logic works
   - [ ] Check exponential backoff is applied

4. **Expired Verification Link:**
   - [ ] Wait 1+ hour after receiving email
   - [ ] Click verification link
   - [ ] Verify appropriate error message

### Test 6: Production Readiness

**Before Production Deployment:**

- [ ] All environment variables set in production
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] Resend domain is verified
- [ ] Firebase authorized domains include production domain
- [ ] Email templates render correctly in production
- [ ] Monitoring/alerting is set up for email failures

## Integration Points to Verify

### 1. Registration Route
**File:** `app/api/auth/register/route.ts`
- [ ] Verification email is sent after user creation
- [ ] Errors don't break registration flow
- [ ] Proper logging is in place

### 2. Auth Middleware
**File:** `lib/middleware/auth.ts`
- [ ] `verifyAuth` includes `emailVerified` in user object
- [ ] `requireVerifiedEmail` function works correctly
- [ ] Unverified users are properly blocked

### 3. Email Service
**File:** `lib/services/email/email-service.ts`
- [ ] `sendCriticalEmail` throws errors (doesn't fail silently)
- [ ] Retry logic works for transient failures
- [ ] Email validation prevents invalid sends

### 4. Verification Service
**File:** `lib/services/auth/email-verification-service.ts`
- [ ] Firebase link generation works
- [ ] Custom email template is used
- [ ] Error handling is proper

## Monitoring & Alerts

### Key Metrics to Monitor:

1. **Email Delivery Rate:**
   - Track successful email sends vs failures
   - Monitor Resend dashboard for bounces

2. **Verification Rate:**
   - Track percentage of users who verify email
   - Monitor time to verification

3. **Error Rates:**
   - Monitor email sending failures
   - Track verification link errors

### Recommended Alerts:

- Alert if email delivery rate drops below 95%
- Alert if verification email failures exceed threshold
- Alert if Resend API key becomes invalid

## Troubleshooting Guide

### Issue: Emails Not Sending

**Check:**
1. `RESEND_API_KEY` is set and valid
2. Resend account is active
3. Check server logs for errors
4. Verify email service is not rate-limited

**Debug:**
```typescript
// Add to registration route temporarily
console.log('Resend available:', isResendAvailable());
console.log('From email:', FROM_EMAIL);
```

### Issue: Verification Links Not Working

**Check:**
1. `NEXT_PUBLIC_APP_URL` is set correctly
2. Firebase authorized domains include your domain
3. Link hasn't expired (1 hour limit)
4. User is clicking link in same browser session

### Issue: Users Can Access Without Verification

**Check:**
1. Protected routes use `requireVerifiedEmail()`
2. `verifyAuth` correctly reads `emailVerified` from token
3. Firebase token includes email verification status

**Fix:**
```typescript
// Ensure protected routes check verification
const authResult = await requireVerifiedEmail(request);
if (!authResult.authorized) {
  return ApiResponse.error(authResult.error, authResult.status);
}
```

## Quick Verification Script

Run this script to verify all components:

```bash
#!/bin/bash

echo "=== Email Verification System Readiness Check ==="

# Check environment variables
echo -n "RESEND_API_KEY: "
[ -n "$RESEND_API_KEY" ] && echo "✓ Set" || echo "✗ Missing"

echo -n "NEXT_PUBLIC_APP_URL: "
[ -n "$NEXT_PUBLIC_APP_URL" ] && echo "✓ Set ($NEXT_PUBLIC_APP_URL)" || echo "✗ Missing"

# Check if code compiles
echo -n "TypeScript compilation: "
npx tsc --noEmit > /dev/null 2>&1 && echo "✓ Pass" || echo "✗ Fail"

# Check if files exist
echo -n "EmailVerificationService: "
[ -f "lib/services/auth/email-verification-service.ts" ] && echo "✓ Exists" || echo "✗ Missing"

echo -n "Verification template: "
grep -q "generateVerificationEmailHTML" lib/services/email/templates.ts && echo "✓ Exists" || echo "✗ Missing"

echo "=== Check Complete ==="
```

## Next Steps After Verification

Once all checks pass:

1. **Deploy to Staging:**
   - Test full flow in staging environment
   - Verify email delivery works
   - Test verification links

2. **User Communication:**
   - Update registration UI to mention email verification
   - Add messaging for unverified users
   - Provide support contact for issues

3. **Documentation:**
   - Update user documentation
   - Document troubleshooting steps
   - Create support runbook

4. **Production Deployment:**
   - Deploy with monitoring enabled
   - Watch for errors in first 24 hours
   - Monitor verification rates

## Support Contacts

- **Resend Support:** https://resend.com/support
- **Firebase Support:** https://firebase.google.com/support
- **Internal Team:** [Your team contact]

---

**Last Updated:** [Current Date]
**Status:** Ready for Testing

