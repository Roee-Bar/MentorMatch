# System Architecture Overview

## Introduction

MentorMatch is a web-based platform built with modern technologies to facilitate project supervisor matching at Braude College of Engineering. The system follows a serverless architecture pattern using Next.js for the frontend and Firebase for backend services.

## Technology Stack

### Frontend Layer

- **Next.js 14 (App Router)** - Modern React framework with SSR and file-based routing
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework with custom strategy
- **React 18** - UI library with latest features

### Backend Layer

- **Firebase Services** - Serverless backend infrastructure
  - **Cloud Firestore** - NoSQL database for application data
  - **Firebase Authentication** - User authentication and session management
  - **Firebase Storage** - File storage for profile photos
  - **Firebase Admin SDK** - Server-side operations with elevated privileges
- **Next.js API Routes** - RESTful API endpoints with traditional backend architecture

### Testing & Deployment

- **Jest + React Testing Library** - Unit and component testing
- **Playwright** - End-to-end testing
- **GitHub Actions** - CI/CD pipeline
- **Vercel** - Hosting and deployment platform

## High-Level Architecture

```
User Browser
    ↓
Next.js 14 App Router (Frontend)
    ↓
┌─────────────┬─────────────┐
│   Client    │   Server    │
│  Component  │  API Routes │
│   Firebase  │   Firebase  │
│  Client SDK │  Admin SDK  │
└─────────────┴─────────────┘
    ↓               ↓
Firebase Services
├── Authentication
├── Cloud Firestore (Database)
└── Storage (Files)
    ↓
Vercel Edge Network (Global CDN)
```

## Application Layers

### 1. Presentation Layer

**Location**: `app/`, `app/components/`

**Responsibilities**:
- Render UI components
- Handle user interactions
- Display data from service layer
- Manage client-side state
- Route protection and navigation

**Key Features**:
- File-based routing with Next.js App Router
- Server and client components
- Reusable component library
- Role-based dashboards

### 2. API Layer

**Location**: `app/api/`

**Responsibilities**:
- RESTful API endpoints
- Authentication verification
- Request validation
- Error handling
- Response formatting

**Key Features**:
- 20+ API endpoints
- Token-based authentication
- Role-based authorization
- Comprehensive testing (111+ tests)

### 3. Service Layer

**Location**: `lib/services/`

**Responsibilities**:
- Abstract Firebase SDK operations
- Provide clean API for data access
- Handle errors gracefully
- Transform data between formats
- Centralize business logic

**Key Services**:
- UserService - User profile operations
- StudentService - Student-specific operations
- SupervisorService - Supervisor operations
- ApplicationService - Application management
- ProjectService - Project management
- AdminService - Admin operations

**Benefits**:
- Easy to test (mock services)
- Single source of truth
- Can swap backend without changing UI

### 4. Data Layer

**Location**: Firebase Cloud Firestore

**Collections**:
- `users` - Base user profiles
- `students` - Student details
- `supervisors` - Supervisor profiles
- `applications` - Project applications
- `projects` - Active projects
- `admins` - Admin profiles

## Authentication & Authorization

### Authentication Flow

1. User submits credentials
2. Firebase Auth validates and issues token
3. Token stored client-side by Firebase SDK
4. Token sent with each API request
5. Server verifies token using Firebase Admin SDK
6. Access granted based on verification

### Authorization Strategy

**Route Protection**:
- Layout-level authentication (dashboard layout)
- Page-level role verification
- Component-level conditional rendering

**API Protection**:
- Middleware verifies authentication token
- Role-based access control in endpoints
- Firestore security rules (planned)

### User Roles

- **Student** - Browse supervisors, submit applications, track status
- **Supervisor** - Review applications, manage capacity, respond to students
- **Admin** - Manage all users, assign students, view reports

## Data Flow

### Typical Request Flow

```
User Action
    ↓
Component Event Handler
    ↓
API Client Function
    ↓
Next.js API Route
    ↓
Middleware (Auth Check)
    ↓
Service Layer Function
    ↓
Firebase SDK Operation
    ↓
Cloud Firestore / Storage
    ↓
Response back through layers
    ↓
Component State Update
    ↓
UI Re-render
```

## Key Design Decisions

### 1. Service Layer Pattern

**Decision**: Centralize all Firebase operations in service layer

**Benefits**:
- Easier testing (mock services, not Firebase)
- Consistent error handling
- Single source of truth
- Backend can be swapped without changing components

### 2. Multi-Route Dashboard

**Decision**: Separate routes for each role (`/dashboard/student`, `/dashboard/supervisor`)

**Benefits**:
- Better code splitting (load only needed code)
- Cleaner URLs (bookmarkable, shareable)
- Easier testing (independent test suites)
- Scalability (easy to add new roles)

See [frontend/dashboard-architecture.md](frontend/dashboard-architecture.md) for details.

### 3. Traditional REST API Architecture

**Decision**: Use Next.js API routes with RESTful patterns and Firebase Admin SDK

**Benefits**:
- Server-side authentication verification
- Secure database operations
- Familiar REST patterns
- Better security than client-only access
- 111+ tests for reliability

See [backend/api-reference.md](backend/api-reference.md) for API documentation.

### 4. Hybrid Tailwind Strategy

**Decision**: Combine Tailwind utilities with custom component classes

**Benefits**:
- Reduce class duplication
- Easier maintenance
- Consistent design patterns
- Better readability

See [frontend/tailwind-usage.md](frontend/tailwind-usage.md) for implementation.

### 5. Firebase over Custom Backend

**Decision**: Use Firebase for all backend services

**Benefits**:
- Rapid development
- Automatic scaling
- Real-time capabilities
- Cost-effective for academic project
- Focus on frontend features

## State Management

### Context-Based State

**DashboardContext** - Shares user profile and auth state across dashboard routes

### Local Component State

**React useState/useEffect** - Manages form inputs, UI state, temporary data

### No Global State Library

**Decision**: No Redux or Zustand

**Reasoning**:
- Application state is simple (user profile + page data)
- Context API sufficient for current needs
- Reduces bundle size and complexity

## Security Architecture

### Client-Side Security

- Route guards for protected pages
- Token-based authentication
- Role verification
- Secure credential storage (Firebase SDK)

### Server-Side Security

- Token verification using Firebase Admin
- Role-based access control
- Input validation and sanitization
- Environment variable protection

See [guides/security.md](../guides/security.md) for complete security documentation.

## Performance Considerations

### Code Splitting

- Automatic by Next.js App Router
- Users only download JavaScript for current page

### Loading States

- Skeleton loaders during data fetching
- Better perceived performance

### Firestore Optimization

- Indexed queries for performance
- Batch reads with `Promise.all()`
- Specific field selection (future)

## Scalability

### Current Scale

- Target: ~500 students, ~50 supervisors per semester
- Expected Load: Low (academic environment)
- Peak Times: Application deadline periods

### Firebase Limits (Free Tier)

- 50,000 document reads/day
- 20,000 document writes/day
- 1GB storage
- Current usage: Well within limits

### Future Scaling Options

1. Upgrade Firebase plan if needed
2. Implement caching to reduce reads
3. Optimize queries with indexing
4. Add rate limiting

## Development Workflow

```
Feature Branch
    ↓
Write Tests (TDD)
    ↓
Implement Feature
    ↓
Local Tests Pass
    ↓
Commit (Pre-commit hooks run)
    ↓
Push to GitHub
    ↓
GitHub Actions (Tests + Build)
    ↓
Create Pull Request
    ↓
Code Review
    ↓
Merge to Main
    ↓
Vercel Automatic Deployment
```

## Directory Structure

```
app/
├── api/              # API routes (backend)
├── dashboard/        # Role-based dashboards
├── components/       # Reusable components
└── ...              # Other pages

lib/
├── api/             # API client library
├── middleware/      # Auth, validation, error handling
├── services/        # Firebase service layer
├── hooks/           # Custom React hooks
├── firebase.ts      # Firebase client setup
└── firebase-admin.ts # Firebase Admin SDK setup

types/               # TypeScript definitions
docs/                # Documentation
e2e/                 # End-to-end tests
```

## Related Documentation

### Frontend Architecture
- [Dashboard Architecture](frontend/dashboard-architecture.md) - Dashboard structure and routing
- [Component Library](frontend/component-library.md) - Reusable components
- [Tailwind Usage](frontend/tailwind-usage.md) - CSS architecture

### Backend Architecture
- [API Reference](backend/api-reference.md) - Complete API documentation
- [Implementation Guide](backend/implementation-guide.md) - Backend patterns
- [Backend Summary](backend/summary.md) - What was built

### Guides
- [Type System](../guides/type-system.md) - TypeScript types
- [Code Conventions](../guides/code-conventions.md) - Coding standards
- [Testing Strategy](../guides/testing-strategy.md) - Testing approach
- [Security](../guides/security.md) - Security architecture

### Reference
- [Firebase Usage](../reference/firebase-usage.md) - Firebase patterns

## External Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated**: November 2025

**Project**: MentorMatch - Final Year Project, Braude College of Engineering

