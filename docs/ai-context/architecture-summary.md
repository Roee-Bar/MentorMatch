# Architecture Summary (AI-Optimized)

Quick reference for AI-assisted development. Concise architecture decisions, technology stack, and key patterns.

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend Framework | Next.js (App Router) | 14.2.33 | SSR, routing, React framework |
| UI Library | React | 18 | Component-based UI |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.4.1 | Utility-first CSS with hybrid strategy |
| Database | Cloud Firestore | 12.6.0 | NoSQL database |
| Authentication | Firebase Auth | 12.6.0 | User authentication |
| Storage | Firebase Storage | 12.6.0 | File storage |
| Backend | Firebase Admin SDK | 12.5.0 | Server-side operations |
| API | Next.js API Routes | 14 | REST API endpoints |
| Testing | Jest + RTL + Playwright | Latest | Unit, component, E2E tests |
| Deployment | Vercel | N/A | Hosting platform |
| CI/CD | GitHub Actions | N/A | Automated testing |

## Architecture Patterns

### 1. Service Layer Pattern

All Firebase operations abstracted through service layer (`lib/services/firebase-services.ts`).

**Pattern:**
```
Component → Service Function → Firebase SDK → Firestore
```

**Benefits:** Testability, maintainability, separation of concerns

### 2. Multi-Route Dashboard

Separate routes per role: `/dashboard/student`, `/dashboard/supervisor`, `/dashboard/admin`

**Benefits:** Code splitting, cleaner URLs, independent testing, scalability

### 3. Traditional REST API

Next.js API routes + Firebase Admin SDK for secure server-side operations.

**Flow:**
```
Client → API Route → Auth Middleware → Validation → Service Layer → Firestore
```

**Benefits:** Server-side auth verification, secure operations, 111+ tests

### 4. Hybrid Tailwind CSS

Combines utility classes with custom component classes.

**Benefits:** Reduced duplication, easier maintenance, consistent design

### 5. Context-Based State

DashboardContext for auth state across dashboard routes. No Redux/Zustand.

**Reason:** Simple state needs, Context API sufficient

## File Structure

```
app/
├── api/                    # REST API endpoints (20+)
│   ├── supervisors/       # Supervisor CRUD + filters
│   ├── applications/      # Application management
│   ├── students/          # Student operations
│   ├── projects/          # Project management
│   ├── users/             # User operations
│   └── admin/             # Admin endpoints
├── dashboard/             # Role-based dashboards
│   ├── layout.tsx         # Auth wrapper
│   ├── page.tsx           # Dashboard router
│   ├── student/           # Student dashboard
│   └── supervisor/        # Supervisor dashboard
└── components/            # Reusable components

lib/
├── api/                   # API client library
│   ├── client.ts          # Type-safe API methods
│   └── endpoints.ts       # Endpoint constants
├── middleware/            # API middleware
│   ├── auth.ts            # Auth/authz
│   ├── validation.ts      # Zod schemas
│   └── errorHandler.ts    # Error handling
├── services/              # Firebase service layer
│   └── firebase-services.ts # All Firebase operations
├── hooks/                 # Custom React hooks
│   └── useSupervisorAuth.ts # Role-specific auth
├── firebase.ts            # Client Firebase init
└── firebase-admin.ts      # Server Firebase Admin init

types/
├── database.ts            # Firestore data types
├── user.ts                # User types
├── dashboard.ts           # Dashboard types
└── index.ts               # Type exports
```

## Data Model

### Firestore Collections

| Collection | Document ID | Key Fields | Purpose |
|------------|-------------|------------|---------|
| `users` | userId | email, name, role, department | Base user profiles |
| `students` | userId | academicInfo, skills, matchStatus | Student details |
| `supervisors` | userId | expertise, capacity, availability | Supervisor profiles |
| `applications` | auto-generated | studentId, supervisorId, status | Applications |
| `projects` | auto-generated | studentId, supervisorId, phase | Active projects |
| `admins` | userId | permissions | Admin profiles |

### Key Relationships

- User (1) → Student/Supervisor (1) - One-to-one via userId
- Student (1) → Applications (N) - One-to-many via studentId
- Supervisor (1) → Applications (N) - One-to-many via supervisorId
- Application (1) → Project (0..1) - Accepted applications become projects

## Authentication Flow

1. User submits credentials → Firebase Auth
2. Auth returns ID token
3. Token stored by Firebase SDK (client-side)
4. Token sent with API requests in Authorization header
5. Server verifies token with Firebase Admin SDK
6. Access granted/denied based on role

## Authorization Strategy

### Route Protection
- **Layout level**: Dashboard layout checks authentication
- **Page level**: Individual pages check role
- **Component level**: Conditional rendering

### API Protection
- **Middleware**: `verifyAuth()` checks token + role
- **Per endpoint**: Role-specific access control
- **Future**: Firestore security rules

## API Design Patterns

### Request Format
```typescript
GET /api/supervisors?available=true&department=CS
Authorization: Bearer <firebase-id-token>
```

### Response Format
```typescript
{
  "success": true,
  "data": [...],
  "count": 10,
  "error": null  // Only on errors
}
```

### Error Format
```typescript
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Key Design Decisions

| Decision | Rationale | Alternative Considered |
|----------|-----------|------------------------|
| Firebase over custom backend | Rapid development, auto-scaling, cost-effective | Node.js/Express backend |
| Service layer abstraction | Testability, maintainability | Direct Firebase calls |
| Multi-route dashboards | Code splitting, scalability | Single conditional dashboard |
| TypeScript throughout | Type safety, better DX | JavaScript with JSDoc |
| Context for state | Simple needs, no overhead | Redux/Zustand |
| Hybrid Tailwind | Reduced duplication | Pure utility classes |
| Traditional REST API | Familiar patterns, testable | GraphQL, tRPC |

## Testing Strategy

| Test Type | Tool | Location | Count |
|-----------|------|----------|-------|
| Unit | Jest | `__tests__/` co-located | 111+ |
| Component | React Testing Library | `__tests__/` co-located | 41+ |
| Integration | Jest | `app/api/__tests__/` | Included |
| E2E | Playwright | `e2e/` | 3 flows |

**Mocking Strategy:** Mock services, not Firebase SDK directly

## Environment Variables

### Client (Public)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Server (Secret)
```bash
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

## Common Patterns

### Service Function Pattern
```typescript
async getUser(userId: string): Promise<BaseUser | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null; // Safe default
  }
}
```

### API Route Pattern
```typescript
export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await Service.getData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}
```

### React Hook Pattern
```typescript
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  
  return { user, loading };
}
```

## Performance Considerations

- **Code Splitting**: Automatic per route (Next.js App Router)
- **Loading States**: Skeleton loaders during fetch
- **Firestore Indexing**: Composite indexes for complex queries
- **Pagination**: Implemented for all list operations
- **Caching**: Not aggressive (academic project, data changes frequently)

## Security Measures

- Client-side route guards
- Server-side token verification (Firebase Admin)
- Environment variable protection
- Input validation (Zod schemas)
- Role-based access control
- Firestore security rules (planned)

## Scalability

**Current Scale:**
- ~500 students, ~50 supervisors per semester
- Low traffic (academic environment)
- Well within Firebase free tier limits

**Limits (Free Tier):**
- 50,000 reads/day
- 20,000 writes/day
- 1GB storage

## Development Workflow

```
Feature Branch → Write Tests (TDD) → Implement → Local Tests Pass
    ↓
Commit (Pre-commit hooks: tests + lint)
    ↓
Push to GitHub → GitHub Actions (Tests + Build + E2E)
    ↓
Pull Request → Code Review → Merge to Main
    ↓
Vercel Automatic Deployment
```

## Quick Reference

**Add new API endpoint:** `app/api/<resource>/route.ts` + middleware + tests
**Add new component:** `app/components/<Component>.tsx` + Tailwind classes + tests
**Add new type:** `types/<category>.ts` + export from `types/index.ts`
**Add new service:** Add to `lib/services/firebase-services.ts` + mock in tests
**Add new page:** `app/<route>/page.tsx` + layout if needed
**Add new test:** Co-locate in `__tests__/` folder

---

**For full details, see:**
- Architecture: `/docs/architecture/overview.md`
- API Reference: `/docs/architecture/backend/api-reference.md`
- Component Library: `/docs/architecture/frontend/component-library.md`
- Code Conventions: `/docs/guides/code-conventions.md`

