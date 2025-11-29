# Component Patterns

React component architecture and patterns for MentorMatch.

## Standard Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@/lib/services/firebase-services';
import type { BaseUser } from '@/types/database';

// 2. Type Definitions
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
  
  // 7. Early Returns
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  
  // 8. Main Render
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## Client vs Server Components

### Client Components

Mark with `'use client'` at top:

```typescript
'use client';

import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Use when:**
- Using hooks (useState, useEffect)
- Using browser APIs
- Event handlers needed
- Interactive elements

### Server Components

Default in Next.js 14 - no directive needed:

```typescript
import { UserService } from '@/lib/services/firebase-services';

export default async function ProfilePage() {
  const user = await UserService.getUserById('123');
  return <div>{user?.name}</div>;
}
```

**Use for:**
- Data fetching
- Static content
- SEO-important pages

## Props Patterns

### Type Safety

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button 
      className={`btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

### Children Props

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Optional Callbacks

```typescript
interface FormProps {
  onSubmit: (data: FormData) => void;
  onCancel?: () => void;
}

function Form({ onSubmit, onCancel }: FormProps) {
  const handleCancel = () => {
    onCancel?.();  // Safe optional call
  };
  
  return <form>...</form>;
}
```

## State Management

### Local State

```typescript
const [user, setUser] = useState<BaseUser | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Derived State

```typescript
function UserList({ users }: { users: User[] }) {
  // Derived - no useState needed
  const activeUsers = users.filter(u => u.status === 'active');
  const userCount = users.length;
  
  return (
    <div>
      <p>{userCount} total, {activeUsers.length} active</p>
    </div>
  );
}
```

### Complex State

```typescript
interface DashboardState {
  applications: Application[];
  selectedId: string | null;
  filter: ApplicationStatus;
}

const [state, setState] = useState<DashboardState>({
  applications: [],
  selectedId: null,
  filter: 'pending',
});

// Update specific field
setState(prev => ({ ...prev, selectedId: newId }));
```

## Conditional Rendering

### Simple Conditions

```typescript
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
```

### Binary Conditions

```typescript
{user ? <UserProfile user={user} /> : <LoginPrompt />}
```

### Early Returns

```typescript
function UserProfile({ userId }: Props) {
  const { user, loading, error } = useUser(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <LoginPrompt />;
  
  return <div>{user.name}</div>;
}
```

## Event Handlers

### Naming Pattern

Prefix with `handle`:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Submit logic
};

const handleChange = (value: string) => {
  setValue(value);
};

const handleClick = () => {
  console.log('Clicked');
};
```

### Passing Data

```typescript
function ItemList({ items, onDelete }: Props) {
  return (
    <div>
      {items.map(item => (
        <button key={item.id} onClick={() => onDelete(item.id)}>
          Delete
        </button>
      ))}
    </div>
  );
}
```

## Hooks Patterns

### Custom Hooks

```typescript
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Auth logic
  }, []);
  
  return { user, loading };
}

// Usage
function Profile() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

### Dependencies

```typescript
// Runs when userId changes
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// Runs only on mount
useEffect(() => {
  initializeApp();
}, []);
```

## Error Handling

### Component Level

```typescript
function DataLoader({ id }: Props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function load() {
      try {
        const result = await fetchData(id);
        setData(result);
      } catch (err) {
        setError('Failed to load data');
      }
    }
    load();
  }, [id]);
  
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;
  
  return <div>{/* Render data */}</div>;
}
```

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## TypeScript Patterns

### Component Types

```typescript
// Explicit return type
function MyComponent({ title }: Props): JSX.Element {
  return <div>{title}</div>;
}
```

### Event Types

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log('Clicked');
};
```

### Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
```

## Performance

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ data }: Props) {
  // Memoize expensive calculation
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item));
  }, [data]);
  
  // Memoize callback
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);
  
  return <div>{/* render */}</div>;
}
```

### React.memo

```typescript
const UserCard = React.memo(({ user }: Props) => {
  return <div>{user.name}</div>;
});

// With custom comparison
const UserCard = React.memo(
  ({ user }: Props) => <div>{user.name}</div>,
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id
);
```

## Styling with Tailwind

### Conditional Classes

```typescript
function Button({ variant = 'primary' }: Props) {
  const baseClasses = 'px-4 py-2 rounded font-medium';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      Click me
    </button>
  );
}
```

### Dynamic Classes

```typescript
function Card({ isActive }: Props) {
  return (
    <div className={`
      card
      ${isActive ? 'border-blue-500' : 'border-gray-300'}
      ${isActive && 'shadow-lg'}
    `}>
      Content
    </div>
  );
}
```

## Testing Patterns

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

// Test rendering
test('should display user name', () => {
  render(<UserProfile user={mockUser} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

// Test interaction
test('should call onClick when button clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

**Last Updated**: November 2025
