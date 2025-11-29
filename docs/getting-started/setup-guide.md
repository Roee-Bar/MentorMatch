# Setup Guide

Complete instructions for setting up MentorMatch in under 30 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Firebase account (free tier)

## Quick Setup (5 Minutes)

### 1. Clone and Install

```bash
git clone <repository-url>
cd Final
npm install
```

### 2. Configure Firebase

**Option A: Setup Script (Recommended)**

```bash
# Windows
.\scripts\setup-firebase-admin.ps1

# Mac/Linux
chmod +x scripts/setup-firebase-admin.sh
./scripts/setup-firebase-admin.sh
```

**Option B: Manual Setup**

Create `.env.local` in project root:

```bash
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (Server-Side ONLY)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Configuration
NEXT_PUBLIC_API_URL=/api
NODE_ENV=development
```

### 3. Run Application

```bash
npm run dev
```

Look for: `Firebase Admin SDK initialized successfully`

Open [http://localhost:3000](http://localhost:3000)

## Firebase Configuration Details

### Get Client Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click gear icon → Project settings
4. Scroll to "Your apps" → Select web app
5. Copy configuration values

### Get Admin Credentials

1. Project settings → Service accounts tab
2. Click "Generate new private key"
3. Download JSON file
4. Extract these values:
   - `project_id`
   - `client_email`
   - `private_key`

### Enable Services

**Authentication:**
1. Firebase Console → Authentication
2. Enable "Email/Password" sign-in method

**Firestore:**
1. Firebase Console → Firestore Database
2. Create database in production mode
3. Choose closest location

**Storage:**
1. Firebase Console → Storage
2. Get started in production mode

### Private Key Formatting

Critical: The private key must be formatted correctly:

```bash
# Correct
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"

# Wrong - missing quotes
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# Wrong - actual newlines instead of \n
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MII...
-----END PRIVATE KEY-----"
```

## Verification

### Test Locally

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Build for production
npm run build
```

All tests should pass. Build should complete without errors.

### Test Registration

1. Navigate to [http://localhost:3000/register](http://localhost:3000/register)
2. Fill registration form
3. Choose role (Student/Supervisor)
4. Submit and verify redirect to dashboard

## Troubleshooting

### "Invalid PEM formatted message"

**Cause:** Private key formatting incorrect

**Fix:**
- Verify key is wrapped in quotes
- Keep `\n` as literal text (not actual newlines)
- Ensure BEGIN/END markers present
- Copy key directly from JSON file

### "Missing environment variables"

**Cause:** `.env.local` missing or incorrect

**Fix:**
- Verify `.env.local` exists in project root
- Check all variable names match exactly
- Restart dev server
- No spaces around `=` signs

### "Port 3000 already in use"

**Fix:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### API Returns 401

**Cause:** Authentication issue

**Fix:**
- Verify Firebase Admin credentials correct
- Check user is authenticated (browser console)
- Ensure ID token sent with requests

### Tests Failing

**Fix:**
- Clear cache: `npm test -- --clearCache`
- Reinstall: `rm -rf node_modules && npm install`
- Run specific test: `npm test <test-file-name>`

## Deployment

### Vercel Deployment

1. Connect repository to [Vercel](https://vercel.com)
2. Add all environment variables from `.env.local`
3. Deploy
4. Test production URL

### Other Platforms

1. Build: `npm run build`
2. Set environment variables in platform settings
3. Run: `npm start` on port 3000

## Security

### Critical Rules

1. **NEVER** commit `.env.local` to git
2. **NEVER** expose Firebase Admin credentials
3. **NEVER** import `firebase-admin` in client components
4. Use different service accounts for dev/production

### Safe to Expose

- Client credentials (NEXT_PUBLIC_*): Safe in browser
- Server credentials (FIREBASE_ADMIN_*): Keep secret

### Production Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /supervisors/{supervisorId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == supervisorId;
    }
  }
}
```

See [Security Guide](../guides/security.md) for complete documentation.

## Next Steps

1. Read [Architecture Overview](../architecture/overview.md)
2. Review [API Reference](../architecture/backend/api-reference.md)
3. Study [Code Conventions](../guides/code-conventions.md)
4. Follow [Development Process](development-process.md) for project history

## Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

**Last Updated**: November 2025
