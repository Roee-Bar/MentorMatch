# API Quick Reference (AI-Optimized)

Complete API endpoint reference in table format for quick lookup.

## Authentication

All protected endpoints require:
- **Header**: `Authorization: Bearer <firebase-id-token>`
- **Valid session**: User must be authenticated
- **Role permissions**: Appropriate role for the endpoint

## Supervisors API

| Method | Endpoint | Description | Auth | Role | Query Params |
|--------|----------|-------------|------|------|--------------|
| GET | `/api/supervisors` | List all supervisors | Yes | Any | `available`, `department` |
| GET | `/api/supervisors/:id` | Get supervisor by ID | Yes | Any | - |
| PUT | `/api/supervisors/:id` | Update supervisor profile | Yes | Owner/Admin | - |
| GET | `/api/supervisors/:id/applications` | Get supervisor's applications | Yes | Owner/Admin | - |
| GET | `/api/supervisors/:id/projects` | Get supervisor's projects | Yes | Owner/Admin | - |

**Example:**
```typescript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getSupervisors(token, { available: true });
```

## Applications API

| Method | Endpoint | Description | Auth | Role | Body/Params |
|--------|----------|-------------|------|------|-------------|
| GET | `/api/applications` | List all applications | Yes | Any | Query: `studentId`, `supervisorId`, `status` |
| POST | `/api/applications` | Create new application | Yes | Student | Body: `supervisorId`, `proposedTitle`, `description` |
| GET | `/api/applications/:id` | Get application by ID | Yes | Student/Supervisor | - |
| PUT | `/api/applications/:id` | Update application | Yes | Owner | Body: Partial application data |
| DELETE | `/api/applications/:id` | Delete application | Yes | Owner | - |
| PATCH | `/api/applications/:id/status` | Update application status | Yes | Supervisor | Body: `status`, `feedback` |

**Example:**
```typescript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.createApplication(token, {
  supervisorId: 'sup-123',
  proposedTitle: 'AI Project',
  description: 'Machine learning research'
});
```

## Students API

| Method | Endpoint | Description | Auth | Role | Query Params |
|--------|----------|-------------|------|------|--------------|
| GET | `/api/students` | List all students | Yes | Any | - |
| GET | `/api/students/:id` | Get student by ID | Yes | Any | - |
| PUT | `/api/students/:id` | Update student profile | Yes | Owner/Admin | - |
| GET | `/api/students/unmatched` | Get unmatched students | Yes | Admin | - |

**Example:**
```typescript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getStudents(token);
```

## Projects API

| Method | Endpoint | Description | Auth | Role | Body |
|--------|----------|-------------|------|------|------|
| GET | `/api/projects` | List all projects | Yes | Any | - |
| POST | `/api/projects` | Create new project | Yes | Supervisor/Admin | Body: `studentId`, `supervisorId`, `title`, `description` |
| GET | `/api/projects/:id` | Get project by ID | Yes | Any | - |

**Example:**
```typescript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getProjects(token);
```

## Users API

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/users` | List all users | Yes | Admin |
| GET | `/api/users/:id` | Get user by ID | Yes | Owner/Admin |
| PUT | `/api/users/:id` | Update user profile | Yes | Owner/Admin |

**Example:**
```typescript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getUserById(token, userId);
```

## Admin API

| Method | Endpoint | Description | Auth | Role | Response |
|--------|----------|-------------|------|------|----------|
| GET | `/api/admin/stats` | Get system statistics | Yes | Admin | Dashboard stats |
| GET | `/api/admin/reports` | Get system reports | Yes | Admin | Detailed reports |

**Example:**
```typescript
const token = await auth.currentUser?.getIdToken();
const response = await apiClient.getAdminStats(token);
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error |

## Application Status Values

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `pending` | Awaiting review | System (on create) |
| `under_review` | Being reviewed | Supervisor |
| `accepted` | Application accepted | Supervisor |
| `rejected` | Application rejected | Supervisor |
| `withdrawn` | Withdrawn by student | Student |

## API Client Usage

The project provides a type-safe API client in `lib/api/client.ts`:

### Import
```typescript
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
```

### Get Token
```typescript
const token = await auth.currentUser?.getIdToken();
if (!token) {
  // Handle unauthenticated state
  return;
}
```

### Make Request
```typescript
// GET request
const supervisors = await apiClient.getSupervisors(token, { available: true });

// POST request
const application = await apiClient.createApplication(token, {
  supervisorId: 'sup-123',
  proposedTitle: 'Project Title',
  description: 'Project Description'
});

// PUT request
const updated = await apiClient.updateStudent(token, userId, {
  academicInfo: { major: 'Computer Science' }
});

// DELETE request
const deleted = await apiClient.deleteApplication(token, applicationId);
```

### Handle Response
```typescript
if (response.success) {
  console.log('Data:', response.data);
} else {
  console.error('Error:', response.error);
}
```

## Common Query Patterns

### Filter Supervisors
```typescript
// Available supervisors
GET /api/supervisors?available=true

// By department
GET /api/supervisors?department=Computer Science

// Combined
GET /api/supervisors?available=true&department=Computer Science
```

### Filter Applications
```typescript
// By student
GET /api/applications?studentId=student-123

// By supervisor
GET /api/applications?supervisorId=supervisor-456

// By status
GET /api/applications?status=pending

// Combined
GET /api/applications?supervisorId=sup-456&status=pending
```

### Get Related Data
```typescript
// Supervisor's applications
GET /api/supervisors/:id/applications

// Supervisor's projects
GET /api/supervisors/:id/projects

// Unmatched students (admin only)
GET /api/students/unmatched
```

## Middleware

All API routes use middleware for:

### 1. Authentication (`verifyAuth`)
```typescript
const user = await verifyAuth(request);
if (!user) {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Authorization (`requireRole`)
```typescript
const user = await verifyAuth(request);
if (!requireRole(user, ['admin', 'supervisor'])) {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
}
```

### 3. Validation (`validateRequest`)
```typescript
const validationResult = await validateRequest(ApplicationCreateSchema, request);
if (!validationResult.success) {
  return NextResponse.json(
    { success: false, error: validationResult.error },
    { status: 400 }
  );
}
```

### 4. Error Handling (`handleError`)
```typescript
try {
  // Route logic
} catch (error) {
  return handleError(error);
}
```

## Validation Schemas

Located in `lib/middleware/validation.ts` using Zod:

```typescript
// Application creation
ApplicationCreateSchema = {
  supervisorId: string,
  proposedTitle: string (min 5, max 200),
  description: string (min 20),
  studentSkills: string[] (optional),
  preferredStartDate: string (optional)
}

// Application update
ApplicationUpdateSchema = Partial<ApplicationCreateSchema>

// Status update
ApplicationStatusUpdateSchema = {
  status: enum ['pending', 'under_review', 'accepted', 'rejected', 'withdrawn'],
  feedback: string (optional)
}
```

## Rate Limiting

Currently: No rate limiting implemented

Future considerations:
- Implement rate limiting for production
- Firebase Auth has built-in rate limiting for auth operations
- Consider API Gateway for additional protection

## Testing

All endpoints have comprehensive tests (111+ tests total):

- Unit tests: `lib/middleware/__tests__/`
- Integration tests: `app/api/__tests__/`
- API client tests: `lib/api/__tests__/client.test.ts`

## Related Documentation

- Full API Docs: `/docs/architecture/backend/api-reference.md`
- Architecture: `/docs/architecture/overview.md`
- Type System: `/docs/guides/type-system.md`
- Testing: `/docs/guides/testing-strategy.md`

---

**Total Endpoints**: 20+  
**Test Coverage**: 111+ tests, all passing  
**Authentication**: Firebase ID Token (Bearer)  
**Authorization**: Role-based per endpoint

