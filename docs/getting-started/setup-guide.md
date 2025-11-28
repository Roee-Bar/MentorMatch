# Complete Setup Guide

This guide provides step-by-step instructions for setting up the MentorMatch development environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Firebase Configuration](#firebase-configuration)
  - [Firebase Client Setup](#firebase-client-setup)
  - [Firebase Admin SDK Setup](#firebase-admin-sdk-setup)
- [Environment Variables](#environment-variables)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Deployment](#deployment)

## Prerequisites

Before starting, ensure you have:

- **Node.js 18 or higher** installed
- **npm** or **yarn** package manager
- **Git** installed
- A **Firebase account** (free tier works fine)
- A **code editor** (VS Code recommended)

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Final
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- Firebase SDK
- TypeScript
- Testing libraries
- And more

## Firebase Configuration

MentorMatch uses two types of Firebase configuration:

1. **Client-side SDK** - For browser-based authentication and data access
2. **Admin SDK** - For server-side API operations with elevated privileges

### Firebase Client Setup

#### Step 1: Create or Access Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard (enable Google Analytics if desired)

#### Step 2: Get Client Credentials

1. In Firebase Console, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app (or select existing app)
5. Register the app with a nickname (e.g., "MentorMatch Dev")
6. Copy the configuration values

You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

#### Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save changes

#### Step 4: Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **production mode** (we'll add security rules later)
4. Choose a location closest to your users
5. Click "Enable"

#### Step 5: Enable Firebase Storage

1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Start in **production mode**
4. Use the same location as Firestore
5. Click "Done"

### Firebase Admin SDK Setup

The Firebase Admin SDK provides server-side access with elevated privileges. This is used in API routes to verify authentication tokens and perform secure database operations.

#### Step 1: Generate Service Account Key

1. In Firebase Console, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Navigate to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" in the confirmation dialog
6. A JSON file will download to your computer
7. Keep this file secure - it provides full admin access to your Firebase project

#### Step 2: Extract Credentials from JSON

The downloaded JSON file contains your service account credentials. It looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "a1b2c3d4e5f6...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEF...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

You need these three values:
- `project_id`
- `client_email`
- `private_key`

## Environment Variables

### Option A: Use Setup Script (Recommended)

We provide scripts to create the `.env.local` file with the correct structure:

**Windows (PowerShell):**
```powershell
.\scripts\setup-firebase-admin.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/setup-firebase-admin.sh
./scripts/setup-firebase-admin.sh
```

Then manually add your Firebase credentials to the created `.env.local` file.

### Option B: Manual Setup

Create a file named `.env.local` in the project root directory:

```bash
# Firebase Client Configuration (Public - Client-Side)
# Get these from: Firebase Console → Project Settings → General → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin SDK Credentials (Server-Side ONLY - NEVER expose these)
# From your service account JSON file
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# API Configuration
NEXT_PUBLIC_API_URL=/api
NODE_ENV=development
```

### Critical: Private Key Formatting

The private key requires special formatting to work correctly:

1. **Wrap in quotes**: The entire key must be wrapped in double quotes
2. **Keep as single line**: The key should stay on one line in `.env.local`
3. **Preserve `\n` characters**: Keep `\n` as literal text (not actual newlines)
4. **Include BEGIN/END markers**: Must start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`

**Correct format:**
```bash
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEF...(rest of key)...\n-----END PRIVATE KEY-----\n"
```

**Incorrect formats:**
```bash
# Missing quotes
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# Actual newlines instead of \n
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEF...
-----END PRIVATE KEY-----"

# Missing BEGIN/END markers
FIREBASE_ADMIN_PRIVATE_KEY="MIIEvAIBADANBgkqhkiG9w0BAQEF..."
```

## Verification

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Check Console Output

You should see:

```
Ready in 2.5s
Local:        http://localhost:3000
Firebase Admin SDK initialized successfully
```

If you see "Firebase Admin SDK initialization failed", check the [Troubleshooting](#troubleshooting) section.

### Step 3: Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

You should see the MentorMatch homepage with:
- Header with navigation
- "Get Started" button
- Login/Register links

### Step 4: Test Registration

1. Click "Get Started" or navigate to "/register"
2. Fill in the registration form
3. Choose "Student" or "Supervisor" role
4. Click "Register"

If registration succeeds, you'll be redirected to your dashboard.

### Step 5: Verify API Access

Open your browser's developer console (F12) and check for any errors. You should see successful network requests to `/api/*` endpoints.

### Step 6: Run Tests (Optional)

```bash
# Run all tests
npm test

# Should see output like:
# PASS  app/api/supervisors/__tests__/route.test.ts
# PASS  app/api/students/__tests__/route.test.ts
# ...
# Tests: 329 passed, 329 total
```

All tests should pass. If tests fail, see [Troubleshooting](#troubleshooting).

## Troubleshooting

### "Invalid PEM formatted message" Error

**Symptoms:**
- Application crashes on startup
- Error mentions "Invalid PEM formatted message" or "private key"

**Causes:**
- Private key formatting is incorrect
- Missing BEGIN/END markers
- Extra spaces or incorrect characters

**Solutions:**
1. Verify the private key is wrapped in quotes
2. Ensure `\n` characters are preserved as `\n` (not actual newlines)
3. Check that BEGIN and END markers are present
4. Make sure the key is on a single line in `.env.local`
5. Copy the key directly from the JSON file (don't manually type it)

### "Missing environment variables" Warning

**Symptoms:**
- Console warning about missing environment variables
- Firebase Admin SDK initialization failed

**Solutions:**
1. Verify `.env.local` exists in the project root (same directory as `package.json`)
2. Check that all variable names match exactly (case-sensitive)
3. Restart your development server after creating/modifying `.env.local`
4. Ensure there are no typos in variable names
5. Verify no extra spaces around `=` signs

### "Firebase: Error (auth/invalid-api-key)"

**Symptoms:**
- Authentication fails
- Error in browser console about invalid API key

**Solutions:**
1. Verify `NEXT_PUBLIC_FIREBASE_API_KEY` is correct
2. Check that all NEXT_PUBLIC_* variables are set
3. Ensure you copied the correct values from Firebase Console
4. Try regenerating the web app credentials in Firebase Console

### API Returns 401 Unauthorized

**Symptoms:**
- API calls fail with 401 status
- User is logged in but can't access data

**Solutions:**
1. Verify Firebase Admin credentials are correct
2. Check that the user is properly authenticated (check browser console)
3. Ensure the ID token is being sent with requests
4. Verify Firestore security rules aren't blocking access
5. Check that both client and server credentials are configured

### "Port 3000 is already in use"

**Symptoms:**
- Dev server fails to start
- Error about port being in use

**Solutions:**
```bash
# Option 1: Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
npm run dev -- -p 3001
```

### Tests Failing

**Symptoms:**
- `npm test` shows failing tests
- Tests that should pass are failing

**Solutions:**
1. Clear Jest cache: `npm test -- --clearCache`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Verify all environment variables are set (tests use mocked Firebase, but still need env vars)
4. Check that `jest.setup.js` is properly configured
5. Run specific test to isolate issue: `npm test <test-file-name>`

### Firestore Permission Denied

**Symptoms:**
- Can't read/write to Firestore
- Permission denied errors in console

**Solutions:**
1. Check Firestore security rules in Firebase Console
2. Verify user is authenticated before accessing data
3. For development, you can temporarily use permissive rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
4. Remember to implement proper security rules for production

## Security Best Practices

### Critical Security Rules

1. **NEVER commit `.env.local` to git**
   - It should be in `.gitignore` (already configured)
   - Contains sensitive credentials

2. **NEVER share Firebase Admin credentials publicly**
   - These provide full admin access to your Firebase project
   - Treat them like passwords

3. **NEVER expose Firebase Admin credentials in client-side code**
   - Only use in API routes (server-side)
   - Never import `firebase-admin` in client components

4. **Keep the service account JSON file secure**
   - Store it safely
   - Delete it after extracting credentials
   - Don't commit it to version control

5. **Use different service accounts for development and production**
   - Create separate Firebase projects for dev/staging/prod
   - Use different service accounts for each environment

### What's Safe to Expose

**Client-side credentials (NEXT_PUBLIC_*):**
- Safe to expose in browser
- Used for client-side Firebase SDK
- Can be seen in browser DevTools
- Restricted by Firestore security rules

**Server-side credentials (FIREBASE_ADMIN_*):**
- NEVER expose to browser
- Used only in API routes
- Provide admin-level access
- Must be kept secret

### Implementing Security Rules

For production, implement proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Students can read all supervisors
    match /supervisors/{supervisorId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == supervisorId;
    }
    
    // More rules...
  }
}
```

See [guides/security.md](../guides/security.md) for complete security documentation.

## Deployment

### Deploying to Vercel

MentorMatch is configured for automatic deployment on Vercel.

#### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect Next.js settings

#### Step 2: Configure Environment Variables

1. In Vercel project settings, go to "Environment Variables"
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `NEXT_PUBLIC_API_URL`
   - `NODE_ENV=production`

3. For `FIREBASE_ADMIN_PRIVATE_KEY`:
   - Paste the entire value including quotes and `\n` characters
   - Vercel will handle the formatting correctly

#### Step 3: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. You'll get a production URL (e.g., `your-app.vercel.app`)

#### Step 4: Test Production Deployment

1. Visit your production URL
2. Test registration and login
3. Verify all features work
4. Check browser console for errors

### Deploying to Other Platforms

For platforms other than Vercel:

1. Build the application: `npm run build`
2. Set all environment variables in your platform's settings
3. Ensure Node.js 18+ is available
4. Run the production server: `npm start`
5. Configure your platform to run on port 3000 (or configure PORT env var)

## What This Enables

With your environment properly configured, you can now:

- Develop locally with hot reloading
- Authenticate users with Firebase Auth
- Store and retrieve data from Firestore
- Upload files to Firebase Storage
- Make secure API calls with Firebase Admin
- Run the complete test suite
- Deploy to production

## Next Steps

Now that your environment is set up:

1. **Read the architecture**: [Architecture Overview](../architecture/overview.md)
2. **Explore the API**: [API Reference](../architecture/backend/api-reference.md)
3. **Learn the conventions**: [Code Conventions](../guides/code-conventions.md)
4. **Start coding**: Follow [Quick Start](quick-start.md) for first tasks

## Related Documentation

- [Quick Start Guide](quick-start.md) - Fast path to productivity
- [Development Process](development-process.md) - Project history
- [Firebase Usage](../reference/firebase-usage.md) - Firebase patterns and best practices
- [Security](../guides/security.md) - Security architecture
- [Testing Strategy](../guides/testing-strategy.md) - Testing approach

## Need Help?

### Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Deployment](https://vercel.com/docs/concepts/deployments/overview)

### Common Code Examples

- Firebase initialization: `lib/firebase.ts`
- Firebase Admin setup: `lib/firebase-admin.ts`
- Example API route: `app/api/supervisors/route.ts`
- Example service: `lib/services/firebase-services.ts`

---

**Last Updated**: November 2025

**Project**: MentorMatch - Final Year Project, Braude College of Engineering

