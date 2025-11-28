# Code Conventions & Standards

## Overview

This document defines coding standards and conventions for the MentorMatch project. Consistent code style improves readability, reduces bugs, and facilitates team collaboration.

## Table of Contents

1. [File Naming Conventions](#file-naming-conventions)
2. [Import Order Standards](#import-order-standards)
3. [Component Structure](#component-structure)
4. [Naming Conventions](#naming-conventions)
5. [TypeScript Guidelines](#typescript-guidelines)
6. [Comment Standards](#comment-standards)
7. [Formatting and Style](#formatting-and-style)

---

## File Naming Conventions

### Components

**Format**: `PascalCase.tsx`

**Examples**:
- `UserProfile.tsx`
- `StatCard.tsx`
- `ApplicationCard.tsx`
- `DashboardSidebar.tsx`

**Reasoning**: Matches component name, easy to identify components

### Pages (Next.js)

**Format**: `page.tsx` (Next.js 14 App Router convention)

**Location Structure**:
```
app/
├── page.tsx                    # Home page
├── login/page.tsx              # Login page
├── register/page.tsx           # Register page
└── dashboard/
    ├── page.tsx                # Dashboard router
    └── student/page.tsx        # Student dashboard
```

**Reasoning**: Next.js file-based routing requirement

### Layouts

**Format**: `layout.tsx` (Next.js convention)

**Examples**:
- `app/layout.tsx` (root layout)
- `app/dashboard/layout.tsx` (dashboard layout)

### Service Files

**Format**: `kebab-case.ts`

**Examples**:
- `firebase-services.ts`
- `auth.ts`
- `firebase.ts`

**Reasoning**: Common convention for non-component files

### Type Definition Files

**Format**: `kebab-case.ts`

**Examples**:
- `database.ts`
- `user.ts`
- `dashboard.ts`

### Test Files

**Format**: `ComponentName.test.tsx` or `moduleName.test.ts`

**Location**: Co-located with the file being tested in `__tests__/` folder

**Examples**:
```
app/components/
├── __tests__/
│   ├── Header.test.tsx
│   └── UserProfile.test.tsx
├── Header.tsx
└── UserProfile.tsx
```

**Reasoning**: Easy to find tests, clear association with source files

---

## Import Order Standards

### Standard Order

```typescript
// 1. React/Next.js imports
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party library imports
import { collection, getDocs } from 'firebase/firestore';

// 3. @/ aliased imports (internal modules)
import { UserService } from '@/lib/services/firebase-services';
import { BaseUser, Student } from '@/types/database';
import { StatCard } from '@/components/dashboard/StatCard';

// 4. Relative imports (same directory or nearby)
import { helperFunction } from './utils';

// 5. CSS imports
import './styles.css';
```

### Grouping Rules

1. Leave blank line between import groups
2. Sort alphabetically within each group
3. Use named imports when possible
4. Avoid default + named imports from same module on separate lines

**Good**:
```typescript
import { useState, useEffect, useCallback } from 'react';
```

**Avoid**:
```typescript
import React from 'react';
import { useState, useEffect } from 'react';
```

---

## Component Structure

### Standard Component Pattern

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@/lib/services/firebase-services';
import type { BaseUser } from '@/types/database';

// 2. Type Definitions (Props, State, etc.)
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: BaseUser) => void;
}

// 3. Component Function
export default function UserProfile({ userId, onUpdate }: UserProfileProps) {
  
  // 4. Hooks
  const router = useRouter();
  const [user, setUser] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 5. Effects
  useEffect(() => {
    async function fetchUser() {
      const userData = await UserService.getUserById(userId);
      setUser(userData);
      setLoading(false);
    }
    fetchUser();
  }, [userId]);
  
  // 6. Handler Functions
  const handleUpdate = async () => {
    // Handler logic
  };
  
  // 7. Early Returns / Loading States
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>User not found</div>;
  }
  
  // 8. Main Render Logic
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Client Components

Mark client components explicitly at the top:

```typescript
'use client';

import React, { useState } from 'react';
// ... rest of imports
```

**When to use**:
- Component uses hooks (useState, useEffect, etc.)
- Component uses browser APIs
- Component has event handlers

### Server Components

Default in Next.js 14 App Router - no directive needed:

```typescript
import { UserService } from '@/lib/services/firebase-services';

export default async function ProfilePage() {
  // Server-side data fetching
  const user = await UserService.getUserById('123');
  
  return <div>{user?.name}</div>;
}
```

**Current Status**: Not widely used yet (future optimization)

---

## Naming Conventions

### Variables

**Format**: `camelCase`

**Examples**:
```typescript
const userName = 'John Doe';
const isLoggedIn = true;
const studentCount = 42;
```

### Constants

**Format**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config

**Examples**:
```typescript
// True constants (never change)
const MAX_UPLOAD_SIZE = 5242880; // 5MB
const DEFAULT_TIMEOUT = 5000;

// Config (may change based on env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
};
```

### Functions

**Format**: `camelCase`, descriptive verb-noun pattern

**Examples**:
```typescript
function getUserById(id: string) { ... }
async function fetchApplications() { ... }
function handleSubmit(e: Event) { ... }
```

**Patterns**:
- `get*` - retrieve data
- `fetch*` - async data retrieval
- `create*` - create new entity
- `update*` - modify existing entity
- `delete*` - remove entity
- `handle*` - event handlers
- `is*` / `has*` - boolean checks

### Components

**Format**: `PascalCase`, noun or noun phrase

**Examples**:
```typescript
function UserProfile() { ... }
function StatCard() { ... }
function ApplicationList() { ... }
```

### Types and Interfaces

**Format**: `PascalCase`

**Examples**:
```typescript
interface BaseUser { ... }
interface StudentDashboardProps { ... }
type ApplicationStatus = 'pending' | 'approved';
type UserRole = 'student' | 'supervisor' | 'admin';
```

### Service Methods

**Format**: `camelCase`, follows CRUD + domain patterns

**Patterns**:
```typescript
// UserService
getUserById(id: string)
getAllUsers()
updateUser(id: string, data: Partial<User>)

// StudentService
getStudentById(id: string)
getUnmatchedStudents()
updateStudent(id: string, data: Partial<Student>)
```

### File Names

- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Services**: `kebab-case.ts` (e.g., `firebase-services.ts`)
- **Types**: `kebab-case.ts` (e.g., `database.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `date-utils.ts`)

---

## TypeScript Guidelines

### Type Annotations

**Always define explicit return types for functions**:

```typescript
// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid (implicit return type)
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Use type inference for obvious cases**:

```typescript
// Good (type is obvious)
const name = 'John Doe';
const count = 42;
const items = ['apple', 'banana'];

// Good (explicit for clarity)
const [user, setUser] = useState<BaseUser | null>(null);
```

### Interfaces vs Types

**Use `interface` for objects**:
```typescript
interface User {
  name: string;
  email: string;
  role: UserRole;
}
```

**Use `type` for unions, aliases, and primitives**:
```typescript
type UserRole = 'student' | 'supervisor' | 'admin';
type Status = 'active' | 'inactive';
type ID = string | number;
```

**Why**: Interfaces are extendable, types are more flexible for unions

### Avoid `any`

**Bad**:
```typescript
const data: any = await fetchData();
```

**Good**:
```typescript
const data: BaseUser | null = await UserService.getUserById(id);

// Or if truly unknown structure
const data: unknown = await fetchData();
if (isUser(data)) {
  // Type guard narrows to User
}
```

### Null vs Undefined

**Prefer `null` for intentional absence**:
```typescript
async function getUser(id: string): Promise<User | null> {
  // Returns null when user not found
}
```

**Use `undefined` for optional properties**:
```typescript
interface User {
  name: string;
  photoURL?: string; // Optional, may be undefined
}
```

### Type Guards

Create type guards for runtime type checking:

```typescript
function isStudent(user: BaseUser): user is Student {
  return user.role === 'student';
}

// Usage
if (isStudent(user)) {
  console.log(user.studentId); // TypeScript knows it's Student
}
```

### Generics

Use generics for reusable functions:

```typescript
function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}
```

---

## Comment Standards

### When to Comment

**DO comment**:
1. Complex business logic
2. Non-obvious decisions
3. Workarounds or hacks
4. Public APIs and functions
5. Tricky algorithms

**DON'T comment**:
1. Obvious code (the code should be self-explanatory)
2. Commented-out code (delete it, it's in git history)
3. Redundant information

### Comment Formats

#### Single-line Comments

```typescript
// Calculate the total price including tax
const total = subtotal * (1 + taxRate);
```

#### Multi-line Comments

```typescript
/**
 * Fetches user profile from Firestore and transforms to UI format.
 * Returns null if user not found or on error.
 */
async function getUserProfile(userId: string): Promise<BaseUser | null> {
  // Implementation
}
```

#### JSDoc Comments (for public APIs)

```typescript
/**
 * Updates a student's profile in Firestore.
 * 
 * @param studentId - The student's user ID
 * @param data - Partial student data to update
 * @returns True on success, false on error
 * 
 * @example
 * ```typescript
 * const success = await StudentService.updateStudent('student123', {
 *   matchStatus: 'matched'
 * });
 * ```
 */
async function updateStudent(
  studentId: string, 
  data: Partial<Student>
): Promise<boolean> {
  // Implementation
}
```

### Test Description Comments

**Every test must have a 1-line comment** explaining what it tests:

```typescript
// Tests that the component renders the user's name correctly
it('should display user name', () => {
  render(<UserProfile user={mockUser} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

// Tests error handling when user data is null
it('should show error message when user is null', () => {
  render(<UserProfile user={null} />);
  expect(screen.getByText(/not found/i)).toBeInTheDocument();
});
```

**See**: `docs/testing-strategy.md` for more test documentation standards

### TODO Comments

Format: `// TODO: Description (YYYY-MM-DD)`

```typescript
// TODO: Implement caching for user profiles (2025-11-30)
async function getUserProfile(userId: string) {
  // Implementation
}
```

---

## Formatting and Style

### Indentation

**Standard**: 2 spaces (configured in `.editorconfig` or editor settings)

```typescript
function example() {
  if (condition) {
    doSomething();
  }
}
```

### Line Length

**Max**: 100 characters (soft limit, can exceed for readability)

**Breaking long lines**:
```typescript
// Good
const result = await ApplicationService.updateApplicationStatus(
  applicationId,
  'approved',
  'Great project proposal!'
);

// Avoid
const result = await ApplicationService.updateApplicationStatus(applicationId, 'approved', 'Great project proposal!');
```

### Quotes

**Preference**: Single quotes for strings, backticks for templates

```typescript
const name = 'John Doe';
const message = `Hello, ${name}!`;
```

### Semicolons

**Required**: Always use semicolons

```typescript
const user = getUser();
const name = user.name;
```

### Trailing Commas

**Use trailing commas** in multi-line arrays/objects:

```typescript
const user = {
  name: 'John',
  email: 'john@example.com',
  role: 'student', // Trailing comma
};

const items = [
  'item1',
  'item2',
  'item3', // Trailing comma
];
```

**Why**: Cleaner git diffs when adding items

### Arrow Functions

**Prefer arrow functions** for callbacks and short functions:

```typescript
// Good
const doubled = numbers.map(n => n * 2);
const handleClick = () => console.log('clicked');

// Traditional function for methods
function calculateTotal() {
  return this.items.reduce((sum, item) => sum + item.price, 0);
}
```

### Async/Await vs Promises

**Prefer async/await** over promise chains:

```typescript
// Good
async function fetchUserData(userId: string) {
  const user = await UserService.getUserById(userId);
  const applications = await ApplicationService.getStudentApplications(userId);
  return { user, applications };
}

// Avoid
function fetchUserData(userId: string) {
  return UserService.getUserById(userId)
    .then(user => ApplicationService.getStudentApplications(userId)
      .then(applications => ({ user, applications })));
}
```

### Destructuring

**Use destructuring** for cleaner code:

```typescript
// Good
const { name, email, role } = user;
const [first, second, ...rest] = items;

// Props destructuring
function UserCard({ user, onUpdate }: UserCardProps) {
  const { name, email } = user;
  return <div>{name}</div>;
}
```

---

## React-Specific Conventions

### Props Interfaces

Name props interfaces with component name + `Props`:

```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: BaseUser) => void;
}

export default function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Implementation
}
```

### Event Handlers

Prefix with `handle`:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Handle submission
};

const handleChange = (value: string) => {
  // Handle change
};
```

### State Naming

Use descriptive names:

```typescript
const [user, setUser] = useState<BaseUser | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Conditional Rendering

**Short conditions** - use `&&`:
```typescript
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
```

**True/False conditions** - use ternary:
```typescript
{user ? <UserProfile user={user} /> : <LoginPrompt />}
```

**Complex conditions** - use early returns or separate variables:
```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (!user) return <LoginPrompt />;

return <UserProfile user={user} />;
```

---

## CSS and Styling Conventions

### Tailwind Classes

**Component Classes** for repeated patterns:
```typescript
<button className="btn-primary">Submit</button>
```

**Utility Classes** for unique styles:
```typescript
<div className="flex items-center gap-4 p-4">
```

**Hybrid Approach** - combine when needed:
```typescript
<button className="btn-primary w-full sm:w-auto">
  Responsive Button
</button>
```

**See**: `docs/tailwind-usage.md` for detailed Tailwind conventions

### Class Name Organization

Order: Layout → Spacing → Sizing → Colors → Typography → Effects

```typescript
<div className="
  flex items-center justify-between
  p-4 gap-2
  w-full h-20
  bg-white text-gray-900
  text-lg font-medium
  rounded-lg shadow-sm
">
```

---

## Error Handling Conventions

### Service Layer

Services return safe defaults, never throw:

```typescript
async function getUserById(userId: string): Promise<BaseUser | null> {
  try {
    const doc = await getDoc(doc(db, 'users', userId));
    return doc.exists() ? doc.data() as BaseUser : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}
```

### Component Layer

Components handle null/empty cases:

```typescript
const user = await UserService.getUserById(userId);

if (!user) {
  setError('User not found');
  return;
}

// Use user safely here
```

### Try-Catch Usage

Use try-catch for async operations in components:

```typescript
async function loadData() {
  try {
    setLoading(true);
    const data = await fetchData();
    setData(data);
  } catch (error) {
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
}
```

---

## Git Commit Conventions

### Commit Message Format

```
<type>: <subject>

<optional body>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (deps, config)

### Examples

```
feat: add student dashboard with application tracking

fix: correct supervisor capacity calculation

docs: update API reference with new service methods

test: add tests for ApplicationCard component
```

---

## Documentation Maintenance

### When to Update Documentation

1. **Adding new features** - document APIs, types, patterns
2. **Changing architecture** - update architecture docs
3. **Adding conventions** - update this file
4. **Deprecating code** - mark deprecated and document migration

### Documentation Standards

- Keep examples up-to-date
- Test code snippets actually work
- Link related documentation
- Use consistent formatting

---

## Tool Configuration

### ESLint

Follow Next.js ESLint configuration (extends `next/core-web-vitals`).

### TypeScript

Strict mode enabled (`strict: true` in `tsconfig.json`).

### Editor Config

```
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

---

## Related Documentation

- `docs/testing-strategy.md` - Testing conventions and patterns
- `docs/tailwind-usage.md` - CSS and styling conventions
- `docs/type-system.md` - TypeScript type definitions
- `docs/api-reference.md` - Service layer patterns

## Enforcement

**Pre-commit Hooks** (Husky):
- Run tests before commit
- Validate package-lock.json sync
- Ensure no broken code enters repository

**CI/CD** (GitHub Actions):
- Run tests on push/PR
- Build verification
- Coverage reporting

**Code Reviews**:
- Check adherence to conventions
- Ensure documentation updates
- Verify test coverage

