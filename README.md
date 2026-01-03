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

## Deployment

Automatic deployment via Vercel on push to main branch.

### Environment Variables

Add to Vercel project settings and `.env.local` for local development:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev  # Optional, defaults to onboarding@resend.dev if not set
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
