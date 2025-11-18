# Dashboard Architecture Documentation

## Overview

This document describes the architecture and design decisions for the MentorMatch Student Dashboard feature.

## Implementation Status

### Phase 1: UI Implementation (Static Components) - COMPLETED

**Completion Date**: November 18, 2025

Phase 1 focused on creating the static UI structure using Test-Driven Development with the Red-Green-Refactor methodology.

**Implemented Components**:
- `app/dashboard/layout.tsx` - Dashboard layout with auth protection
- `app/dashboard/page.tsx` - Router that redirects to role-specific routes
- `app/dashboard/student/page.tsx` - Student dashboard overview with static data
- `components/dashboard/StatCard.tsx` - Reusable stat card component

**Test Coverage**:
- 4 test suites with 16 passing tests
- 98.28% overall test coverage (98.28% statements, 90.9% branches, 100% functions)
- Test files:
  - `app/dashboard/__tests__/layout.test.tsx` (3 tests)
  - `app/dashboard/__tests__/page.test.tsx` (2 tests)
  - `app/dashboard/student/__tests__/page.test.tsx` (5 tests)
  - `components/dashboard/__tests__/StatCard.test.tsx` (6 tests)

**TDD Methodology Applied**:
Each component followed the Red-Green-Refactor cycle:
1. **RED**: Wrote failing tests first
2. **GREEN**: Implemented minimum code to pass tests
3. **REFACTOR**: Improved code quality (e.g., extracted StatCard component)

**Current Features**:
- Static dashboard layout with responsive design
- Three stat cards displaying placeholder data (0 values)
- Quick actions section with disabled buttons
- Mobile-responsive grid layout (1 column on mobile, 3 on desktop)

**Next Steps**:
- Phase 2: Routing Implementation (navigation and role-based redirects)
- Phase 3: Functionality Implementation (data fetching and user interactions)

## Architecture Decision: Multi-Route Approach

### Rationale

We chose a multi-route architecture over a single-page conditional rendering approach for the following reasons:

1. **Better Code Splitting**: Each route loads only the JavaScript needed for that specific page, reducing initial bundle size
2. **Scalability**: Easy to add new features and pages without bloating a single component
3. **Better URLs**: Bookmarkable, shareable links like `/dashboard/student/supervisors`
4. **Team Collaboration**: Different developers can work on different routes with minimal conflicts
5. **Testing**: Each page can be tested independently with focused test suites
6. **Next.js 14 Best Practices**: Leverages App Router's file-based routing and automatic code splitting

### Route Structure

**Implemented (Phase 1)**:
```
app/
├── dashboard/
│   ├── __tests__/
│   │   ├── layout.test.tsx     #  Tests for layout
│   │   └── page.test.tsx       #  Tests for router
│   ├── layout.tsx              #  Shared layout with auth protection
│   ├── page.tsx                #  Router that redirects to role-specific route
│   └── student/
│       ├── __tests__/
│       │   └── page.test.tsx  #  Tests for student dashboard
│       └── page.tsx           #  Student dashboard overview (static)

components/
├── dashboard/
│   ├── __tests__/
│   │   └── StatCard.test.tsx  #  Tests for StatCard
│   └── StatCard.tsx           #  Reusable stat card component
```

**Planned (Phase 2 & 3)**:
```
app/
├── dashboard/
│   ├── DashboardContext.tsx    # Shared context for user data
│   └── student/
│       ├── supervisors/
│       │   └── page.tsx       # Browse supervisors
│       └── applications/
│           └── page.tsx       # My applications
```

## Student-Specific Feature Scope

### Phase 1 Implementation

The initial implementation focuses exclusively on student features:

1. **Dashboard Overview**: Quick stats and recent activity
2. **Browse Supervisors**: Search, filter, and view available supervisors
3. **My Applications**: Track submitted applications and their status
4. **Application Submission**: Submit new project applications

### Future Roles (Not in Scope)

- Supervisor dashboard (review applications, manage capacity)
- Admin dashboard (monitor all projects, generate reports)

## Component Hierarchy

### Layout Structure

```
DashboardLayout (app/dashboard/layout.tsx)
├── Authentication Check
├── Student Role Verification
├── DashboardContext.Provider
└── Layout Shell
    ├── DashboardSidebar
    ├── DashboardHeader
    └── Page Content (children)
```

### Reusable Components

Located in `components/dashboard/`:

**Implemented (Phase 1)**:
- **StatCard**: Display metrics with optional icon (supports blue, green, gray, red colors)

**Planned (Phase 2 & 3)**:
- **DashboardSidebar**: Navigation menu for student routes
- **DashboardHeader**: User info and logout functionality
- **SupervisorCard**: Display supervisor information
- **ApplicationCard**: Display application details with status
- **ApplicationForm**: Submit new applications
- **SupervisorDetailModal**: Detailed supervisor view with application form
- **ErrorBoundary**: Catch and display errors gracefully

## Firestore Data Model

### Collections

#### users
```typescript
{
  userId: string
  email: string
  name: string
  role: 'student' | 'supervisor' | 'admin'
  department: string
  createdAt: Timestamp
}
```

#### supervisors
```typescript
{
  id: string
  name: string
  email: string
  department: string
  expertise: string[]
  researchAreas: string[]
  capacity: number          // Max students
  currentLoad: number       // Current students
  available: boolean
  createdAt: Timestamp
}
```

#### applications
```typescript
{
  id: string
  studentId: string
  supervisorId: string
  projectTitle: string
  projectDescription: string
  status: 'pending' | 'under-review' | 'accepted' | 'rejected'
  submittedAt: Timestamp
  updatedAt: Timestamp
  responseMessage?: string  // Optional feedback from supervisor
}
```

### Data Access Patterns

1. **Student Dashboard**: Fetch application count and supervisor count
2. **Browse Supervisors**: Query all supervisors with filters (department, expertise, availability)
3. **My Applications**: Query applications where studentId matches current user
4. **Submit Application**: Create new application document

## Testing Strategy: TDD with Red-Green-Refactor

### Principles

1. **Write tests first** (RED): Test fails because feature doesn't exist
2. **Implement minimum code** (GREEN): Make test pass
3. **Refactor**: Clean up code while keeping tests green
4. **Repeat**: Move to next test only when all current tests pass

### Test Structure

```
__tests__/
├── Unit Tests
│   ├── Components (rendering, props, interactions)
│   ├── Services (data fetching, error handling)
│   └── Utilities (validation, formatting)
├── Integration Tests
│   ├── Component composition
│   ├── Navigation flows
│   └── Data persistence
└── Coverage Target: 80%+
```

### Mocking Strategy

- **Firebase Auth**: Mock onAuthStateChanged, signIn, signOut
- **Firestore**: Mock collection queries, document operations
- **Next.js Router**: Mock useRouter, usePathname for navigation tests

## Authentication Flow

```
User visits /dashboard
    ↓
Layout checks authentication
    ↓
Not authenticated → Redirect to home
    ↓
Authenticated → Check user profile
    ↓
Not student role → Redirect to home with message
    ↓
Student role → Redirect to /dashboard/student
    ↓
Render dashboard with context
```

## State Management

### Context-Based Approach

We use React Context to share user data across dashboard components:

```typescript
DashboardContext {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
}
```

### Why Context?

- **Avoid Prop Drilling**: Pass user data to deeply nested components
- **Simple Solution**: No need for external state management library
- **Co-located**: State lives with the dashboard feature
- **Type-Safe**: Full TypeScript support

## Performance Considerations

1. **Code Splitting**: Automatic with Next.js App Router
2. **Loading States**: Skeleton loaders for better perceived performance
3. **Error Boundaries**: Prevent entire app crashes
4. **Memoization**: Use React.memo for expensive components (future optimization)
5. **Firestore Queries**: Indexed queries for fast lookups

## Security

1. **Client-Side Auth Check**: Redirect unauthorized users
2. **Firestore Rules**: Server-side validation (to be implemented)
3. **Role Verification**: Only students can access student routes
4. **Input Validation**: Sanitize and validate all form inputs

## Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Readers**: ARIA labels and semantic HTML
3. **Focus Management**: Proper focus order and trap in modals
4. **Color Contrast**: WCAG AA compliant colors
5. **Error Messages**: Clear, actionable feedback

## Future Enhancements

1. **Real-time Updates**: Firestore listeners for live application status updates
2. **Notifications**: Email/in-app notifications for status changes
3. **Advanced Filters**: Save filter preferences, more filter options
4. **Analytics**: Track user behavior and feature usage
5. **Mobile Optimization**: Responsive design improvements for mobile devices
