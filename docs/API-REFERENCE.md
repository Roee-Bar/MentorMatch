# API Reference

Complete documentation for the MentorMatch REST API.

## Overview

The backend uses Next.js API routes with Firebase Admin SDK for a traditional REST architecture.

**Base URL**: `/api`

**Authentication**: All protected endpoints require `Authorization: Bearer <firebase-id-token>`

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* resource data */ },
  "count": 10  // for list endpoints
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "errors": ["detail1", "detail2"]  // optional, for validation
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

### Getting ID Token

```typescript
import { auth } from '@/lib/firebase';

const token = await auth.currentUser?.getIdToken();
```

### Using Token

```typescript
const response = await fetch('/api/supervisors', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Using API Client

```typescript
import { apiClient } from '@/lib/api/client';

const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getSupervisors(token);
```

## Endpoints

### Supervisors API

#### List Supervisors

```
GET /api/supervisors
```

**Query Parameters**:
- `available` (boolean) - Filter by availability
- `department` (string) - Filter by department

**Authorization**: Any authenticated user

**Example**:
```typescript
const response = await apiClient.getSupervisors(token, { available: true });
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "supervisor-123",
      "fullName": "Dr. Jane Smith",
      "department": "Computer Science",
      "availabilityStatus": "available",
      "currentCapacity": 3,
      "maxCapacity": 5
    }
  ],
  "count": 1
}
```

#### Get Supervisor

```
GET /api/supervisors/:id
```

**Authorization**: Any authenticated user

#### Update Supervisor

```
PUT /api/supervisors/:id
```

**Authorization**: Supervisor (own profile) or Admin

**Body**:
```json
{
  "bio": "Updated bio",
  "expertiseAreas": ["AI", "ML"],
  "availabilityStatus": "limited"
}
```

#### Get Supervisor Applications

```
GET /api/supervisors/:id/applications
```

**Authorization**: Supervisor (own applications) or Admin

#### Get Supervisor Projects

```
GET /api/supervisors/:id/projects
```

**Authorization**: Supervisor (own projects) or Admin

### Applications API

#### List Applications

```
GET /api/applications
```

**Authorization**: Admin only

#### Create Application

```
POST /api/applications
```

**Authorization**: Student

**Body**:
```json
{
  "supervisorId": "supervisor-123",
  "projectTitle": "Machine Learning Research",
  "projectDescription": "Detailed description...",
  "hasPartner": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "app-456",
    "status": "pending",
    "submittedAt": "2025-11-29T..."
  }
}
```

#### Get Application

```
GET /api/applications/:id
```

**Authorization**: Owner, Supervisor, or Admin

#### Update Application

```
PUT /api/applications/:id
```

**Authorization**: Owner or Admin

**Body**:
```json
{
  "projectTitle": "Updated title",
  "projectDescription": "Updated description"
}
```

#### Delete Application

```
DELETE /api/applications/:id
```

**Authorization**: Owner or Admin

#### Update Application Status

```
PATCH /api/applications/:id/status
```

**Authorization**: Supervisor or Admin

**Body**:
```json
{
  "status": "approved",
  "feedback": "Great proposal! Looking forward to working with you."
}
```

**Status Values**:
- `pending`
- `under_review`
- `approved`
- `rejected`
- `revision_requested`

### Students API

#### List Students

```
GET /api/students
```

**Authorization**: Supervisor or Admin

#### Get Student

```
GET /api/students/:id
```

**Authorization**: Owner, Supervisor, or Admin

#### Update Student

```
PUT /api/students/:id
```

**Authorization**: Owner or Admin

#### Get Unmatched Students

```
GET /api/students/unmatched
```

**Authorization**: Admin only

### Projects API

#### List Projects

```
GET /api/projects
```

**Authorization**: Any authenticated user

#### Create Project

```
POST /api/projects
```

**Authorization**: Admin only

**Body**:
```json
{
  "title": "Project Title",
  "description": "Project description",
  "supervisorId": "supervisor-123"
}
```

#### Get Project

```
GET /api/projects/:id
```

**Authorization**: Any authenticated user

### Users API

#### List Users

```
GET /api/users
```

**Authorization**: Admin only

#### Get User

```
GET /api/users/:id
```

**Authorization**: Owner or Admin

#### Update User

```
PUT /api/users/:id
```

**Authorization**: Owner or Admin

### Admin API

#### Get Dashboard Statistics

```
GET /api/admin/stats
```

**Authorization**: Admin only

**Response**:
```json
{
  "success": true,
  "data": {
    "totalStudents": 50,
    "totalSupervisors": 15,
    "totalProjects": 30,
    "pendingApplications": 8
  }
}
```

#### Generate Reports

```
GET /api/admin/reports
```

**Authorization**: Admin only

## API Patterns

### Standard Route Pattern

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

### Request Validation

```typescript
import { z } from 'zod';

const CreateApplicationSchema = z.object({
  supervisorId: z.string().min(1),
  projectTitle: z.string().min(5),
  projectDescription: z.string().min(20),
  hasPartner: z.boolean()
});

// In route handler
const body = await request.json();
const validation = CreateApplicationSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    { error: 'Validation failed', errors: validation.error.errors },
    { status: 400 }
  );
}

const data = validation.data; // Type-safe
```

### Error Handling

```typescript
try {
  const result = await operation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## Middleware

### Authentication Middleware

**File**: `lib/middleware/auth.ts`

**Function**: `verifyAuth(request: NextRequest)`

**Returns**:
```typescript
{
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'student' | 'supervisor' | 'admin';
  };
  uid?: string;
}
```

### Validation Middleware

**File**: `lib/middleware/validation.ts`

**Function**: `validateRequest(request, schema)`

**Returns**:
```typescript
{
  valid: boolean;
  data?: any;  // Parsed and validated
  error?: string;
}
```

### Error Handler

**File**: `lib/middleware/errorHandler.ts`

**Class**: `ApiError`

**Function**: `handleApiError(error)`

## API Client Usage

### Client-Side Calls

```typescript
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';

// Get token
const token = await auth.currentUser?.getIdToken();

// List supervisors
const supervisors = await apiClient.getSupervisors(token);

// Create application
const app = await apiClient.createApplication({
  supervisorId: 'supervisor-123',
  projectTitle: 'My Project',
  projectDescription: 'Description...',
  hasPartner: false
}, token);

// Update status
await apiClient.updateApplicationStatus(
  'app-456',
  'approved',
  'Feedback message',
  token
);
```

### Error Handling

```typescript
try {
  const data = await apiClient.getSupervisors(token);
  console.log(data);
} catch (error) {
  console.error('API Error:', error.message);
  // Show error to user
}
```

## Rate Limiting

Current: Firebase built-in rate limiting

Future: Consider adding application-level rate limiting for additional protection

## Versioning

Current: No versioning (v1 implicit)

Future: Consider `/api/v2/` for breaking changes

## Best Practices

### Security
- Always verify authentication for protected routes
- Validate all user input
- Use role-based authorization
- Never expose sensitive data
- Log errors without exposing internals

### Performance
- Keep handlers lightweight
- Use database indexes
- Cache frequently accessed data
- Return only needed fields

### Error Handling
- Always use try-catch
- Log errors for debugging
- Return consistent error format
- Use appropriate status codes

### Code Organization
- One concern per route
- Extract complex logic to services
- Co-locate tests with routes
- Use middleware for common functionality

## Related Documentation

- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [docs/DEVELOPMENT.md](DEVELOPMENT.md) - Development guidelines
- [docs/SETUP.md](SETUP.md) - Setup instructions
- [docs/architecture/backend/implementation-guide.md](architecture/backend/implementation-guide.md) - Implementation guide

