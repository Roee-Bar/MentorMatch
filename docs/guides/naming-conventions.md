# Naming Conventions

Standard naming patterns for files, variables, functions, and types in MentorMatch.

## File Naming

### Components
- **Format**: `PascalCase.tsx`
- **Examples**: `UserProfile.tsx`, `StatCard.tsx`, `DashboardSidebar.tsx`

### Pages (Next.js)
- **Format**: `page.tsx` (App Router convention)
- **Structure**:
```
app/
├── page.tsx                # Home
├── login/page.tsx          # Login
└── dashboard/
    ├── page.tsx            # Dashboard router
    └── student/page.tsx    # Student dashboard
```

### Layouts
- **Format**: `layout.tsx`
- **Examples**: `app/layout.tsx`, `app/dashboard/layout.tsx`

### Services & Utilities
- **Format**: `kebab-case.ts`
- **Examples**: `firebase-services.ts`, `auth.ts`, `date-utils.ts`

### Type Files
- **Format**: `kebab-case.ts`
- **Examples**: `database.ts`, `user.ts`, `dashboard.ts`

### Test Files
- **Format**: `ComponentName.test.tsx` or `moduleName.test.ts`
- **Location**: Co-located in `__tests__/` folder

```
app/components/
├── __tests__/
│   └── Header.test.tsx
└── Header.tsx
```

## Import Order

```typescript
// 1. React/Next.js
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { collection } from 'firebase/firestore';

// 3. Internal (@/ aliased)
import { UserService } from '@/lib/services/firebase-services';
import { BaseUser } from '@/types/database';

// 4. Relative imports
import { helper } from './utils';

// 5. CSS
import './styles.css';
```

**Rules:**
- Blank line between groups
- Sort alphabetically within groups
- Use named imports
- Avoid splitting imports from same module

## Variable Naming

### Variables
- **Format**: `camelCase`
```typescript
const userName = 'John';
const isLoggedIn = true;
const studentCount = 42;
```

### Constants
- **True constants**: `UPPER_SNAKE_CASE`
- **Config objects**: `camelCase`

```typescript
const MAX_UPLOAD_SIZE = 5242880;
const DEFAULT_TIMEOUT = 5000;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
};
```

## Function Naming

### Format
- **Style**: `camelCase`
- **Pattern**: verb-noun

### Common Patterns
```typescript
// CRUD operations
getUserById(id: string)
createApplication(data: Application)
updateStudent(id: string, data: Partial<Student>)
deleteProject(id: string)

// Data fetching
fetchApplications()
loadUserProfile()

// Event handlers
handleSubmit(e: Event)
handleChange(value: string)

// Boolean checks
isLoggedIn()
hasPermission()
canEdit()
```

## Component Naming

### Format
- **Style**: `PascalCase`
- **Pattern**: Noun or noun phrase

### Examples
```typescript
function UserProfile() { ... }
function StatCard() { ... }
function ApplicationList() { ... }
function DashboardSidebar() { ... }
```

### Props Interfaces
- **Pattern**: `{ComponentName}Props`

```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: BaseUser) => void;
}

function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Implementation
}
```

## Type Naming

### Format
- **Style**: `PascalCase`

### Interfaces
```typescript
interface BaseUser {
  id: string;
  name: string;
  email: string;
}

interface StudentDashboardProps {
  userId: string;
}
```

### Type Aliases
```typescript
type UserRole = 'student' | 'supervisor' | 'admin';
type ApplicationStatus = 'pending' | 'approved' | 'rejected';
type ID = string | number;
```

## React Naming Patterns

### State Variables
```typescript
const [user, setUser] = useState<BaseUser | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Event Handlers
- **Prefix**: `handle`

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
};

const handleChange = (value: string) => {
  setValue(value);
};
```

### Custom Hooks
- **Prefix**: `use`

```typescript
function useAuth() {
  const [user, setUser] = useState(null);
  // Implementation
  return { user, loading, error };
}

function useStudentDashboard(userId: string) {
  // Implementation
}
```

## Service Patterns

### Service Classes/Objects
```typescript
// Service naming
const UserService = {
  getUserById(id: string): Promise<BaseUser | null>,
  getAllUsers(): Promise<BaseUser[]>,
  updateUser(id: string, data: Partial<BaseUser>): Promise<boolean>,
};

const StudentService = {
  getStudentById(id: string): Promise<Student | null>,
  getUnmatchedStudents(): Promise<Student[]>,
};
```

### Method Patterns
- `get*` - Retrieve single entity
- `getAll*` - Retrieve collection
- `create*` - Create new entity
- `update*` - Modify entity
- `delete*` - Remove entity
- `fetch*` - Async retrieval (alternative to get)

## Directory Structure

### Organize by Feature
```
app/
├── dashboard/
│   ├── student/
│   │   ├── page.tsx
│   │   └── __tests__/
│   └── supervisor/
│       ├── page.tsx
│       └── __tests__/
└── components/
    ├── dashboard/
    │   ├── StatCard.tsx
    │   └── UserCard.tsx
    └── __tests__/
```

### Group Related Files
```
lib/
├── services/
│   ├── firebase-services.ts
│   └── __tests__/
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   └── __tests__/
└── hooks/
    ├── useAuth.ts
    └── __tests__/
```

## Commit Message Format

```
<type>: <subject>

<optional body>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (no logic change)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Maintenance

### Examples
```
feat: add student dashboard with application tracking
fix: correct supervisor capacity calculation
docs: update API reference
test: add tests for ApplicationCard component
```

---

**Last Updated**: November 2025

