# Deployment & Pipeline Fix Guide

## Problem Summary

Your GitHub Actions pipeline and Vercel deployment are failing because **Firebase environment variables are missing** from both platforms. The workflow expects these secrets to be configured but they're not set up yet.

## Failures Identified

### 1. GitHub Actions Failures
- **Vercel Build Check**: Exits with code 1 (missing Firebase environment variables)
- **E2E Tests**: Cannot start dev server without Firebase credentials
- **Error**: Missing environment variables required for Next.js build

### 2. Vercel Deployment Failures
- Build likely fails for the same reason: missing environment variables

---

## Solution: Add Environment Variables

### Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **MentorMatch**
3. Click the gear icon (⚙️) > **Project settings**

#### For Client SDK (Public) Variables:
In the **General** tab, scroll down to **Your apps** section:
- You should see your web app configuration
- Copy these values:

```
apiKey: "..."
authDomain: "..."
projectId: "..."
storageBucket: "..."
messagingSenderId: "..."
appId: "..."
```

#### For Admin SDK (Private) Variables:
1. Go to **Service accounts** tab
2. Click **Generate new private key**
3. A JSON file will be downloaded with these fields:
   - `project_id`
   - `client_email`
   - `private_key`

---

### Step 2: Add Secrets to GitHub

1. Go to: https://github.com/Roee-Bar/MentorMatch/settings/secrets/actions
2. Click **"New repository secret"** for each of the following:

#### Firebase Client SDK Secrets:
```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: your_api_key_here

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: your_project.firebaseapp.com

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: your_project_id

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: your_project.appspot.com

Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: your_sender_id

Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: your_app_id
```

#### Firebase Admin SDK Secrets:
```
Name: FIREBASE_ADMIN_PROJECT_ID
Value: your_project_id

Name: FIREBASE_ADMIN_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

Name: FIREBASE_ADMIN_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----
```

**Important**: For `FIREBASE_ADMIN_PRIVATE_KEY`, keep the actual newline characters as `\n` in the secret value.

---

### Step 3: Add Environment Variables to Vercel

1. Go to: https://vercel.com/rbeg/mentor-match/settings/environment-variables
2. Add all the same variables from Step 2
3. For each variable:
   - **Name**: Same as GitHub secrets
   - **Value**: Same values
   - **Environments**: Check all three boxes (Production, Preview, Development)

Alternatively, you can use Vercel CLI:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add FIREBASE_ADMIN_PROJECT_ID
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL
vercel env add FIREBASE_ADMIN_PRIVATE_KEY
```

---

### Step 4: Create Local Environment File (Optional but Recommended)

Create a `.env.local` file in your project root for local development:

```bash
# .env.local
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Configuration
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"
```

**Important**: Add `.env.local` to your `.gitignore` (it should already be there)

---

### Step 5: Test Locally

Before pushing changes, test that everything works locally:

```bash
# Install dependencies
npm install

# Run build to ensure it works
npm run build

# Start dev server
npm run dev

# In another terminal, run tests
npm test

# Run E2E tests (optional - requires dev server running)
npm run test:e2e
```

---

### Step 6: Trigger Pipeline & Deployment

After adding all secrets:

```bash
# Commit any pending changes
git add .
git commit -m "Update workflow configuration"

# Push to trigger GitHub Actions
git push origin Roee-add-backend
```

The pipeline should now pass all checks!

---

### Step 7: Redeploy on Vercel

After adding environment variables to Vercel:

1. Go to your deployment: https://vercel.com/rbeg/mentor-match/GRMyjeKhqwc58j4f6qvFszgZF3LQ
2. Click **"Redeploy"** button
3. The deployment should now succeed

---

## Verification Checklist

- [ ] All 9 GitHub secrets added
- [ ] All 9 Vercel environment variables added
- [ ] `.env.local` created for local development
- [ ] Local build succeeds: `npm run build`
- [ ] GitHub Actions workflow passes all jobs
- [ ] Vercel deployment succeeds
- [ ] Application loads correctly on Vercel URL

---

## Expected Results

After following these steps:

✅ **GitHub Actions**:
- ✅ test job: passes (unit tests run successfully)
- ✅ e2e job: passes (Playwright tests complete)
- ✅ build-check job: passes (Next.js build succeeds)

✅ **Vercel Deployment**:
- ✅ Build succeeds
- ✅ Deployment is live
- ✅ Application functions correctly

---

## Troubleshooting

### If GitHub Actions still fails:

1. **Check secret names** - They must match exactly (case-sensitive)
2. **Check secret values** - No extra spaces or quotes
3. **For FIREBASE_ADMIN_PRIVATE_KEY** - Ensure `\n` is used for newlines, not actual line breaks

### If Vercel deployment still fails:

1. **Check environment variable names** - Must match exactly
2. **Verify all environments are selected** - Production, Preview, Development
3. **Try redeploying** - Sometimes Vercel needs a fresh deployment after adding env vars

### If E2E tests fail:

The E2E tests start a local dev server which requires Firebase credentials. Common issues:
- Port 3000 already in use (the workflow handles this)
- Dev server timeout (increased to 120s in config)
- Firebase connection issues (check credentials)

### Debug Commands:

```bash
# Check if environment variables are loaded
npm run dev
# Look for console warnings about missing Firebase env vars

# Test build locally
NODE_ENV=production npm run build

# Verify Firebase connection
npm run dev
# Open http://localhost:3000 and check browser console
```

---

## Why This Happened

Your code is well-structured with fallback values for development/testing, but:

1. **Next.js Build**: Needs env vars at build time for static optimization
2. **E2E Tests**: Need a real Firebase connection to test authentication flows
3. **CI/CD**: Running in a clean environment without your local `.env.local` file

The solution is to configure these secrets in both GitHub (for CI) and Vercel (for deployment).

---

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## Need Help?

If you're still experiencing issues after following this guide:

1. Check the GitHub Actions logs for specific error messages
2. Check Vercel deployment logs for build errors
3. Verify all secrets are correctly named and formatted
4. Ensure your Firebase project is active and properly configured

---

**Created**: November 28, 2025  
**For**: MentorMatch Project  
**Repository**: https://github.com/Roee-Bar/MentorMatch

