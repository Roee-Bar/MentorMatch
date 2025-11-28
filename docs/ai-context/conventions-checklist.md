# Code Conventions Checklist (AI-Optimized)

Quick reference checklist for code conventions. Use this for code reviews and AI-assisted development.

## File Naming

| File Type | Convention | Example |
|-----------|------------|---------|
| Components | PascalCase.tsx | `UserProfile.tsx`, `StatCard.tsx` |
| Pages | page.tsx | `app/dashboard/page.tsx` |
| Layouts | layout.tsx | `app/dashboard/layout.tsx` |
| Services | kebab-case.ts | `firebase-services.ts`, `auth.ts` |
| Types | kebab-case.ts | `database.ts`, `user.ts` |
| Tests | Name.test.tsx | `UserProfile.test.tsx` |
| Utilities | kebab-case.ts | `date-utils.ts`, `validators.ts` |

## Import Order

```typescript
// 1. React/Next.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { collection, getDocs } from 'firebase/firestore';

// 3. Internal modules (@/ aliased)
import { UserService } from '@/lib/services/firebase-services';
import type { BaseUser } from '@/types/database';

// 4. Relative imports
import { helper } from './utils';

// 5. CSS
import './styles.css';
```

**Rules:**
- Blank line between groups
- Sort alphabetically within groups
- Use named imports when possible

## Component Structure

```typescript
// 1. Imports
import React, { useState } from 'react';

// 2. Type Definitions
interface Props {
  userId: string;
}

// 3. Component Function
export default function Component({ userId }: Props) {
  // 4. Hooks (state, router, etc.)
  const [data, setData] = useState(null);
  
  // 5. Effects
  useEffect(() => { }, []);
  
  // 6. Handler Functions
  const handleClick = () => { };
  
  // 7. Early Returns
  if (loading) return <div>Loading...</div>;
  
  // 8. Main Render
  return <div>{content}</div>;
}
```

## Naming Conventions

### TypeScript
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile`, `StatCard` |
| Functions | camelCase | `getUserById`, `fetchData` |
| Variables | camelCase | `userName`, `isLoading` |
| Constants | UPPER_CASE | `API_URL`, `MAX_RETRIES` |
| Interfaces | PascalCase | `BaseUser`, `Props` |
| Types | PascalCase | `UserRole`, `Status` |
| Enums | PascalCase | `ApplicationStatus` |

### Booleans
Start with is/has/should/can:
- `isLoading`, `isActive`, `isValid`
- `hasPartner`, `hasPermission`
- `shouldRender`, `shouldValidate`
- `canEdit`, `canDelete`

### Functions
Use verbs:
- `getUser`, `fetchData`, `createApplication`
- `updateProfile`, `deleteProject`
- `handleClick`, `handleSubmit`
- `validateInput`, `formatDate`

## TypeScript Guidelines

### DO

```typescript
// Always type function parameters and returns
function getUser(id: string): Promise<BaseUser | null> { }

// Use interfaces for objects
interface User { name: string; }

// Use type for unions
type Status = 'active' | 'inactive';

// Type React hooks
const [user, setUser] = useState<BaseUser | null>(null);

// Use optional chaining
const name = user?.name ?? 'Unknown';
```

### DON'T

```typescript
// No 'any' type
function process(data: any) { }  // Bad

// No untyped parameters
function getUser(id) { }  // Bad

// No implicit any
const data = getData();  // Bad if getData() returns any
```

## React Patterns

### DO

```typescript
// Use functional components
export default function Component() { }

// Destructure props
function Component({ name, onUpdate }: Props) { }

// Use meaningful state names
const [isLoading, setIsLoading] = useState(false);

// Cleanup in useEffect
useEffect(() => {
  const unsubscribe = subscribe();
  return () => unsubscribe();
}, []);

// Type event handlers
const handleClick = (event: React.MouseEvent) => { };
```

### DON'T

```typescript
// No class components (unless required)
class Component extends React.Component { }  // Bad

// No inline styles (use Tailwind)
<div style={{ color: 'red' }}>  // Bad

// No unused dependencies in useEffect
useEffect(() => { }, []);  // Bad if using external values
```

## Service Layer Patterns

### DO

```typescript
// Always wrap in try-catch
async getUser(id: string): Promise<BaseUser | null> {
  try {
    const doc = await getDoc(ref);
    if (doc.exists()) {
      return { id: doc.id, ...doc.data() } as BaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null;  // Safe default
  }
}

// Always include document ID
return querySnapshot.docs.map(doc => ({
  id: doc.id,  // Always include
  ...doc.data(),
}));

// Use descriptive error messages
console.error('Error fetching user:', error);
```

### DON'T

```typescript
// No throwing errors from services
async getUser(id: string) {
  throw new Error('Failed');  // Bad
}

// No missing document IDs
return docs.map(doc => ({ ...doc.data() }));  // Bad

// No generic error messages
console.error(error);  // Bad
```

## API Route Patterns

### DO

```typescript
// Verify authentication
const user = await verifyAuth(request);
if (!user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

// Validate input
const validation = await validateRequest(schema, request);
if (!validation.success) {
  return NextResponse.json(
    { success: false, error: validation.error },
    { status: 400 }
  );
}

// Use consistent response format
return NextResponse.json({
  success: true,
  data: result,
});

// Handle errors
try {
  // Logic
} catch (error) {
  return handleError(error);
}
```

### DON'T

```typescript
// No unprotected routes (when auth required)
export async function GET(request: Request) {
  const data = await getData();  // Bad - no auth check
  return NextResponse.json(data);
}

// No inconsistent responses
return NextResponse.json(data);  // Bad - missing success flag
```

## Testing Patterns

### DO

```typescript
// Mock services, not Firebase
jest.mock('@/lib/services', () => ({
  UserService: {
    getUserById: jest.fn(),
  },
}));

// Clear mocks in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});

// Descriptive test names
it('should display user name when data is loaded', () => { });

// Test user behavior, not implementation
expect(screen.getByText('John Doe')).toBeInTheDocument();
```

### DON'T

```typescript
// No testing static content
it('should have title', () => {
  expect(screen.getByText('Welcome')).toBeInTheDocument();  // Bad
});

// No testing implementation details
expect(component.state.isLoading).toBe(false);  // Bad
```

## Tailwind CSS

### DO

```typescript
// Use utility classes
<div className="flex items-center gap-4 p-4 bg-white rounded-lg">

// Extract repeated patterns
.card-base { @apply p-6 bg-white rounded-lg shadow-md; }

// Use responsive modifiers
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Group related utilities
<div className="
  flex items-center justify-between
  p-4 m-2
  bg-white text-gray-900
  rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">
```

### DON'T

```typescript
// No inline styles
<div style={{ padding: '16px' }}>  // Bad

// No arbitrary values for common patterns
<div className="p-[16px]">  // Bad - use p-4

// No extremely long className strings (extract to component class)
<div className="flex items-center justify-between p-4 m-2 bg-white text-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 focus:ring-2 focus:ring-blue-500">  // Bad - too long
```

## Error Handling

### DO

```typescript
// Specific catch blocks
try {
  await operation();
} catch (error) {
  if (error.code === 'permission-denied') {
    // Handle permission error
  } else {
    // Handle other errors
  }
}

// User-friendly error messages
catch (error) {
  setError('Unable to load data. Please try again.');
}

// Log for debugging
catch (error) {
  console.error('Detailed error:', error);
  setError('User-friendly message');
}
```

### DON'T

```typescript
// No silent failures
catch (error) { }  // Bad

// No exposing technical details to users
setError(error.message);  // Bad - might expose internals

// No generic errors
setError('Error occurred');  // Bad - not helpful
```

## Comments

### DO

```typescript
// Explain WHY, not WHAT
// Using batch write to ensure atomicity across user and student collections
const batch = writeBatch(db);

// Document complex logic
// Calculate response time: if < 24h show hours, if < 7d show days, else show date
const responseTime = calculateResponseTime(date);

// Mark TODOs with context
// TODO: Implement pagination when collection > 100 items

// JSDoc for exported functions
/**
 * Fetches user by ID from Firestore
 * @param userId - The user's unique identifier
 * @returns User object or null if not found
 */
```

### DON'T

```typescript
// No obvious comments
const name = user.name;  // Get user name - Bad

// No commented-out code
// const oldCode = () => { };  // Bad - remove it

// No TODO without context
// TODO: Fix this  // Bad - too vague
```

## Git Commit Messages

### Format

```
<type>: <subject>

<body (optional)>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `style`: Code style changes (formatting)
- `chore`: Build/tooling changes

### Examples
```
feat: add supervisor capacity indicator component

Displays current/max capacity with visual indicator
Uses color coding: green (available), yellow (limited), red (full)
```

```
fix: prevent application submission when supervisor at capacity

Added client-side check before API call
Shows user-friendly error message
```

## Quick Checklist

Before committing code, check:

- [ ] File named correctly (PascalCase for components, kebab-case for others)
- [ ] Imports ordered correctly (React → Libraries → Internal → Relative → CSS)
- [ ] All functions and parameters typed
- [ ] No `any` types used
- [ ] Boolean variables start with is/has/should/can
- [ ] Service functions return safe defaults (null, [], false)
- [ ] Service functions wrapped in try-catch
- [ ] Document IDs included in query results
- [ ] API routes verify authentication
- [ ] API routes validate input
- [ ] Consistent response format ({ success, data })
- [ ] Tests describe user behavior
- [ ] Comments explain WHY, not WHAT
- [ ] No commented-out code
- [ ] Tailwind classes used (no inline styles)
- [ ] Error messages user-friendly
- [ ] Pre-commit hooks pass

## Related Documentation

- Full Guide: `/docs/guides/code-conventions.md`
- Type System: `/docs/guides/type-system.md`
- Testing Strategy: `/docs/guides/testing-strategy.md`
- Architecture: `/docs/architecture/overview.md`

---

**Purpose**: Quick reference for consistent code style  
**Audience**: Developers, AI assistants, code reviewers  
**Format**: Checklists and DO/DON'T examples

