# API Patterns

Backend API route conventions and patterns for MentorMatch.

## API Route Structure

### File Organization

```
app/api/
├── supervisors/
│   ├── route.ts (GET all)
│   ├── [id]/
│   │   ├── route.ts (GET, PUT)
│   │   ├── applications/route.ts (GET)
│   │   └── projects/route.ts (GET)
│   └── __tests__/route.test.ts
```

### Basic Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  // 1. Authentication
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // 2. Authorization (optional)
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // 3. Business Logic
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## HTTP Methods

### GET - Retrieve Data

```typescript
// Get all
export async function GET(request: NextRequest) {
  const users = await UserService.getAllUsers();
  return NextResponse.json(users);
}

// Get one with param
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await UserService.getUserById(params.id);
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}
```

### POST - Create Data

```typescript
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  
  // Validation
  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  const newUser = await UserService.createUser(body);
  return NextResponse.json(newUser, { status: 201 });
}
```

### PUT - Update Data

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const updated = await UserService.updateUser(params.id, body);
  
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}
```

### DELETE - Remove Data

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const deleted = await UserService.deleteUser(params.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}
```

## Authentication Middleware

### verifyAuth Pattern

```typescript
import { adminAuth } from '@/lib/firebase-admin';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const user = await UserService.getUserById(decodedToken.uid);
    
    return {
      authenticated: true,
      user,
      uid: decodedToken.uid,
    };
  } catch (error) {
    return { authenticated: false };
  }
}
```

### Role-Based Authorization

```typescript
export function requireRole(authResult: AuthResult, ...roles: UserRole[]) {
  if (!authResult.authenticated || !authResult.user) {
    throw new Error('Unauthorized');
  }
  
  if (!roles.includes(authResult.user.role)) {
    throw new Error('Forbidden');
  }
  
  return authResult.user;
}

// Usage
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  
  try {
    const user = requireRole(authResult, 'admin', 'supervisor');
    // User has correct role
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 403 }
    );
  }
}
```

## Request Validation

### Zod Schema

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['student', 'supervisor', 'admin']),
  photoURL: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate
  const validation = CreateUserSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.errors },
      { status: 400 }
    );
  }
  
  const data = validation.data;
  // Use validated data
}
```

## Error Handling

### Standard Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Custom Error Handler

```typescript
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

function handleError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Response Patterns

### Success Response

```typescript
// Simple data
return NextResponse.json({ id: '123', name: 'John' });

// With metadata
return NextResponse.json({
  data: users,
  total: 100,
  page: 1,
  perPage: 20,
});

// Created resource
return NextResponse.json({ id: newId, ...data }, { status: 201 });
```

### Error Response

```typescript
// Not found
return NextResponse.json({ error: 'User not found' }, { status: 404 });

// Validation error
return NextResponse.json(
  {
    error: 'Validation failed',
    details: ['Email is required', 'Name too short']
  },
  { status: 400 }
);

// Unauthorized
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## Query Parameters

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  
  const results = await fetchData({ page, limit, status, search });
  
  return NextResponse.json(results);
}
```

## API Client Usage

### Client-Side Calls

```typescript
import { apiClient } from '@/lib/api/client';

// GET request
const users = await apiClient.get<User[]>('/api/users');

// POST request
const newUser = await apiClient.post<User>('/api/users', {
  name: 'John',
  email: 'john@example.com',
});

// PUT request
await apiClient.put(`/api/users/${id}`, { name: 'Jane' });

// DELETE request
await apiClient.delete(`/api/users/${id}`);
```

### API Client Implementation

```typescript
class APIClient {
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    return user ? await user.getIdToken() : null;
  }
  
  async get<T>(url: string): Promise<T> {
    const token = await this.getAuthToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async post<T>(url: string, data: any): Promise<T> {
    const token = await this.getAuthToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
}

export const apiClient = new APIClient();
```

## Testing API Routes

```typescript
import { GET, POST } from './route';

describe('API Route Tests', () => {
  jest.mock('@/lib/middleware/auth', () => ({
    verifyAuth: jest.fn().mockResolvedValue({
      authenticated: true,
      user: mockUser,
    }),
  }));
  
  test('GET should return users', async () => {
    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
  
  test('POST should create user', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.name).toBe('John');
  });
});
```

## Best Practices

### Security
- Always verify authentication for protected routes
- Validate all user input
- Use role-based authorization
- Never expose sensitive data
- Rate limit API calls (implement as needed)

### Performance
- Keep handlers lightweight
- Use database indexes
- Cache frequently accessed data
- Paginate large result sets
- Return only needed fields

### Error Handling
- Always use try-catch
- Log errors for debugging
- Return consistent error format
- Use appropriate status codes
- Don't expose internal errors to client

### Code Organization
- One concern per route
- Extract complex logic to services
- Co-locate tests with routes
- Use middleware for common functionality
- Keep routes focused and simple

---

**Last Updated**: November 2025
