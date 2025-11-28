# Quick Start Guide

Get up and running with MentorMatch in under 30 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** installed
- A **Firebase account** (free tier is fine)

## 5-Minute Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd Final

# Install dependencies
npm install
```

### 2. Configure Firebase (3 minutes)

You'll need both client and server Firebase credentials.

**Option A: Use the setup script** (Recommended)

```bash
# Windows (PowerShell)
.\scripts\setup-firebase-admin.ps1

# Mac/Linux
chmod +x scripts/setup-firebase-admin.sh
./scripts/setup-firebase-admin.sh
```

**Option B: Manual setup**

Create `.env.local` in the project root:

```bash
# Firebase Client Configuration (Public - Client-Side)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK Credentials (Server-Side ONLY)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Configuration
NEXT_PUBLIC_API_URL=/api
NODE_ENV=development
```

For detailed instructions on getting these credentials, see [setup-guide.md](setup-guide.md).

### 3. Run the Application

```bash
npm run dev
```

Look for: `Firebase Admin SDK initialized successfully`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Create an Account

1. Click "Get Started" or "Sign Up"
2. Choose your role (Student or Supervisor)
3. Fill in your details
4. Upload a profile photo (optional)
5. Click "Register"

### 2. Explore the Dashboard

**As a Student:**
- Browse available supervisors
- Submit project applications
- Track application status

**As a Supervisor:**
- Review student applications
- Manage supervision capacity
- Respond to applications

### 3. Run the Tests

Verify everything is working:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

You should see all tests passing.

## What You've Built

Congratulations! You now have:

- A working Next.js application
- Firebase authentication configured
- Access to the full API (20+ endpoints)
- A comprehensive test suite
- A modern, responsive UI

## Next Steps

### Learn the Architecture

Read these in order:

1. [Architecture Overview](../architecture/overview.md) - System design
2. [API Reference](../architecture/backend/api-reference.md) - Available endpoints
3. [Code Conventions](../guides/code-conventions.md) - Coding standards

### Start Developing

Depending on what you want to do:

**Add a new feature:**
1. Read [Backend Implementation Guide](../architecture/backend/implementation-guide.md)
2. Follow [Code Conventions](../guides/code-conventions.md)
3. Write tests following [Testing Strategy](../guides/testing-strategy.md)

**Customize the UI:**
1. Review [Component Library](../architecture/frontend/component-library.md)
2. Learn [Tailwind Usage](../architecture/frontend/tailwind-usage.md)
3. Study [Dashboard Architecture](../architecture/frontend/dashboard-architecture.md)

**Understand the data:**
1. Read [Type System](../guides/type-system.md)
2. Review [Firebase Usage](../reference/firebase-usage.md)

## Common First Tasks

### Task 1: Seed Test Data

```bash
# Seed test accounts for development
npm run seed:test-accounts
```

This creates sample students, supervisors, and applications.

### Task 2: Run End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Task 3: Build for Production

```bash
# Build the application
npm run build

# Run production server
npm start
```

## Troubleshooting

### "Firebase Admin SDK initialization failed"

**Problem**: Missing or incorrect Firebase Admin credentials

**Solution**:
1. Check `.env.local` exists in project root
2. Verify all FIREBASE_ADMIN_* variables are set
3. Ensure private key is properly formatted (see [setup-guide.md](setup-guide.md))
4. Restart the dev server

### "Module not found" errors

**Problem**: Dependencies not installed

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use

**Problem**: Another process is using port 3000

**Solution**:
```bash
# Kill the process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Tests failing

**Problem**: Environment or configuration issue

**Solution**:
1. Ensure all dependencies are installed: `npm install`
2. Clear Jest cache: `npm test -- --clearCache`
3. Check that firebase-admin is properly mocked in tests
4. Run specific test to isolate issue: `npm test <test-file-name>`

## Need More Help?

### Documentation

- [Setup Guide](setup-guide.md) - Detailed setup instructions
- [Development Process](development-process.md) - Project history and decisions
- [Main Index](../INDEX.md) - All documentation

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Common Resources in Code

- Example API route: `app/api/supervisors/route.ts`
- Example test: `app/api/supervisors/__tests__/route.test.ts`
- Example component: `app/components/dashboard/SupervisorCard.tsx`
- Example service: `lib/services/firebase-services.ts`

## Development Workflow

Once you're set up, your typical workflow will be:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Write code following [Code Conventions](../guides/code-conventions.md)
   - Write tests following [Testing Strategy](../guides/testing-strategy.md)

3. **Run tests locally**
   ```bash
   npm test
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```
   
   Pre-commit hooks will automatically:
   - Run tests
   - Check for linting errors
   - Verify package-lock.json is in sync

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```
   
   GitHub Actions will automatically:
   - Run all tests
   - Verify build succeeds
   - Run E2E tests
   - Report coverage

6. **Merge and deploy**
   - After PR approval, merge to main
   - Vercel automatically deploys to production

## You're Ready!

You now have everything you need to start developing with MentorMatch. 

- Follow [Development Process](development-process.md) to understand the project history
- Use [Architecture Overview](../architecture/overview.md) to understand the system design
- Reference [API Documentation](../architecture/backend/api-reference.md) when working with the backend
- Check [Code Conventions](../guides/code-conventions.md) to match the existing code style

Happy coding!

---

**Last Updated**: November 2025

**Project**: MentorMatch - Final Year Project, Braude College of Engineering

