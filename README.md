# MentorMatch

A web-based platform for matching students with appropriate project supervisors at Braude College of Engineering.

## Overview

MentorMatch streamlines the process of matching students with project supervisors, transforming a fragmented manual process into a transparent, efficient system that benefits all stakeholders.

## Features

### For Students
- Browse available supervisors by expertise and research areas
- Submit project applications with detailed proposals
- Track application status in real-time
- View supervisor capacity and availability

### For Supervisors
- Set and manage supervision capacity
- Review and respond to student applications
- Manage project workload efficiently
- Communicate with students through the platform

### For Administrators
- Monitor all projects and assignments
- Assign unmatched students to appropriate supervisors
- Generate reports and analytics
- Ensure balanced supervision loads across faculty

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Client) + Firebase Admin SDK (Server)
- **Backend**: Next.js API Routes with traditional REST architecture
- **Testing**: Jest, React Testing Library, Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Final
```

2. Install dependencies
```bash
npm install
```

3. **Configure Firebase Admin SDK** (Required for backend API)

   Create a `.env.local` file in the project root with your Firebase credentials.
   
   See [docs/getting-started/setup-guide.md](./docs/getting-started/setup-guide.md) for complete setup instructions.

4. Run the development server
```bash
npm run dev
```

   You should see: `Firebase Admin SDK initialized successfully`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Running the Application

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Testing

#### Unit & Component Tests (Run Locally)
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit         # Unit tests only
npm run test:component    # Component tests only
npm run test:integration  # Integration tests only
```

#### E2E Tests (Run in CI/CD by default)
```bash
# Run all E2E tests (manual)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E flows
npm run test:e2e:student
npm run test:e2e:supervisor
npm run test:e2e:admin
```

**Note**: E2E tests are automatically executed in the CI/CD pipeline on every push/PR. They are **not** run on local commits to keep the development workflow fast. See [Testing Strategy Documentation](./docs/guides/testing-strategy.md#cicd-and-test-execution-workflow) for more details.

## Project Structure

```
├── app/
│   ├── api/              # Next.js API routes (backend)
│   ├── dashboard/        # Dashboard pages for different roles
│   ├── components/       # Page-specific components
│   └── ...               # Other pages (login, register, etc.)
├── lib/
│   ├── api/              # API client library
│   ├── middleware/       # Auth, validation, error handling
│   ├── services/         # Firebase service layer
│   ├── hooks/            # Custom React hooks
│   ├── firebase.ts       # Firebase client initialization
│   └── firebase-admin.ts # Firebase Admin SDK initialization
├── types/                # TypeScript type definitions
├── docs/                 # Comprehensive documentation
├── e2e/                  # End-to-end tests
├── scripts/              # Utility scripts
├── public/               # Static assets
└── ...config files       # Configuration files
```

## Documentation

Comprehensive documentation is available in the `docs/` directory. Start with the [Documentation Index](./docs/INDEX.md) for guided navigation.

### Quick Links

**Getting Started:**
- [Quick Start Guide](./docs/getting-started/quick-start.md) - Get up and running in 30 minutes
- [Setup Guide](./docs/getting-started/setup-guide.md) - Complete setup instructions
- [Development Process](./docs/getting-started/development-process.md) - Project history

**Architecture:**
- [Architecture Overview](./docs/architecture/overview.md) - System design
- [API Reference](./docs/architecture/backend/api-reference.md) - Complete API documentation
- [Dashboard Architecture](./docs/architecture/frontend/dashboard-architecture.md) - Frontend structure

**Guides:**
- [Testing Strategy](./docs/guides/testing-strategy.md) - Testing guidelines and best practices
- [Security](./docs/guides/security.md) - Security architecture and best practices
- [Code Conventions](./docs/guides/code-conventions.md) - Coding standards
- [Type System](./docs/guides/type-system.md) - TypeScript types

**Reference:**
- [Firebase Usage](./docs/reference/firebase-usage.md) - Firebase integration patterns

**For AI-Assisted Development:**
- [AI Context Files](./docs/ai-context/) - Optimized documentation for AI assistants

## Deployment

This project is configured for automatic deployment on Vercel. Every push to the main branch will trigger a new deployment.

### Environment Variables for Production

When deploying to Vercel or other hosting platforms:

1. Add all environment variables from `.env.local` in your hosting platform's settings
2. Ensure the Firebase Admin private key formatting is preserved
3. Test in a preview deployment before going to production

See [docs/getting-started/setup-guide.md](./docs/getting-started/setup-guide.md#deployment) for detailed deployment instructions.

## Team

- Roee Bar
- Eldar Gafarov

**Supervisor**: Dr. Julia Sheidin

## License

This project is part of a final year academic project at Braude College of Engineering.

