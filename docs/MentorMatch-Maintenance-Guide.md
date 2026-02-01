# MentorMatch - Maintenance Guide

## 9.1 Introduction

MentorMatch is a student-supervisor matching system built with Next.js and Firebase that facilitates research project partnerships at academic institutions. This guide is intended for developers who will maintain, extend, or debug the system.

**Target Audience:** Developers with JavaScript/TypeScript experience  
**Prerequisites:** Basic understanding of React, Next.js, and Firebase  
**Repository:** [GitHub Link]  
**Deployment:** Vercel (Production), Firebase (Database & Auth)

---

## 9.2 Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | Full-stack React framework | 14.x |
| React | UI library | 18.x |
| TypeScript | Type-safe JavaScript | 5.x |
| TailwindCSS | Utility-first CSS framework | 3.x |
| Firebase Auth | User authentication | 10.x |
| Firestore | NoSQL database | 10.x |
| Firebase Admin | Server-side Firebase SDK | 12.x |
| Zod | Schema validation | 3.x |
| Vercel | Hosting and deployment | Latest |

---

## 9.3 Development Environment Setup

### Prerequisites
- **Node.js:** Version 18 or above
- **npm or yarn:** For dependency management
- **Firebase CLI:** `npm install -g firebase-tools`
- **Git:** For version control

### Installing Dependencies
Clone the repository and install dependencies:
```bash
git clone [repository-url]
cd MentorMatch
npm install
```

### Environment Variables
Create a `.env.local` file in the project root:
```env
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note:** Obtain Firebase credentials from Firebase Console → Project Settings → Service Accounts

### Running the Development Server
```bash
npm run dev           # Start development server on http://localhost:3000
npm run build         # Create production build
npm start             # Start production server
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
```

### Firebase Emulators (Local Testing)
```bash
firebase emulators:start
```

---

## 9.4 Project Architecture

Reference the deployment diagram in Section 2.3 of the main project book for visual architecture overview.

### High-Level Architecture

```mermaid
graph TD
    A[Client Browser] -->|HTTP Requests| B[Next.js App Router<br/>Frontend]
    B -->|User Actions| C[Next.js API Routes<br/>Backend]
    C --> D[Middleware Pipeline]
    D -->|1. Auth| E[Authentication]
    D -->|2. Authorization| F[Role Check]
    D -->|3. Validation| G[Zod Schemas]
    D -->|4. Error Handling| H[Error Handler]
    E & F & G & H --> I[Service Layer<br/>Business Logic]
    I --> J[Firebase Admin SDK]
    J --> K[(Firestore Database)]
    J --> L[Firebase Auth]
    K -->|Data| I
    L -->|User Info| I
    I -->|Response| C
    C -->|JSON| B
    B -->|UI Update| A
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style I fill:#e8f5e9
    style J fill:#fce4ec
    style K fill:#ffebee
    style L fill:#ffebee
```

### Project Structure
```
mentormatch/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── auth/              # Authentication endpoints (register, verify-email)
│   │   ├── students/          # Student CRUD operations
│   │   ├── supervisors/       # Supervisor CRUD operations
│   │   ├── applications/      # Application management
│   │   ├── partnerships/      # Partnership operations
│   │   ├── admin/             # Admin operations (stats, user management)
│   │   ├── projects/          # Project management
│   │   └── users/             # User profile operations
│   ├── authenticated/         # Protected routes (requires authentication)
│   │   ├── layout.tsx        # Auth wrapper with role-based routing
│   │   ├── student/          # Student dashboard and pages
│   │   ├── supervisor/       # Supervisor dashboard and pages
│   │   └── admin/            # Admin dashboard and pages
│   ├── components/           # Reusable UI components
│   │   ├── display/         # Data display components
│   │   ├── feedback/        # Loading, error, empty states
│   │   ├── form/            # Form input components
│   │   ├── layout/          # Layout components
│   │   └── shared/          # Shared utilities
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   └── verify-email/        # Email verification page
├── lib/
│   ├── auth.ts              # Authentication logic (Firebase client)
│   ├── firebase.ts          # Firebase client initialization
│   ├── firebase-admin.ts    # Firebase Admin SDK initialization
│   ├── logger.ts            # Centralized logging utility
│   ├── constants.ts         # Application constants
│   ├── routes.ts            # Route definitions and helpers
│   ├── api/
│   │   └── client.ts       # API client utilities
│   ├── middleware/          # API middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── authorization.ts # Role-based authorization
│   │   ├── errorHandler.ts # Centralized error handling
│   │   ├── response.ts     # ApiResponse helper functions
│   │   └── validation.ts   # Request validation with Zod
│   ├── services/           # Business logic layer
│   │   ├── students/       # Student service
│   │   ├── supervisors/    # Supervisor service
│   │   ├── applications/   # Application workflow service
│   │   ├── partnerships/   # Partnership workflow service
│   │   ├── projects/       # Project service
│   │   ├── users/          # User service
│   │   ├── admin/          # Admin service
│   │   ├── email-service.ts
│   │   └── email-verification-service.ts
│   ├── hooks/             # React custom hooks
│   │   ├── useAuth.ts    # Authentication hook
│   │   ├── useStudentDashboard.ts
│   │   ├── useSupervisorDashboard.ts
│   │   ├── useAdminDashboard.ts
│   │   └── [other hooks]
│   ├── styles/           # Shared styles and utilities
│   └── utils/            # Utility functions
├── types/                # TypeScript type definitions
│   ├── api.ts           # API types
│   └── database.ts      # Database schema types
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

---

## 9.5 Backend Architecture

### API Routes Structure
All API routes are located in `app/api/` and follow Next.js 14 App Router conventions.

### Core API Endpoints

| Endpoint | Method | Purpose | Auth Required | Role |
|----------|--------|---------|---------------|------|
| `/api/auth/register` | POST | Register new user | No | - |
| `/api/auth/verify-email` | POST | Verify email address | No | - |
| `/api/users` | GET | List all users | Yes | Admin |
| `/api/users/[id]` | GET | Get user details | Yes | Self/Admin |
| `/api/students` | GET | List all students | Yes | Admin |
| `/api/students/[id]` | GET | Get student details | Yes | All authenticated |
| `/api/students/[id]` | PUT | Update student profile | Yes | Student/Admin |
| `/api/students/[id]` | DELETE | Delete student | Yes | Student/Admin |
| `/api/students/available-partners` | GET | Get available partners | Yes | Student |
| `/api/supervisors` | GET | List all supervisors | Yes | Admin |
| `/api/supervisors/[id]` | GET | Get supervisor details | Yes | All authenticated |
| `/api/supervisors/[id]` | PUT | Update supervisor | Yes | Supervisor/Admin |
| `/api/supervisors/[id]` | DELETE | Delete supervisor | Yes | Supervisor/Admin |
| `/api/projects` | GET | List projects | Yes | All authenticated |
| `/api/projects` | POST | Create project | Yes | Supervisor |
| `/api/projects/[id]` | GET | Get project details | Yes | All authenticated |
| `/api/projects/[id]` | PUT | Update project | Yes | Supervisor/Admin |
| `/api/projects/[id]` | DELETE | Delete project | Yes | Supervisor/Admin |
| `/api/applications` | GET | List applications | Yes | Student/Supervisor/Admin |
| `/api/applications` | POST | Submit application | Yes | Student |
| `/api/applications/[id]` | GET | Get application | Yes | Involved parties |
| `/api/applications/[id]/approve` | POST | Approve application | Yes | Supervisor |
| `/api/applications/[id]/reject` | POST | Reject application | Yes | Supervisor |
| `/api/applications/[id]/withdraw` | POST | Withdraw application | Yes | Student |
| `/api/partnerships/request` | POST | Request partnership | Yes | Student |
| `/api/partnerships/unpair` | POST | End partnership | Yes | Student/Supervisor/Admin |
| `/api/admin/stats` | GET | Get system statistics | Yes | Admin |

### Example Request/Response

**POST /api/applications**
```json
// Request
{
  "supervisorId": "supervisor123",
  "projectId": "project456",
  "message": "I'm interested in this research topic"
}

// Response (Success)
{
  "success": true,
  "data": {
    "applicationId": "app789",
    "status": "pending",
    "createdAt": "2026-02-01T10:00:00Z"
  }
}

// Response (Error)
{
  "success": false,
  "error": "You already have an active application to this supervisor"
}
```

### Middleware Pipeline

All API routes pass through this middleware pipeline (in order):

1. **Authentication** (`lib/middleware/auth.ts`) - Verifies Firebase token, extracts user ID
2. **Authorization** (`lib/middleware/authorization.ts`) - Checks role permissions (RBAC), returns 403 if unauthorized
3. **Validation** (`lib/middleware/validation.ts`) - Validates request with Zod schemas, returns 400 if invalid
4. **Error Handling** (`lib/middleware/errorHandler.ts`) - Catches errors, formats with `ApiResponse`, logs via centralized logger

### Service Layer

Business logic separated into service modules in `lib/services/`:
- **Purpose:** Keep API routes thin, business logic in services
- **Pattern:** Each entity (students, supervisors, applications) has own service module
- **Benefits:** Unit testable independently, reusable across multiple API routes

---

## 9.6 Frontend Architecture

### Next.js App Router

MentorMatch uses Next.js 14 App Router with the following structure:
- **Server Components:** Default for most pages (better performance)
- **Client Components:** Used for interactive UI (marked with `'use client'`)
- **Layouts:** Shared layouts for authenticated routes

### Authenticated Routes

Protected routes are wrapped in `app/authenticated/layout.tsx`:
```typescript
// Checks authentication status
// Redirects to login if not authenticated
// Implements role-based routing (student → /student, supervisor → /supervisor, etc.)
```

### Component Organization

Components follow a hierarchical structure:
- **Pages:** Top-level routes in `app/` | **Layout:** Shared layouts in `app/components/layout/`
- **Display:** Data display in `app/components/display/` | **Form:** Input components in `app/components/form/`
- **Feedback:** Loading/error states in `app/components/feedback/` | **Shared:** Reusable utilities in `app/components/shared/`

### State Management

- **Server State:** Fetched via API, cached by Next.js | **Client State:** React hooks (`useState`, `useReducer`)
- **Custom Hooks:** In `lib/hooks/` for reusable logic | **Auth State:** Firebase Auth + `useAuth` hook

### Error Handling Pattern

**Never use `console.*` methods** - Always use the centralized logger:
```typescript
import { logger } from '@/lib/logger';

// ✅ Correct
logger.error.component('ComponentName', 'Operation failed', error, { context });

// ❌ Wrong
console.error('Error:', error);
```

**Always use ApiResponse helpers** for API responses:
```typescript
import { ApiResponse } from '@/lib/middleware/response';

// ✅ Correct
return ApiResponse.success({ data });
return ApiResponse.error('Error message');

// ❌ Wrong
return { success: true, data };
```

---

## 9.7 Database Architecture

### Firestore Collections

| Collection | Purpose | Key Fields | Access Rules |
|------------|---------|------------|--------------|
| `users` | User profiles and roles | `uid`, `email`, `role`, `displayName`, `emailVerified`, `createdAt` | Read: Self, Write: Self/Admin |
| `students` | Student-specific data | `studentId`, `uid`, `skills`, `interests`, `capacity`, `currentPartnerships` | Read: All authenticated, Write: Self/Admin |
| `supervisors` | Supervisor-specific data | `supervisorId`, `uid`, `expertise`, `researchAreas`, `maxStudents`, `availableSlots` | Read: All authenticated, Write: Self/Admin |
| `projects` | Research projects | `projectId`, `supervisorId`, `title`, `description`, `requirements`, `isActive` | Read: All authenticated, Write: Supervisor/Admin |
| `applications` | Student applications | `applicationId`, `studentId`, `supervisorId`, `projectId`, `status`, `message`, `createdAt` | Read: Involved parties, Write: System |
| `partnerships` | Active partnerships | `partnershipId`, `studentId`, `supervisorId`, `projectId`, `status`, `startDate`, `endDate` | Read: Involved parties, Write: System |

### Data Relationships

```mermaid
erDiagram
    users ||--o| students : "has profile"
    users ||--o| supervisors : "has profile"
    students ||--o{ applications : "submits"
    supervisors ||--o{ applications : "receives"
    supervisors ||--o{ projects : "creates"
    projects ||--o{ applications : "for"
    students ||--o| partnerships : "participates"
    supervisors ||--o{ partnerships : "supervises"
    applications ||--o| partnerships : "leads to"
    
    users {
        string uid PK
        string email
        string role
        string displayName
        boolean emailVerified
    }
    students {
        string studentId PK
        string uid FK
        array skills
        array interests
        int currentPartnerships
    }
    supervisors {
        string supervisorId PK
        string uid FK
        array expertise
        array researchAreas
        int maxStudents
        int availableSlots
    }
    projects {
        string projectId PK
        string supervisorId FK
        string title
        string description
        boolean isActive
    }
    applications {
        string applicationId PK
        string studentId FK
        string supervisorId FK
        string projectId FK
        string status
    }
    partnerships {
        string partnershipId PK
        string studentId FK
        string supervisorId FK
        string projectId FK
        string status
    }
```

**Relationship Details:**
- `users.uid` → `students.uid` (1:1) - Each user has at most one student profile
- `users.uid` → `supervisors.uid` (1:1) - Each user has at most one supervisor profile
- `supervisors.supervisorId` → `projects.supervisorId` (1:N) - Supervisor can have multiple projects
- `students.studentId` → `applications.studentId` (1:N) - Student can submit multiple applications
- `supervisors.supervisorId` → `applications.supervisorId` (1:N) - Supervisor receives multiple applications
- `students.studentId` → `partnerships.studentId` (1:1) - Student can have only ONE active partnership
- `supervisors.supervisorId` → `partnerships.supervisorId` (1:N) - Supervisor can supervise multiple students

### Security Rules

Firestore security rules are defined in `firestore.rules`:
- **Authentication Required:** All operations require authentication
- **Role-Based Access:** Rules enforce role-based permissions
- **Field-Level Security:** Certain fields (e.g., `role`) can only be modified by admins
- **Ownership Checks:** Users can only modify their own data (except admins)

### Indexes

Composite indexes are required for certain queries (defined in `firestore.indexes.json`):
- `applications`: Compound index on `(studentId, status)` and `(supervisorId, status)`
- `partnerships`: Index on `(studentId, status)` and `(supervisorId, status)`

---

## 9.8 Development Workflows

### Git Workflow

Follow these conventions from `.cursorrules`:
- **Branches:** Create feature branches from `main`
- **Commits:** Descriptive commit messages
- **Pull Requests:** Required for all changes to `main`
- **Code Review:** At least one approval required

### Code Conventions

**Critical rules from `.cursorrules`:**

1. **Error Handling:**
   - NEVER use `console.*` - ALWAYS use `logger` from `lib/logger.ts`
   - ALWAYS use `ApiResponse` helpers for API responses
   - ALWAYS use `handleApiError()` for catching errors in API routes
   - ALWAYS log errors with context: `logger.service.error(SERVICE_NAME, 'operation', error, { context })`

2. **Validation:**
   - ALWAYS validate requests early using Zod schemas
   - Return `ApiResponse.validationError()` for validation failures

3. **CSS:**
   - Use Tailwind's `font-sans` class (system font stack)
   - Import shared styles from `@/lib/styles/shared-styles`
   - Use logical AND (`&&`) for conditional classes

4. **Pull Requests:**
   - One logical change per PR
   - Keep PRs < 200 lines when possible
   - All tests pass, no linter errors before review

### Adding New Features

**Example: Adding a new API endpoint**

1. **Define Zod schema** (`lib/middleware/validation.ts`):
```typescript
export const MyFeatureSchema = z.object({
  field: z.string(),
});
```

2. **Create service function** (`lib/services/my-feature/`):
```typescript
export const myFeatureService = {
  async create(data) {
    // Business logic here
  }
};
```

3. **Create API route** (`app/api/my-feature/route.ts`):
```typescript
import { apiHandler } from '@/lib/middleware/apiHandler';
import { myFeatureService } from '@/lib/services/my-feature';

export const POST = apiHandler(
  async (req, { user }) => {
    const data = await req.json();
    const result = await myFeatureService.create(data);
    return ApiResponse.success(result);
  },
  { requireAuth: true, requiredRole: 'student' }
);
```

4. **Create frontend hook** (`lib/hooks/useMyFeature.ts`):
```typescript
export function useMyFeature() {
  // Hook logic
}
```

5. **Create UI component** (`app/components/MyFeature.tsx`):
```typescript
'use client';
export function MyFeature() {
  const { data } = useMyFeature();
  // Component logic
}
```

---

## 9.9 Testing

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run in watch mode
npm run coverage      # Generate coverage report
```

### Testing Strategy
- **Unit Tests:** Service layer functions (e.g., `lib/services/applications/`)
- **Integration Tests:** API routes (e.g., `/api/applications`)
- **E2E Tests:** Critical user flows (registration, application submission, partnership formation)
- **Manual Testing:** UI/UX testing, browser compatibility

### Writing New Tests

**Unit Test Example (Service Layer):**
```typescript
// lib/services/applications/__tests__/applications.test.ts
import { applicationService } from '../applications';

describe('Application Service', () => {
  it('should create new application', async () => {
    const data = {
      studentId: 'student123',
      supervisorId: 'supervisor456',
      projectId: 'project789',
    };
    const result = await applicationService.create(data);
    expect(result.status).toBe('pending');
  });

  it('should reject duplicate applications', async () => {
    // Test duplicate prevention logic
  });
});
```

**Integration Test Example (API Route):**
```typescript
// app/api/applications/__tests__/route.test.ts
import { POST } from '../route';

describe('POST /api/applications', () => {
  it('should create application with valid data', async () => {
    const request = new Request('http://localhost/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        supervisorId: 'supervisor123',
        projectId: 'project456',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should return 401 without authentication', async () => {
    // Test authentication requirement
  });
});
```

### Test Coverage Goals
- Service layer: 80% code coverage minimum
- API routes: 70% coverage (focus on business logic paths)
- Critical flows: 100% coverage (registration, applications, partnerships)

---

## 9.10 Deployment

### Build Process
```bash
npm run build
```

### Vercel Deployment

**Automatic Deployment:**
- Push to `main` branch triggers production deployment
- Pull requests trigger preview deployments

**Environment Variables:**
Set in Vercel Dashboard → Project Settings → Environment Variables:
- Add all variables from `.env.local`
- Set for Production, Preview, and Development environments

**Deployment URL:** [Your Vercel URL]

### Monitoring

- **Logs:** View in Vercel Dashboard → Deployments → [Deployment] → Logs
- **Errors:** Logged via `lib/logger.ts`
- **Firebase Console:** Monitor Firestore usage, authentication

---

## 9.11 Debugging and Troubleshooting

### HTTP Status Codes Reference

| Error Code | Meaning | Common Cause | Solution |
|------------|---------|--------------|----------|
| 400 | Bad Request | Missing/incorrect request parameters | Validate request payload against Zod schema, check required fields |
| 401 | Unauthorized | Not authenticated or invalid token | Verify user is logged in, check Firebase Auth token validity |
| 403 | Forbidden | Insufficient permissions | Verify user role matches endpoint requirements |
| 404 | Not Found | Resource doesn't exist | Check endpoint URL, verify document ID exists in Firestore |
| 500 | Internal Server Error | Server-side failure | Check Vercel logs, verify database connection, review error context |

### Common Issues and Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| "Firebase not initialized" error | Missing environment variables | Verify `.env.local` exists and contains all required Firebase config |
| "Unauthorized" on API calls | Missing or invalid auth token | Ensure user is logged in, check Firebase Auth state in browser console |
| "Role not found" error | User doesn't have role assigned | Check `users` collection in Firestore has `role` field set correctly |
| Build fails with type errors | TypeScript compilation errors | Run `npm run type-check` to see detailed type errors |
| Firestore permission denied | Security rules rejecting request | Verify user authentication and check Firestore security rules in Firebase Console |
| Email verification not working | Email service not configured | See `docs/EMAIL_VERIFICATION_SETUP.md` for configuration steps |
| "Max capacity reached" | Supervisor at student limit | Check supervisor's `maxStudents` field and count of active partnerships |
| Applications not showing | Filter or status issue | Check application `status` field and query filters |
| "Partner email must be valid" | Email doesn't match domain | Ensure email ends with `@e.braude.ac.il` |

### Debug Procedures

1. **Check Application Logs:**
   - All errors are logged via `lib/logger.ts`
   - Logs include service name, operation, error, and context
   - Check browser console and Vercel deployment logs

2. **Inspect Network Tab:**
   - Open browser DevTools → Network
   - Check API request/response payloads
   - Verify status codes and error messages

3. **Verify Authentication State:**
   - Check Firebase Auth state in browser console
   - Verify JWT token is being sent in requests
   - Check token expiration

4. **Check Firestore Data:**
   - Open Firebase Console → Firestore Database
   - Verify document structure and field values
   - Check security rules are not blocking operations

5. **Use Firebase Emulators:**
   - Run `firebase emulators:start` for local testing
   - Test without affecting production data
   - Debug security rules locally

6. **Trace Middleware Flow:**
   - Add temporary console.logs in middleware for debugging
   - Check where request is failing in pipeline
   - Verify role checks and validation

### Frontend Debugging with Browser DevTools

**Steps to Debug Failed API Request:**
1. Open DevTools (F12) → Network Tab
2. Identify failed request (red status code)
3. Click on request → Check:
   - **Headers:** Verify authentication token is included
   - **Payload:** Confirm request body matches API expectations
   - **Response:** Read error message and status code
4. Cross-reference error with troubleshooting table above

**Using Console Tab:**
- View JavaScript errors and warnings
- Check logger output (all errors logged via `lib/logger.ts`)
- Inspect component state and props

**Using Elements Tab:**
- Inspect HTML structure and CSS styles
- Test layout changes in real-time
- Debug responsive design issues

---

## 9.12 MentorMatch-Specific Features

### Security Policies

**Email Restrictions:** Only `@e.braude.ac.il` emails allowed (Pattern: `^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$`)

**Password Requirements:** Min 8 chars, 1 uppercase, 1 lowercase, 1 number (Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)`)

**Access Control:** Email verification required, role-based permissions (RBAC), Firebase Auth token sessions

**Maintenance:** Quarterly user reviews, remove graduated students annually, audit admin access

### Role-Based Access Control

MentorMatch implements three user roles with distinct permissions:

| Role | Permissions | Dashboard Access | Key Features |
|------|-------------|------------------|--------------|
| **Student** | View supervisors and projects, submit applications, manage partnerships | `/authenticated/student` | Browse supervisors, apply to projects, view application status, manage active partnership |
| **Supervisor** | View students, manage applications, create/manage projects | `/authenticated/supervisor` | Review applications, create projects, manage matched students, view statistics |
| **Admin** | Full system access, user management, fix data issues | `/authenticated/admin` | View all users, manage roles, view statistics, fix partnership/application issues |

**Implementation:**
- Roles stored in `users` collection (`role` field: `"student"` | `"supervisor"` | `"admin"`)
- Route protection in `app/authenticated/layout.tsx` redirects based on role
- API authorization via `lib/middleware/authorization.ts` checks role permissions
- Firestore security rules enforce role-based data access

### Application Workflow

Applications follow this state machine:

```mermaid
stateDiagram-v2
    [*] --> pending: Student submits
    pending --> approved: Supervisor approves
    pending --> withdrawn: Student withdraws
    approved --> matched: Partnership formed
    approved --> rejected: Supervisor rejects
    withdrawn --> [*]: Terminal
    rejected --> [*]: Terminal
    matched --> [*]: Terminal
```

**States:** `pending` (awaiting review), `approved` (awaiting partnership), `rejected` (terminal), `withdrawn` (terminal), `matched` (terminal)

**Business Rules:** Students can have multiple pending applications; only pending can be withdrawn; approved requires student acceptance; rejected/withdrawn cannot reopen

### Partnership Workflow

**Formation:** Student applies → Supervisor approves → Student confirms → System validates capacity → Partnership created (`active`) → Application becomes `matched`

**Status:** `active` (ongoing), `completed` (finished), `terminated` (ended early)

**Constraints:** Students max 1 active partnership, Supervisors max N (configurable via `maxStudents`), capacity enforced before creation

### Email Verification System

**Implementation:** Firebase Auth email verification required for all registrations, users redirected to `/verify-email` after signup

**Flow:** Register → Firebase sends email → User clicks link → Email marked verified → Access granted

**Documentation:** See `docs/EMAIL_VERIFICATION_SETUP.md` and `docs/EMAIL_VERIFICATION_TESTING.md`

### Admin Dashboard Features

Located at `/authenticated/admin`:

**User Management:** View/edit/delete all users, manage roles (cascade delete handling)

**Statistics:** Real-time counts of students, supervisors, applications, partnerships with status breakdowns

**Monitoring:** View all applications/partnerships system-wide, filter by status/user, resolve stuck states

**Data Integrity:** Fix mismatched statuses, resolve capacity issues, adjust partnership counts

### Future Maintenance

**Monitoring:** Centralized logging via `lib/logger.ts` (view in Vercel Dashboard/Firebase Console), track API response times, monitor DAU and trends

**Optimization:** Review N+1 queries, add composite indexes, implement pagination, archive old records (2+ years), use batch operations, client-side caching

**Security:** Monthly `npm audit`, quarterly Firebase Auth rules review, annual admin audits, rotate service keys annually

**Scalability:** Current limits (500 users, 10k records/collection, 1M reads/day), triggers (>2s response, 80% quota), future enhancements (Redis cache, CDN, sharding, Algolia search, FCM notifications)

---

## Additional Resources

- **Repository:** https://github.com/Roee-Bar/MentorMatch
- **Firebase Console:** https://console.firebase.google.com/u/0/project/mentormatch-ba0d1/overview
- **Production Deployment:** https://vercel.com/rbeg/mentor-match

---

**Last Updated:** February 2026  
**Maintainers:** Roee Bar & Eldar Gafarov
