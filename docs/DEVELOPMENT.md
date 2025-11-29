# Development Guide

Coding conventions, testing strategy, and development workflow for MentorMatch.

## Quick Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Start production server

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:e2e     # E2E tests

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript errors
```

## File & Naming Conventions

### Files

- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Pages**: `page.tsx` (Next.js App Router)
- **Services**: `kebab-case.ts` (e.g., `firebase-services.ts`)
- **Tests**: `ComponentName.test.tsx` in `__tests__/` folder

### Variables & Functions

```typescript
// Variables - camelCase
const userName = 'John';
const isLoggedIn = true;

// Constants - UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5242880;

// Functions - camelCase, verb-noun
function getUserById(id: string) {}
function handleSubmit(e: Event) {}

// Components - PascalCase
function UserProfile() {}

// Custom Hooks - use prefix
function useAuth() {}

// Props Interface - ComponentProps
interface UserProfileProps {}
```

### Import Order

```typescript
// 1. React/Next.js
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party
import { collection } from 'firebase/firestore';

// 3. Internal (@/ aliased)
import { UserService } from '@/lib/services/firebase-services';
import { BaseUser } from '@/types/database';

// 4. Relative
import { helper } from './utils';

// 5. CSS
import './styles.css';
```

## Component Patterns

### Standard Structure

```typescript
// 1. Imports
import React, { useState } from 'react';

// 2. Types
interface Props {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 3. Component
export default function UserProfile({ userId, onUpdate }: Props) {
  // 4. Hooks
  const [loading, setLoading] = useState(true);
  
  // 5. Effects
  useEffect(() => {
    fetchUser();
  }, [userId]);
  
  // 6. Handlers
  const handleUpdate = () => {};
  
  // 7. Early returns
  if (loading) return <div>Loading...</div>;
  
  // 8. Main render
  return <div>...</div>;
}
```

### Client vs Server Components

**Client Components** (`'use client'`):
- Uses hooks, state, event handlers
- Browser APIs, interactive elements

**Server Components** (default):
- Data fetching, static content
- No useState, useEffect

### Props Patterns

```typescript
// Required and optional
interface ButtonProps {
  label: string;           // required
  onClick: () => void;     // required
  variant?: 'primary' | 'secondary';  // optional with default
  disabled?: boolean;      // optional
}

// Children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

// Callbacks with on* prefix
interface FormProps {
  onSubmit: (data: FormData) => void;
  onCancel?: () => void;
}
```

## Testing Strategy

### What to Test

**DO Test**:
- User interactions (clicks, form submissions)
- Conditional logic and role-based UI
- State management and async operations
- Business logic and validation
- API integration

**DON'T Test**:
- Static text content
- Static CSS classes
- Implementation details
- External library internals

### Test Structure

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('UserProfile', () => {
  it('should display user name', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('should call onUpdate when button clicked', () => {
    const handleUpdate = jest.fn();
    render(<UserProfile onUpdate={handleUpdate} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking Firebase

```typescript
jest.mock('@/lib/services/firebase-services', () => ({
  SupervisorService: {
    getAvailableSupervisors: jest.fn().mockResolvedValue([mockData])
  }
}));

jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  }
}));
```

## CI/CD Workflow

### Pipeline

```
Git Push
  ↓
GitHub Actions CI
  ├── Unit Tests (40s)
  ├── E2E Tests (3min)
  └── Build Check (50s)
  ↓
Vercel Preview Deployment
  ↓
Code Review
  ↓
Merge → Production
```

### Pre-Commit Hook

Runs automatically:
- Validates `package-lock.json`
- Runs unit tests
- Fails commit if errors

Bypass with `--no-verify` only when necessary

### Branch Strategy

- `main` - Production (protected)
- `feature/{name}` - New features
- `bugfix/{name}` - Bug fixes
- `hotfix/{name}` - Urgent fixes

## API Development

### Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  // 1. Authentication
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Authorization
  if (authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 3. Business Logic
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Validation with Zod

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['student', 'supervisor', 'admin'])
});

const body = await request.json();
const validation = CreateUserSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    { error: 'Validation failed', errors: validation.error.errors },
    { status: 400 }
  );
}
```

## Styling with Tailwind

### Component Classes

Use for repeated patterns:

```tsx
// Button variants
<button className="btn-primary">Submit</button>
<button className="btn-secondary">Cancel</button>

// Cards
<div className="card-base">Content</div>
<div className="card-hover">Hoverable</div>

// Badges
<span className="badge-success">Approved</span>
<span className="badge-warning">Pending</span>
```

### Utility Classes

Use for unique styles:

```tsx
<div className="flex items-center justify-between p-4 mt-2">
  <h2 className="text-lg font-bold text-gray-900">Title</h2>
  <button className="btn-primary w-full sm:w-auto">Action</button>
</div>
```

### Conditional Styling

```typescript
const classes = `
  card-base
  ${isActive ? 'border-blue-500' : 'border-gray-300'}
  ${isActive && 'shadow-lg'}
`;
```

## TypeScript Patterns

### Component Types

```typescript
// Event types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {};

// Generic components
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}
```

## Common Troubleshooting

### "useRouter is not a function"

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));
```

### Tests Pass Locally, Fail in CI

- Check Node version matches (20.x)
- Use `npm ci` in CI
- Check environment variables
- Review timing-sensitive tests

### Build Fails

- Verify environment variables
- Test locally: `NODE_ENV=production npm run build`
- Check Vercel logs
- Review `vercel.json` configuration

### Port 3000 in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

## Best Practices

### Code Quality
- Write descriptive variable/function names
- Keep functions small and focused
- Use TypeScript types everywhere
- Follow single responsibility principle
- Comment complex logic only

### Testing
- Test user behavior, not implementation
- Keep tests simple and readable
- One assertion per test when possible
- Maintain test independence
- Run tests before committing

### Security
- Never commit `.env.local`
- Never expose admin credentials
- Validate all user input
- Use role-based authorization
- Log errors without sensitive data

### Performance
- Use React.memo for expensive components
- Implement code splitting
- Optimize images
- Minimize re-renders
- Use loading states

### Git
- Write descriptive commit messages
- Keep commits small and focused
- Use conventional commits format:
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation
  - `test:` Tests
  - `refactor:` Code refactoring
  - `style:` Code style (no logic change)
  - `chore:` Maintenance

## Project Structure

```
Final/
├── app/
│   ├── api/              # REST API routes
│   ├── dashboard/        # Role-based dashboards
│   ├── components/       # Page components
│   └── ...               # Other pages
├── lib/
│   ├── api/              # API client
│   ├── middleware/       # Auth, validation
│   ├── services/         # Firebase services
│   └── hooks/            # React hooks
├── types/                # TypeScript types
├── e2e/                  # E2E tests
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Related Documentation

- [docs/API-REFERENCE.md](API-REFERENCE.md) - API documentation
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [docs/SETUP.md](SETUP.md) - Setup instructions
- [docs/getting-started/development-process.md](getting-started/development-process.md) - Project timeline

