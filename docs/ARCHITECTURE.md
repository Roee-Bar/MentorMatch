# System Architecture

MentorMatch system design and technical architecture overview.

## Technology Stack

### Frontend
- Next.js 14 (App Router) - React framework with SSR
- TypeScript - Type safety
- Tailwind CSS - Utility-first styling
- React 18 - UI library

### Backend
- Next.js API Routes - REST API endpoints
- Firebase Admin SDK - Server-side operations
- Zod - Request validation

### Database & Services
- Cloud Firestore - NoSQL database
- Firebase Authentication - User authentication
- Firebase Storage - File storage

### Testing & Deployment
- Jest + React Testing Library - Unit/component tests
- Playwright - E2E testing
- GitHub Actions - CI/CD
- Vercel - Hosting

## System Architecture

```
User Browser
    ↓
Next.js Frontend (React Components)
    ↓
API Client Library (lib/api/client.ts)
    ↓
Next.js API Routes (app/api/*)
    ↓
Middleware (Auth + Validation)
    ↓
Firebase Admin SDK
    ↓
Cloud Firestore
```

### Request Flow

1. **Client**: User interacts with React component
2. **Authentication**: Get Firebase ID token
3. **API Call**: Send request via API client
4. **Middleware**: Verify token, check permissions
5. **Validation**: Validate request data (Zod)
6. **Business Logic**: Process request
7. **Database**: Firebase operations via Admin SDK
8. **Response**: Return data to client

## Frontend Architecture

### Dashboard System

Role-based dashboards with shared layouts:

```
app/dashboard/
├── layout.tsx           # Auth protection + shared layout
├── page.tsx             # Role router
├── student/
│   ├── page.tsx         # Student dashboard
│   ├── applications/    # Student applications
│   └── supervisors/     # Browse supervisors
├── supervisor/
│   ├── page.tsx         # Supervisor dashboard
│   ├── applications/    # Review applications
│   └── profile/         # Manage profile
└── admin/
    └── page.tsx         # Admin dashboard
```

### Component Structure

**Layout Components**:
- `Header` - Site navigation
- `Footer` - Site footer
- Dashboard layouts with auth protection

**Dashboard Components**:
- `StatCard` - Metric displays
- `ApplicationCard` - Application details
- `SupervisorCard` - Supervisor profiles
- `CapacityIndicator` - Visual capacity gauge

**Styling Approach**:
- Tailwind utilities for unique styles
- Component classes for repeated patterns (`.btn-primary`, `.card-base`)
- Theme extensions for design tokens

### State Management

- **Local State**: Component-level with `useState`
- **Authentication**: Firebase Auth + custom hooks
- **Data Fetching**: API client + async/await
- **Context**: Dashboard context for shared user data

## Backend Architecture

### API Routes Structure

```
app/api/
├── supervisors/
│   ├── route.ts                    # List supervisors
│   └── [id]/
│       ├── route.ts                # Get/update supervisor
│       ├── applications/route.ts   # Supervisor's applications
│       └── projects/route.ts       # Supervisor's projects
├── applications/
│   ├── route.ts                    # List/create applications
│   └── [id]/
│       ├── route.ts                # Get/update/delete application
│       └── status/route.ts         # Update status
├── students/
│   ├── route.ts                    # List students
│   ├── [id]/route.ts               # Get/update student
│   └── unmatched/route.ts          # Unmatched students
├── projects/
│   ├── route.ts                    # List/create projects
│   └── [id]/route.ts               # Get project
├── users/
│   ├── route.ts                    # List users
│   └── [id]/route.ts               # Get/update user
└── admin/
    ├── stats/route.ts              # Dashboard statistics
    └── reports/route.ts            # Generate reports
```

### Middleware Layer

**Authentication Middleware** (`lib/middleware/auth.ts`):
- Verify Firebase ID tokens
- Extract user context
- Role-based authorization

**Validation Middleware** (`lib/middleware/validation.ts`):
- Zod schema validation
- Type-safe request parsing
- Detailed error messages

**Error Handler** (`lib/middleware/errorHandler.ts`):
- Centralized error handling
- Consistent error responses
- Status code management

### API Client Library

Type-safe client for frontend components:

```typescript
import { apiClient } from '@/lib/api/client';

// Get Firebase token
const token = await auth.currentUser?.getIdToken();

// Make authenticated API call
const response = await apiClient.getSupervisors(token, {
  available: true
});
```

**Features**:
- Automatic token injection
- Type-safe methods
- Consistent error handling
- Standard response format

## Database Schema

### Collections

**users**:
- `id` (string) - User UID
- `email` (string)
- `name` (string)
- `role` ('student' | 'supervisor' | 'admin')
- `department` (string)
- `createdAt` (timestamp)

**supervisors**:
- `id` (string)
- `name` (string)
- `department` (string)
- `bio` (string)
- `expertiseAreas` (string[])
- `researchInterests` (string[])
- `availabilityStatus` ('available' | 'limited' | 'unavailable')
- `currentCapacity` (number)
- `maxCapacity` (number)

**applications**:
- `id` (string)
- `studentId` (string)
- `supervisorId` (string)
- `projectTitle` (string)
- `projectDescription` (string)
- `status` ('pending' | 'under_review' | 'approved' | 'rejected')
- `submittedAt` (timestamp)
- `feedback` (string, optional)

## Security Architecture

### Authentication Flow

1. User logs in via Firebase Auth (client-side)
2. Firebase returns ID token
3. Client includes token in API requests
4. API route verifies token via Admin SDK
5. Request proceeds if valid

### Authorization

**Role-Based Access Control (RBAC)**:

- **Students**: Own data, browse supervisors, create applications
- **Supervisors**: Own data, review applications, manage capacity
- **Admins**: All data, user management, system reports

### Data Validation

- **Client-side**: Immediate feedback, UX improvement
- **Server-side**: Security, Zod schemas validate all input
- **Firebase Rules**: To be implemented for production

### Security Features

- Firebase ID token verification
- Role-based authorization
- Request validation (Zod)
- Environment variable protection
- HTTPS everywhere (Vercel)
- Rate limiting (built into Firebase)

## Testing Architecture

### Test Coverage

- **111 backend tests**: API routes, middleware, client
- **218+ frontend tests**: Components, pages, integration
- **E2E tests**: Student, supervisor, admin flows
- **Total**: 329+ tests, 100% passing

### Test Organization

```
lib/
├── middleware/__tests__/     # Middleware tests (41)
├── api/__tests__/            # API client tests (24)
app/api/
├── supervisors/__tests__/    # Route tests (13)
├── applications/__tests__/   # Route tests (14)
├── students/__tests__/       # Route tests (8)
└── projects/__tests__/       # Route tests (11)
e2e/
├── student-flow.spec.ts      # Student E2E
├── supervisor-flow.spec.ts   # Supervisor E2E
└── admin-flow.spec.ts        # Admin E2E
```

### Testing Strategy

- **Unit**: Individual functions
- **Component**: React components
- **Integration**: API routes, page components
- **E2E**: Complete user workflows

## Architecture Decisions

### Why Traditional REST API?

Chose REST API over pure serverless Firebase for:

1. **Academic Requirements**: Demonstrates backend knowledge
2. **Separation of Concerns**: Clear client/server boundary
3. **Testability**: Standard testing patterns
4. **Security**: Centralized auth/authorization
5. **Industry Standards**: Universal, transferable skills
6. **Control**: Full visibility into request/response flow

**Trade-offs**: Additional development time, more complex setup

**Benefits**: Complete control, comprehensive tests, clear documentation, maintainability

### Why Next.js App Router?

- File-based routing (intuitive structure)
- Automatic code splitting (better performance)
- Server/client component flexibility
- Built-in API routes (integrated backend)
- TypeScript support (type safety)

### Why Tailwind CSS?

Hybrid approach combining:
- Utility classes for unique styles
- Component classes for patterns
- Theme extensions for design tokens

**Benefits**: Consistency, maintainability, performance

## Performance Considerations

- **Code Splitting**: Automatic via Next.js
- **Caching**: Firebase handles connection pooling
- **Indexed Queries**: Firestore indexes for fast lookups
- **Loading States**: Better perceived performance
- **Error Boundaries**: Prevent app crashes

## Scalability

### Current Capacity
- Academic project (~100 users)
- Firebase free tier sufficient
- Single region deployment

### Future Scaling
- Firestore auto-scales
- Add pagination for large datasets
- Implement caching layer
- Multi-region deployment
- Rate limiting middleware

## Development Workflow

```
Developer
    ↓
Feature Branch
    ↓
Pre-commit Hook (tests)
    ↓
Git Push
    ↓
GitHub Actions CI (tests + build)
    ↓
Vercel Preview Deployment
    ↓
Code Review + Approval
    ↓
Merge to Main
    ↓
Production Deployment
```

## Related Documentation

- [docs/API-REFERENCE.md](API-REFERENCE.md) - Complete API documentation
- [docs/DEVELOPMENT.md](DEVELOPMENT.md) - Coding conventions
- [docs/SETUP.md](SETUP.md) - Setup instructions
- [docs/getting-started/development-process.md](getting-started/development-process.md) - Project timeline

