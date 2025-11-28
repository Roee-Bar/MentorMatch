# Backend API Implementation - Complete Documentation

## Overview

This document provides comprehensive documentation for the traditional REST API backend layer implemented for MentorMatch. The backend uses Next.js API routes with Firebase Admin SDK for authentication and Firestore for data storage.

**Status**: COMPLETE - Complete and Tested (111 backend tests, all passing)

---

## Architecture

### Request Flow

```
Client Component
    ↓
  Get Firebase ID Token
    ↓
  API Client (lib/api/client.ts)
    ↓
  API Route (app/api/*)
    ↓
  Authentication Middleware (verifyAuth)
    ↓
  Authorization Check (role-based)
    ↓
  Request Validation (Zod schemas)
    ↓
  Firebase Service Layer
    ↓
  Cloud Firestore
```

---

## Project Structure

```
app/api/
├── supervisors/
│   ├── __tests__/
│   │   └── route.test.ts (13 tests)
│   ├── [id]/
│   │   ├── route.ts (GET, PUT)
│   │   ├── applications/
│   │   │   └── route.ts (GET)
│   │   └── projects/
│   │       └── route.ts (GET)
│   └── route.ts (GET)
├── applications/
│   ├── __tests__/
│   │   └── route.test.ts (14 tests)
│   ├── [id]/
│   │   ├── route.ts (GET, PUT, DELETE)
│   │   └── status/
│   │       └── route.ts (PATCH)
│   └── route.ts (GET, POST)
├── students/
│   ├── __tests__/
│   │   └── route.test.ts (8 tests)
│   ├── [id]/
│   │   └── route.ts (GET, PUT)
│   ├── unmatched/
│   │   └── route.ts (GET)
│   └── route.ts (GET)
├── projects/
│   ├── __tests__/
│   │   └── combined-routes.test.ts (11 tests)
│   ├── [id]/
│   │   └── route.ts (GET)
│   └── route.ts (GET, POST)
├── users/
│   ├── [id]/
│   │   └── route.ts (GET, PUT)
│   └── route.ts (GET)
└── admin/
    ├── stats/
    │   └── route.ts (GET)
    └── reports/
        └── route.ts (GET)

lib/
├── api/
│   ├── __tests__/
│   │   └── client.test.ts (24 tests)
│   ├── client.ts (API client library)
│   └── endpoints.ts (endpoint constants)
├── middleware/
│   ├── __tests__/
│   │   ├── auth.test.ts (10 tests)
│   │   ├── validation.test.ts (18 tests)
│   │   └── errorHandler.test.ts (13 tests)
│   ├── auth.ts (authentication/authorization)
│   ├── validation.ts (Zod schemas)
│   └── errorHandler.ts (error handling)
└── firebase-admin.ts (Firebase Admin SDK init)
```

---

## API Endpoints Reference

### Authentication

All protected endpoints require:
- **Authorization header**: `Bearer <firebase-id-token>`
- Valid Firebase user session
- Appropriate role permissions

### Supervisors API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/supervisors` | List all supervisors | Implemented | Any |
| GET | `/api/supervisors?available=true` | List available supervisors | Implemented | Any |
| GET | `/api/supervisors?department=CS` | Filter by department | Implemented | Any |
| GET | `/api/supervisors/:id` | Get supervisor by ID | Implemented | Any |
| PUT | `/api/supervisors/:id` | Update supervisor | Implemented | Owner/Admin |
| GET | `/api/supervisors/:id/applications` | Get supervisor's applications | Implemented | Owner/Admin |
| GET | `/api/supervisors/:id/projects` | Get supervisor's projects | Implemented | Owner/Admin |

**Example Request:**
```javascript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getSupervisors(token, { available: true });
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "supervisor-123",
      "fullName": "Dr. Jane Smith",
      "department": "Computer Science",
      "bio": "AI and Machine Learning specialist",
      "availabilityStatus": "available",
      "currentCapacity": 3,
      "maxCapacity": 5
    }
  ],
  "count": 1
}
```

### Applications API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/applications` | List all applications | Implemented | Admin |
| POST | `/api/applications` | Create application | Implemented | Student |
| GET | `/api/applications/:id` | Get application by ID | Implemented | Owner/Supervisor/Admin |
| PUT | `/api/applications/:id` | Update application | Implemented | Owner/Admin |
| DELETE | `/api/applications/:id` | Delete application | Implemented | Owner/Admin |
| PATCH | `/api/applications/:id/status` | Update status | Implemented | Supervisor/Admin |

**Example Create Application:**
```javascript
const token = await auth.currentUser?.getIdToken();
const applicationData = {
  supervisorId: 'supervisor-123',
  projectTitle: 'Machine Learning Research Project',
  projectDescription: 'A comprehensive study of ML algorithms...',
  hasPartner: false
};
const response = await apiClient.createApplication(applicationData, token);
```

**Example Update Status:**
```javascript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.updateApplicationStatus(
  'app-123',
  'approved',
  'Great proposal! Looking forward to working with you.',
  token
);
```

### Students API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/students` | List all students | Implemented | Supervisor/Admin |
| GET | `/api/students/:id` | Get student by ID | Implemented | Owner/Supervisor/Admin |
| PUT | `/api/students/:id` | Update student | Implemented | Owner/Admin |
| GET | `/api/students/unmatched` | List unmatched students | Implemented | Admin |

### Projects API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/projects` | List all projects | Implemented | Any |
| POST | `/api/projects` | Create project | Implemented | Admin |
| GET | `/api/projects/:id` | Get project by ID | Implemented | Any |

### Users API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/users` | List all users | Implemented | Admin |
| GET | `/api/users/:id` | Get user by ID | Implemented | Owner/Admin |
| PUT | `/api/users/:id` | Update user | Implemented | Owner/Admin |

### Admin API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/admin/stats` | Get dashboard statistics | Implemented | Admin |
| GET | `/api/admin/reports` | Generate reports | Implemented | Admin |

---

## Middleware

### Authentication Middleware (`lib/middleware/auth.ts`)

**Purpose**: Verify Firebase ID tokens and extract user information.

**Functions:**

1. **`verifyAuth(request: NextRequest)`**
   - Extracts token from Authorization header
   - Verifies token using Firebase Admin SDK
   - Fetches user profile from Firestore
   - Returns user context with role information

2. **`requireRole(allowedRoles: string[])`**
   - Creates middleware function that checks user roles
   - Returns authorization result

**Usage in API Routes:**
```typescript
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check role
  if (authResult.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with authorized logic...
}
```

### Validation Middleware (`lib/middleware/validation.ts`)

**Purpose**: Type-safe request validation using Zod schemas.

**Schemas:**
- `createApplicationSchema`: Validates application creation
- `updateSupervisorSchema`: Validates supervisor profile updates
- `updateApplicationStatusSchema`: Validates status updates

**Usage:**
```typescript
import { validateRequest, createApplicationSchema } from '@/lib/middleware/validation';

export async function POST(request: NextRequest) {
  const validation = await validateRequest(request, createApplicationSchema);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Use validated data
  const data = validation.data;
}
```

### Error Handler (`lib/middleware/errorHandler.ts`)

**Purpose**: Centralized error handling with consistent responses.

**Classes & Functions:**
- `ApiError`: Custom error class with status code
- `handleApiError(error)`: Converts errors to JSON responses
- `ErrorCodes`: Standard HTTP error constants

**Usage:**
```typescript
import { handleApiError, ApiError } from '@/lib/middleware/errorHandler';

try {
  // API logic...
} catch (error) {
  return handleApiError(error);
}

// Throw custom errors:
throw new ApiError(404, 'Resource not found');
```

---

## API Client Library (`lib/api/client.ts`)

**Purpose**: Type-safe client for making API calls from frontend components.

**Core Function:**
```typescript
apiFetch(endpoint: string, options: FetchOptions)
```
- Adds base URL
- Injects Authorization header with token
- Handles errors
- Returns parsed JSON

**Client Methods:**

All methods follow pattern: `methodName(params..., token: string)`

**Supervisors:**
- `getSupervisors(token, params?)`
- `getSupervisorById(id, token)`
- `getSupervisorApplications(id, token)`
- `getSupervisorProjects(id, token)`
- `updateSupervisor(id, data, token)`

**Applications:**
- `getApplications(token)`
- `getApplicationById(id, token)`
- `createApplication(data, token)`
- `updateApplicationStatus(id, status, feedback, token)`
- `deleteApplication(id, token)`

**Students, Projects, Users, Admin:**
- Similar patterns for each resource

---

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
  "errors": ["detail1", "detail2"]  // optional, for validation errors
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Testing

### Test Structure

**Unit Tests** (`lib/middleware/__tests__/`):
- Test middleware functions in isolation
- Mock dependencies (Firebase Admin, auth functions)
- Focus on logic correctness

**Integration Tests** (`app/api/*/__tests__/`):
- Test complete API routes
- Mock Firebase services
- Verify authentication/authorization
- Test error handling

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- app/api/supervisors/__tests__/route.test.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Statistics
- **Total Backend Tests**: 111
- **Middleware Tests**: 41
- **API Client Tests**: 24
- **Route Tests**: 46
- **Pass Rate**: 100%

---

## Error Handling Best Practices

1. **Always wrap route handlers in try-catch**
2. **Use `verifyAuth` at the start of every protected route**
3. **Check authorization before accessing resources**
4. **Validate request data before processing**
5. **Return consistent error responses**
6. **Log errors for debugging**

---

## Security Considerations

1. **Authentication**: All routes verify Firebase ID tokens
2. **Authorization**: Role-based access control enforced
3. **Validation**: All inputs validated with Zod schemas
4. **Private Keys**: Firebase Admin credentials secured in environment variables
5. **HTTPS**: Always use HTTPS in production
6. **Rate Limiting**: Consider adding rate limiting middleware (future enhancement)

---

## Performance Considerations

1. **Caching**: Consider caching frequently accessed data
2. **Query Optimization**: Use Firebase indexes for complex queries
3. **Pagination**: Implement pagination for large datasets (future enhancement)
4. **Connection Pooling**: Firebase Admin SDK handles connection pooling

---

## Future Enhancements

- [ ] Rate limiting middleware
- [ ] Request caching
- [ ] API versioning (e.g., `/api/v1/`)
- [ ] Pagination support
- [ ] Webhook support for real-time updates
- [ ] GraphQL alternative
- [ ] OpenAPI/Swagger documentation
- [ ] API usage analytics

---

## Troubleshooting

### Common Issues

**401 Unauthorized Errors:**
- User not logged in
- Token expired (Firebase tokens expire after 1 hour)
- Invalid token format

**403 Forbidden Errors:**
- User lacks required role
- Trying to access another user's resources

**500 Internal Server Error:**
- Firebase service error
- Database connection issue
- Check server logs for details

**Validation Errors (400):**
- Missing required fields
- Invalid data format
- Check error message for specific field issues

---

## Migration Checklist

When migrating a component from direct Firebase access to API:

- [ ] Import `apiClient` from `@/lib/api/client`
- [ ] Get Firebase ID token: `await auth.currentUser?.getIdToken()`
- [ ] Replace Firebase service call with API client call
- [ ] Add try-catch error handling
- [ ] Add loading states
- [ ] Update component tests to mock `apiClient`
- [ ] Test authentication flows
- [ ] Test error scenarios

---

## Support & Resources

- **Implementation Guide**: See `docs/backend-implementation-guide.md`
- **Firebase Admin Setup**: See `docs/firebase-admin-setup.md`
- **Test Examples**: Check `app/api/supervisors/__tests__/` for patterns
- **API Client Examples**: Check `lib/api/__tests__/client.test.ts`

