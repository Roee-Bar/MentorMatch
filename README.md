# MentorMatch

A web-based platform for matching students with project supervisors at Braude College of Engineering.

## Overview

MentorMatch streamlines the process of connecting students with appropriate project supervisors, transforming a manual, fragmented process into a transparent and efficient system.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore, Storage)
- Firebase Admin SDK
- Vercel (Deployment)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Final

# Install dependencies
npm install

# Configure environment variables
# Create .env.local with Firebase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
Client (React Components)
    ↓
API Client Library
    ↓
Next.js API Routes (REST API)
    ↓
Firebase Admin SDK
    ↓
Cloud Firestore
```

### Key Features

**Authentication & Security**
- Email-based user registration
- Email verification required before platform access
- Secure password authentication
- Role-based access control (Student, Supervisor, Admin)

**Students**: Browse supervisors, submit applications, track status

**Supervisors**: Manage capacity, review applications, track projects

**Admins**: Monitor system, assign students, generate reports

## Development

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript errors

# E2E Testing
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run tests with UI mode
npm run test:e2e:headed    # Run tests in headed mode (visible browser)
npm run test:e2e:debug     # Run tests in debug mode
npm run test:e2e:report    # Show HTML test report
```

## E2E Testing

MentorMatch uses Playwright for end-to-end testing. See [E2E Testing Guide](docs/testing/E2E_TESTING_GUIDE.md) for detailed information.

### Quick Start

1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install --with-deps`
3. Ensure dev server is running: `npm run dev`
4. Run tests: `npm run test:e2e`

### CI/CD

Tests run automatically in Jenkins CI/CD pipeline. 

**Quick Setup Options:**

**Option 1: Automated Setup (Recommended)**
```bash
# Start Jenkins with Docker
npm run jenkins:start

# Setup Jenkins job (after Jenkins is configured)
npm run jenkins:setup

# Or use manual setup scripts
bash scripts/setup-jenkins.sh
```

**Option 2: Manual Setup**
1. Validate setup: `npm run test:validate-setup`
2. Test locally: `npm run test:pipeline-local`
3. Follow [Jenkins Quick Start Guide](docs/jenkins/QUICK_START.md)

**Documentation:**
- [Automated Setup Guide](docs/jenkins/AUTOMATED_SETUP.md) - Docker and automation scripts
- [Quick Start Guide](docs/jenkins/QUICK_START.md) - 5-minute manual setup
- [Complete Setup Guide](docs/jenkins/JENKINS_SETUP.md) - Detailed configuration
- [Setup Checklist](docs/jenkins/SETUP_CHECKLIST.md) - Verification checklist

## Project Structure

```
├── app/
│   ├── api/              # REST API routes
│   ├── authenticated/    # Role-based authenticated pages
│   └── components/       # React components
├── lib/
│   ├── api/              # API client
│   ├── middleware/       # Auth, validation, errors
│   ├── services/         # Firebase services
│   └── hooks/            # React hooks
├── types/                # TypeScript types
└── scripts/              # Utility scripts
```

## Deployment

Automatic deployment via Vercel on push to main branch.

### Environment Variables

Add to Vercel project settings and `.env.local` for local development. See `.env.example` for complete list:

**Required (Firebase):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Optional (E2E Testing):**
```
E2E_BASE_URL=http://localhost:3000
```

**Optional (CI/CD - Report Portal):**
```
RP_ENDPOINT=https://your-reportportal-instance.com
RP_TOKEN=your-reportportal-token
RP_PROJECT=mentormatch
```

## Security

- Firebase Authentication for client-side auth
- Firebase Admin SDK for server-side token verification
- **Email Verification**: Client-side email verification using Firebase Auth SDK
  - Users must verify their email addresses before accessing the platform
  - Implementation uses Firebase's native `sendEmailVerification()` method
  - Cost-effective: Free tier (1,200 emails/month) sufficient for development
  - No additional email service integration required
  - Can be migrated to custom email service later if needed for higher volumes
- Role-based access control (RBAC)
- Request validation with Zod schemas
- Environment variable protection

## Team

- Roee Bar
- Eldar Gafarov

**Supervisor**: Dr. Julia Sheidin

**Institution**: Braude College of Engineering

## License

Academic project - Final Year Computer Science
