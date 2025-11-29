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
- Jest + React Testing Library
- Playwright (E2E testing)
- GitHub Actions (CI/CD)
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
# See docs/SETUP.md for details

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

# Testing
npm test             # Unit + integration tests
npm run test:e2e     # End-to-end tests
npm run test:coverage # Coverage report

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript errors
```

## Project Structure

```
├── app/
│   ├── api/              # REST API routes
│   ├── dashboard/        # Role-based dashboards
│   └── components/       # React components
├── lib/
│   ├── api/              # API client
│   ├── middleware/       # Auth, validation, errors
│   ├── services/         # Firebase services
│   └── hooks/            # React hooks
├── types/                # TypeScript types
├── docs/                 # Documentation
├── e2e/                  # E2E tests
└── scripts/              # Utility scripts
```

## Documentation

Comprehensive docs available in `/docs`:

- **[docs/SETUP.md](docs/SETUP.md)** - Complete setup guide
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design
- **[docs/API-REFERENCE.md](docs/API-REFERENCE.md)** - API documentation
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guidelines
- **[docs/getting-started/development-process.md](docs/getting-started/development-process.md)** - Project timeline

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui
```

**Test Coverage**: 329+ tests (100% passing)
- 111 backend tests
- 218+ frontend/component tests
- E2E coverage for all user flows

## Deployment

Automatic deployment via Vercel on push to main branch.

### Environment Variables

Add to Vercel project settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

See [docs/SETUP.md](docs/SETUP.md#deployment) for detailed instructions.

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
