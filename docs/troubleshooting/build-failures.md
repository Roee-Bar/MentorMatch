# Build Failures Troubleshooting Guide

## Overview

This guide covers common build failures and their solutions, particularly for GitHub Actions CI/CD and Vercel deployments.

## Firebase Admin SDK Build Failures

### Problem: Build fails with "Error initializing Firebase Admin SDK"

**Symptoms:**
- Local development works fine
- GitHub Actions build check fails
- Vercel deployment fails
- Error message: "Firebase Admin SDK: Missing environment variables"

**Root Cause:**

The build process imports API routes → middleware → `firebase-admin.ts`, which initializes Firebase Admin SDK. During builds:

1. Next.js compiles all API routes and their dependencies
2. `lib/firebase-admin.ts` is imported at build-time (not just runtime)
3. The module tries to initialize with missing credentials
4. Build fails if credentials aren't available

**Solution Applied:**

We've fixed this by making the Firebase Admin initialization graceful for build environments:

1. **Code Fix** (`lib/firebase-admin.ts`):
   - Changed initialization to allow builds without full credentials
   - In production builds, uses placeholder project ID if credentials are missing
   - Only throws errors in development mode (to help with debugging)
   - Logs warnings when credentials are missing

2. **GitHub Actions Update** (`.github/workflows/test.yml`):
   - Added Firebase Admin environment variables to build-check job
   - Variables are optional - build succeeds even if secrets aren't configured
   - Runtime features work once proper credentials are added to deployment

### How the Fix Works

**Before:**
```typescript
// lib/firebase-admin.ts (old)
if (!projectId || !clientEmail || !privateKey) {
  console.warn('Missing credentials');
  if (process.env.NODE_ENV === 'test') {
    admin.initializeApp({ projectId: 'test-project' });
  }
  // Implicitly fails in production builds
} else {
  admin.initializeApp({ credential: admin.credential.cert({...}) });
}
```

**After:**
```typescript
// lib/firebase-admin.ts (fixed)
if (!projectId || !clientEmail || !privateKey) {
  console.warn('Missing credentials');
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
    admin.initializeApp({ projectId: projectId || 'placeholder-project' });
  }
} else {
  admin.initializeApp({ credential: admin.credential.cert({...}) });
}
// Only throw in development, not production builds
catch (error) {
  if (process.env.NODE_ENV === 'development') {
    throw error;
  }
}
```

### Setting Up GitHub Secrets

To enable full Firebase Admin functionality in CI/CD:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Description | Required? |
|-------------|-------------|-----------|
| `FIREBASE_ADMIN_PROJECT_ID` | Your Firebase project ID | Optional for builds* |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email | Optional for builds* |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key | Optional for builds* |

*Optional for builds means the build will succeed without them, but runtime API features won't work until credentials are added to the deployment environment.

### Getting Firebase Admin Credentials

Follow the instructions in the [Setup Guide](../getting-started/setup-guide.md#firebase-admin-sdk-setup) to:

1. Create a service account in Firebase Console
2. Generate a private key JSON file
3. Extract the credentials:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

**Important:** For GitHub Actions, replace literal `\n` in the private key with actual newlines, or use:

```bash
# When adding to GitHub Secrets, use the raw key (with \n)
# The code will handle the conversion automatically
```

### Vercel Deployment

For Vercel deployments, add the same environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all three `FIREBASE_ADMIN_*` variables
4. Redeploy

## Other Common Build Issues

### Missing NEXT_PUBLIC_* Variables

**Symptoms:**
- Build succeeds but app doesn't work in production
- Firebase authentication fails
- Console errors about undefined configuration

**Solution:**

Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in your deployment environment:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These are **required** for the client-side Firebase SDK to work.

### TypeScript Compilation Errors

**Symptoms:**
- Build fails with TypeScript errors
- Errors mention type mismatches or missing properties

**Solution:**

```bash
# Run type checking locally
npm run typecheck

# Fix reported errors
# Then commit and push
```

### Linting Failures

**Symptoms:**
- Build fails with ESLint errors
- Code style violations

**Solution:**

```bash
# Run linter locally
npm run lint

# Auto-fix what's possible
npm run lint -- --fix

# Manually fix remaining issues
```

## Prevention Best Practices

1. **Test builds locally before pushing:**
   ```bash
   npm run build
   ```

2. **Use the same Node version as CI/CD:**
   Check `.github/workflows/test.yml` for the Node version and ensure you're using the same locally.

3. **Keep environment variables in sync:**
   - Document all required variables
   - Use `.env.example` (but don't commit actual secrets!)
   - Update deployment environments when adding new variables

4. **Monitor GitHub Actions:**
   - Check the Actions tab after each push
   - Address failures promptly
   - Don't merge PRs with failing builds

5. **Use the setup script:**
   ```bash
   ./scripts/setup-firebase-admin.sh
   ```
   This will help you configure Firebase Admin SDK correctly.

## Getting Help

If you're still experiencing build failures:

1. Check the full error logs in GitHub Actions
2. Search for similar issues in the project's issue tracker
3. Review the [Getting Started Guide](../getting-started/quick-start.md)
4. Check the [Development Process](../getting-started/development-process.md) documentation

## Related Documentation

- [Setup Guide](../getting-started/setup-guide.md) - Initial project setup
- [Development Process](../getting-started/development-process.md) - CI/CD workflow
- [Backend Implementation Guide](../architecture/backend/implementation-guide.md) - API and Firebase usage

