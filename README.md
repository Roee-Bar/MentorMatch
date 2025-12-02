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
- Playwright (E2E Testing)
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
npm run test:e2e         # Run all e2e tests
npm run test:e2e:ui      # Run tests in UI mode (interactive)
npm run test:e2e:debug   # Run tests in debug mode
npm run test:e2e:report  # View HTML test report
```

## Testing

### End-to-End Testing with Playwright

The project uses Playwright for automated end-to-end testing of user flows and behaviors.

#### Running Tests Locally

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Run tests**:
   ```bash
   # Run all tests (headless mode)
   npm run test:e2e
   
   # Run tests with interactive UI
   npm run test:e2e:ui
   
   # Debug specific tests
   npm run test:e2e:debug
   ```

3. **View test reports**:
   ```bash
   npm run test:e2e:report
   ```

#### Test Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts       # Reusable authentication helpers
├── tests/
│   └── auth/
│       └── login.spec.ts     # Login flow tests
└── utils/
    └── test-data.ts          # Test account credentials
```
```

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

## CI/CD

### GitHub Actions

The project uses GitHub Actions for continuous integration and testing.

#### E2E Test Pipeline

- **Trigger**: Automatically runs on all pushes and pull requests
- **Environment**: Ubuntu latest with Node.js 18
- **Browser**: Chromium (Playwright)
- **Artifacts**: Test reports and results are uploaded for 30 days

#### Required GitHub Secrets

For CI/CD to work, add these secrets to your GitHub repository settings (Settings → Secrets and variables → Actions):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

#### Viewing Test Results

When tests run in CI:
1. Navigate to the "Actions" tab in GitHub
2. Select the workflow run
3. Download the `playwright-report` artifact to view detailed results

## Deployment

Automatic deployment via Vercel on push to main branch.

### Environment Variables

Add to Vercel project settings and `.env.local` for local development:

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

## Security

- Firebase Authentication for client-side auth
- Firebase Admin SDK for server-side token verification
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
