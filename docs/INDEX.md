# MentorMatch Documentation

Complete navigation guide for the MentorMatch project documentation.

## Quick Start

New to the project? Follow this path:
1. [Setup Guide](getting-started/setup-guide.md) - Get running in 30 minutes
2. [Architecture Overview](architecture/overview.md) - Understand the system
3. [Development Process](getting-started/development-process.md) - Project history

## Documentation Structure

```
docs/
├── getting-started/      # Setup and onboarding
├── architecture/         # System design
│   ├── frontend/         # UI architecture
│   └── backend/          # API architecture
├── guides/               # Development guides
├── reference/            # Technical references
└── troubleshooting/      # Common issues
```

## Getting Started

- [Setup Guide](getting-started/setup-guide.md) - Complete installation and Firebase configuration
- [Development Process](getting-started/development-process.md) - Project evolution and decisions

## Architecture

### System Overview
- [Architecture Overview](architecture/overview.md) - System design and technology stack

### Frontend
- [Dashboard Architecture](architecture/frontend/dashboard-architecture.md) - Dashboard structure and routing
- [Component Library](architecture/frontend/component-library.md) - Reusable UI components
- [Tailwind Usage](architecture/frontend/tailwind-usage.md) - CSS patterns

### Backend
- [API Reference](architecture/backend/api-reference.md) - Complete API documentation (20+ endpoints)
- [Implementation Guide](architecture/backend/implementation-guide.md) - Backend patterns and examples
- [Backend Summary](architecture/backend/summary.md) - High-level overview

## Development Guides

- [Development Workflow](guides/development-workflow.md) - Testing, CI/CD, and development process
- [Naming Conventions](guides/naming-conventions.md) - File, variable, and function naming
- [Component Patterns](guides/component-patterns.md) - React component best practices
- [API Patterns](guides/api-patterns.md) - Backend API conventions
- [Type System](guides/type-system.md) - TypeScript types and interfaces
- [Security](guides/security.md) - Security architecture and best practices

## Technical Reference

- [Firebase Guide](reference/firebase.md) - Complete Firebase reference (Auth, Firestore, Admin SDK)

## Troubleshooting

- [Build Failures](troubleshooting/build-failures.md) - CI/CD and build error solutions

## Common Tasks

### Setting Up
1. Read [Setup Guide](getting-started/setup-guide.md)
2. Configure Firebase credentials
3. Run `npm install` and `npm run dev`
4. Verify tests pass with `npm test`

### Adding a Feature
1. Review [API Reference](architecture/backend/api-reference.md) for existing patterns
2. Follow [Component Patterns](guides/component-patterns.md) for UI
3. Use [Type System](guides/type-system.md) for types
4. Write tests per [Development Workflow](guides/development-workflow.md)

### Fixing Issues
1. Check [Troubleshooting](troubleshooting/build-failures.md)
2. Review GitHub Actions logs
3. Verify environment variables
4. Test locally with same Node version (20.x)

## By User Role

**New Developer**
1. [Setup Guide](getting-started/setup-guide.md)
2. [Architecture Overview](architecture/overview.md)
3. [Development Process](getting-started/development-process.md)

**Feature Developer**
1. [API Reference](architecture/backend/api-reference.md)
2. [Component Patterns](guides/component-patterns.md)
3. [Type System](guides/type-system.md)

**Reviewer/Evaluator**
1. [Backend Summary](architecture/backend/summary.md)
2. [Architecture Overview](architecture/overview.md)
3. [Security](guides/security.md)

## External Resources

### Framework
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Backend & Database
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

### Styling & Testing
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io)
- [Playwright Documentation](https://playwright.dev)

---

**Last Updated**: November 2025  
**Project**: MentorMatch - Braude College of Engineering
