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
- `app/dashboard/student/page.tsx` - Student dashboard overview with dynamic data
- `app/dashboard/admin/page.tsx` - Admin dashboard with role-based access control
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
- Student dashboard with dynamic data fetching (applications and supervisors)
- Admin dashboard with role-based access control
- Stat cards displaying real-time data from Firebase
- Quick actions section with navigation
- Mobile-responsive grid layout (1 column on mobile, 3 on desktop)
- Authentication and authorization flows with proper redirects
- Logout functionality with homepage redirect

**Next Steps**:
- Phase 2: Routing Implementation (additional navigation and nested routes)
- Phase 3: Functionality Implementation (application submission, supervisor management)

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
│   ├── student/
│   │   ├── __tests__/
│   │   │   └── page.test.tsx  #  Tests for student dashboard
│   │   └── page.tsx           #  Student dashboard overview (dynamic data)
│   └── admin/
│       └── page.tsx           #  Admin dashboard with role-based access

components/
├── dashboard/
│   ├── __tests__/
│   │   └── StatCard.test.tsx  #  Tests for StatCard
│   └── StatCard.tsx           #  Reusable stat card component

app/components/
└── HeaderDropdown.tsx         #  User menu with logout functionality
```

**Planned (Phase 2 & 3)**:
```
app/
├── dashboard/
│   ├── DashboardContext.tsx    # Shared context for user data
│   ├── student/
│   │   ├── supervisors/
│   │   │   └── page.tsx       # Browse supervisors
│   │   └── applications/
│   │       └── page.tsx       # My applications
│   ├── supervisor/
│   │   ├── page.tsx           # Supervisor dashboard overview
│   │   └── applications/
│   │       └── page.tsx       # Review student applications
│   └── admin/
│       ├── users/
│       │   └── page.tsx       # Manage users
│       └── reports/
│           └── page.tsx       # View system reports
```

## Role-Specific Feature Scope

### Student Dashboard (Implemented - Phase 1)

The student dashboard implementation includes:

1. **Dashboard Overview**: Quick stats and recent activity
2. **Browse Supervisors**: Search, filter, and view available supervisors
3. **My Applications**: Track submitted applications and their status
4. **Application Submission**: Submit new project applications

### Admin Dashboard (Implemented - Phase 1)

The admin dashboard implementation includes:

1. **Dashboard Overview**: System-wide statistics (students, supervisors, projects, applications)
2. **Database Seeder Access**: Quick navigation to seed test data
3. **Role-Based Access Control**: Only admin users can access admin routes
4. **Future Actions**: Placeholders for user management and reports (coming soon)

### Supervisor Dashboard (Future Implementation)

Planned supervisor features:

1. **Dashboard Overview**: Personal statistics and capacity management
2. **Review Applications**: View and respond to student applications
3. **Manage Capacity**: Update availability and student load
4. **Student Communication**: Interact with assigned students

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

Located in `app/components/`:

**Implemented (Phase 1)**:
- **HeaderDropdown**: User menu with profile info and logout functionality (redirects to homepage)

**Planned (Phase 2 & 3)**:
- **DashboardSidebar**: Navigation menu for role-specific routes
- **DashboardHeader**: User info and role display
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

#### Student Dashboard
1. Fetch application count for current student
2. Query all available supervisors
3. Filter supervisors by department, expertise, availability

#### Admin Dashboard
1. Count total students (users with role='student')
2. Count total supervisors
3. Count active projects/applications
4. Count pending applications
5. Navigate to admin tools (database seeder, user management, reports)

#### Supervisor Dashboard (Planned)
1. Query applications where supervisorId matches current user
2. Update application status (approve/reject)
3. Manage capacity and availability

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
├── E2E Tests (Playwright)
│   ├── Student Flow (login, browse supervisors, submit applications)
│   ├── Supervisor Flow (login, review applications, approve/reject)
│   ├── Admin Flow (login, view statistics, access admin tools)
│   └── Authentication & Authorization (logout, unauthorized access)

```

### E2E Test Coverage

**Student Flow**:
- Login and navigate to student dashboard
- Browse available supervisors
- Submit application to supervisor
- View submitted application details
- Logout and redirect to homepage

**Supervisor Flow**:
- Login and navigate to supervisor dashboard
- View pending applications
- Review and approve applications with feedback
- Review and reject applications with feedback
- View application details
- Logout and redirect to homepage

**Admin Flow**:
- Login and navigate to admin dashboard
- View system statistics
- Access database seeder
- Logout and redirect to homepage

**Authentication & Authorization**:
- Unauthenticated users redirected from protected routes
- Role-based access (students can't access admin, etc.)
- Logout functionality redirects to homepage
- Post-logout, users cannot access protected routes

### Mocking Strategy

- **Firebase Auth**: Mock onAuthStateChanged, signIn, signOut
- **Firestore**: Mock collection queries, document operations
- **Next.js Router**: Mock useRouter, usePathname for navigation tests

## Authentication Flow

### Student/Admin Dashboard Flow
```
User visits /dashboard
    ↓
Layout checks authentication
    ↓
Not authenticated → Redirect to homepage (/)
    ↓
Authenticated → Check user profile
    ↓
Student role → Redirect to /dashboard/student
Admin role → Redirect to /dashboard/admin
    ↓
Wrong role → Redirect to homepage with message
    ↓
Render dashboard with context
```

### Logout Flow
```
User clicks logout in HeaderDropdown
    ↓
signOut() called from Firebase Auth
    ↓
Close dropdown menu
    ↓
Redirect to homepage (/)
    ↓
User is logged out
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

1. **Client-Side Auth Check**: Redirect unauthorized users to homepage
2. **Firestore Rules**: Server-side validation (to be implemented)
3. **Role Verification**: Students access student routes, admins access admin routes
4. **Input Validation**: Sanitize and validate all form inputs
5. **Protected Routes**: Each dashboard page verifies user authentication and role
6. **Logout Security**: Proper session cleanup and redirect to public pages

## Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Readers**: ARIA labels and semantic HTML
3. **Focus Management**: Proper focus order and trap in modals
4. **Color Contrast**: WCAG AA compliant colors
5. **Error Messages**: Clear, actionable feedback

## Future Enhancements

### Planned Features

1. **Real-time Updates**: Firestore listeners for live application status updates
2. **Notifications**: Email/in-app notifications for status changes
3. **Advanced Filters**: Save filter preferences, more filter options
4. **Analytics**: Track user behavior and feature usage
5. **Mobile Optimization**: Responsive design improvements for mobile devices

### Admin Dashboard Enhancements

1. **User Management**: Create, edit, and delete user accounts
2. **System Reports**: Generate reports on applications, supervisors, and projects
3. **Audit Logs**: Track all system changes and user actions
4. **Bulk Operations**: Batch approve/reject applications, bulk user imports
5. **System Settings**: Configure application rules, deadlines, and notifications

### Error Handling & Resilience

**Implemented**:
- Loading states with proper UI feedback (spinners)
- Error handling in data fetching (graceful degradation with empty arrays)
- Authentication redirects to homepage (consistent UX)
- Logout with proper cleanup and redirect

**Planned**:
- Toast notifications for errors and success messages
- Retry mechanisms for failed API calls
- Offline support with local caching
- Better error messages with actionable guidance
