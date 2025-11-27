# Service Layer API Reference

## Overview

The MentorMatch service layer provides a clean abstraction over Firebase operations. All services follow consistent patterns for error handling, data transformation, and return types. This document provides complete API reference for all service modules.

**Location**: `lib/services/firebase-services.ts`

## Service Architecture Principles

### Error Handling Pattern

All service methods follow this pattern:
- Wrap Firebase operations in `try-catch` blocks
- Log errors using `console.error()` for debugging
- Return safe defaults (`null` for single items, `[]` for arrays, `false` for booleans)
- **Never throw exceptions** - let components handle null/empty cases gracefully

### Type Safety

All methods use TypeScript interfaces from `types/database.ts`:
- `BaseUser`, `Student`, `Supervisor`, `Admin`
- `Application`, `Project`
- `SupervisorCardData`, `ApplicationCardData`, `DashboardStats`

### Data Transformation

Services transform Firebase data to application format:
- Convert Firestore Timestamps to JavaScript Date objects
- Transform raw data to UI-friendly formats (e.g., `SupervisorCardData`)
- Add computed fields when needed

## UserService

Handles base user profile operations from the `users` collection.

### `getUserById(userId: string): Promise<BaseUser | null>`

Fetches a user profile by ID from the users collection.

**Parameters**:
- `userId` (string): Firebase Auth user ID

**Returns**: 
- `Promise<BaseUser | null>`: User profile or null if not found/error

**Error Handling**: Returns `null` on error, logs error to console

---

### `getAllUsers(): Promise<BaseUser[]>`

Fetches all users from the users collection.

**Parameters**: None

**Returns**: 
- `Promise<BaseUser[]>`: Array of all users, empty array on error

**Error Handling**: Returns `[]` on error, logs error to console

**Use Cases**: Admin dashboard, user management

---

## StudentService

Handles student-specific operations from the `students` collection.

### `getStudentById(studentId: string): Promise<Student | null>`

Fetches a student profile by ID.

**Parameters**:
- `studentId` (string): User ID (same as Firebase Auth ID)

**Returns**: 
- `Promise<Student | null>`: Student profile or null

---

### `getAllStudents(): Promise<Student[]>`

Fetches all students.

**Parameters**: None

**Returns**: 
- `Promise<Student[]>`: Array of all students

**Use Cases**: Admin dashboard, reporting

---

### `getUnmatchedStudents(): Promise<Student[]>`

Fetches students with `matchStatus === 'unmatched'`.

**Parameters**: None

**Returns**: 
- `Promise<Student[]>`: Array of unmatched students

**Use Cases**: Admin assignment workflow

---

### `updateStudent(studentId: string, data: Partial<Student>): Promise<boolean>`

Updates a student's profile.

**Parameters**:
- `studentId` (string): Student's user ID
- `data` (Partial<Student>): Fields to update

**Returns**: 
- `Promise<boolean>`: `true` on success, `false` on error

**Side Effects**: Automatically sets `updatedAt` to current date

---

## SupervisorService

Handles supervisor operations from the `supervisors` collection.

### `getSupervisorById(supervisorId: string): Promise<Supervisor | null>`

Fetches a supervisor profile by ID.

**Parameters**:
- `supervisorId` (string): Supervisor's user ID

**Returns**: 
- `Promise<Supervisor | null>`: Supervisor profile or null

---

### `getAllSupervisors(): Promise<Supervisor[]>`

Fetches all supervisors.

**Parameters**: None

**Returns**: 
- `Promise<Supervisor[]>`: Array of all supervisors

**Use Cases**: Admin reporting, analytics

---

### `getAvailableSupervisors(): Promise<SupervisorCardData[]>`

Fetches active, approved supervisors and transforms to UI format.

**Parameters**: None

**Returns**: 
- `Promise<SupervisorCardData[]>`: Array of supervisor cards

**Filters**: 
- `isActive === true`
- `isApproved === true`
- `availabilityStatus !== 'unavailable'`

**Data Transformation**: Converts `Supervisor` to `SupervisorCardData` format

**Use Cases**: Student browsing supervisors

---

### `getSupervisorsByDepartment(department: string): Promise<Supervisor[]>`

Fetches active supervisors from a specific department.

**Parameters**:
- `department` (string): Department name (e.g., "Computer Science")

**Returns**: 
- `Promise<Supervisor[]>`: Array of supervisors in department

**Filters**: 
- `department === <parameter>`
- `isActive === true`

---

### `updateSupervisor(supervisorId: string, data: Partial<Supervisor>): Promise<boolean>`

Updates a supervisor's profile.

**Parameters**:
- `supervisorId` (string): Supervisor's user ID
- `data` (Partial<Supervisor>): Fields to update

**Returns**: 
- `Promise<boolean>`: `true` on success, `false` on error

**Side Effects**: Automatically sets `updatedAt` to current date

---

## ApplicationService

Handles application operations from the `applications` collection.

### `getApplicationById(applicationId: string): Promise<Application | null>`

Fetches an application by ID.

**Parameters**:
- `applicationId` (string): Application document ID

**Returns**: 
- `Promise<Application | null>`: Application or null

**Data Transformation**: Converts Firestore Timestamps to JavaScript Dates

---

### `getStudentApplications(studentId: string): Promise<ApplicationCardData[]>`

Fetches all applications submitted by a student.

**Parameters**:
- `studentId` (string): Student's user ID

**Returns**: 
- `Promise<ApplicationCardData[]>`: Array of application cards

**Data Transformation**: Converts to UI-friendly `ApplicationCardData` format

**Use Cases**: Student dashboard

---

### `getSupervisorApplications(supervisorId: string): Promise<Application[]>`

Fetches all applications submitted to a supervisor.

**Parameters**:
- `supervisorId` (string): Supervisor's user ID

**Returns**: 
- `Promise<Application[]>`: Array of applications

**Use Cases**: Supervisor dashboard

---

### `getPendingApplications(supervisorId: string): Promise<Application[]>`

Fetches applications with status 'pending' or 'under_review' for a supervisor.

**Parameters**:
- `supervisorId` (string): Supervisor's user ID

**Returns**: 
- `Promise<Application[]>`: Array of pending applications

**Filters**: 
- `supervisorId === <parameter>`
- `status in ['pending', 'under_review']`

---

### `createApplication(applicationData: Omit<Application, 'id'>): Promise<string | null>`

Creates a new application.

**Parameters**:
- `applicationData` (Omit<Application, 'id'>): Application data without ID

**Returns**: 
- `Promise<string | null>`: New application ID or null on error

**Side Effects**: 
- Automatically sets `dateApplied` to current date
- Automatically sets `lastUpdated` to current date

---

### `updateApplicationStatus(applicationId: string, status: ApplicationStatus, feedback?: string): Promise<boolean>`

Updates an application's status and optional feedback.

**Parameters**:
- `applicationId` (string): Application document ID
- `status` (ApplicationStatus): New status ('pending' | 'under_review' | 'approved' | 'rejected' | 'revision_requested')
- `feedback` (string, optional): Supervisor feedback message

**Returns**: 
- `Promise<boolean>`: `true` on success, `false` on error

**Side Effects**: 
- Sets `lastUpdated` to current date
- If feedback provided, sets `supervisorFeedback`
- If status is 'approved' or 'rejected', sets `responseDate`

---

### `getAllApplications(): Promise<Application[]>`

Fetches all applications (admin use).

**Parameters**: None

**Returns**: 
- `Promise<Application[]>`: Array of all applications

**Use Cases**: Admin dashboard, reporting

---

## ProjectService

Handles project operations from the `projects` collection.

### `getProjectById(projectId: string): Promise<Project | null>`

Fetches a project by ID.

**Parameters**:
- `projectId` (string): Project document ID

**Returns**: 
- `Promise<Project | null>`: Project or null

---

### `getAllProjects(): Promise<Project[]>`

Fetches all projects.

**Parameters**: None

**Returns**: 
- `Promise<Project[]>`: Array of all projects

**Use Cases**: Admin dashboard, reporting

---

### `getSupervisorProjects(supervisorId: string): Promise<Project[]>`

Fetches all projects supervised by a specific supervisor.

**Parameters**:
- `supervisorId` (string): Supervisor's user ID

**Returns**: 
- `Promise<Project[]>`: Array of projects

---

### `createProject(projectData: Omit<Project, 'id'>): Promise<string | null>`

Creates a new project.

**Parameters**:
- `projectData` (Omit<Project, 'id'>): Project data without ID

**Returns**: 
- `Promise<string | null>`: New project ID or null on error

**Side Effects**: 
- Automatically sets `createdAt` to current date
- Automatically sets `updatedAt` to current date

---

### `generateProjectCode(year: number, semester: number, department: string, number: number): string`

Generates a project code following the format: `YEAR-SEMESTER-DEPT-NUM`.

**Parameters**:
- `year` (number): Year (e.g., 25 for 2025)
- `semester` (number): Semester (1 or 2)
- `department` (string): Department name
- `number` (number): Project number

**Returns**: 
- `string`: Formatted project code (e.g., "25-2-C-01")

**Note**: This is a utility function, not async

---

## AdminService

Handles admin operations from the `admins` collection and aggregated data.

### `getAdminById(adminId: string): Promise<Admin | null>`

Fetches an admin profile by ID.

**Parameters**:
- `adminId` (string): Admin's user ID

**Returns**: 
- `Promise<Admin | null>`: Admin profile or null

---

### `getDashboardStats(): Promise<DashboardStats>`

Fetches aggregated statistics for admin dashboard.

**Parameters**: None

**Returns**: 
- `Promise<DashboardStats>`: Statistics object with `totalStudents`, `matchedStudents`, `pendingMatches`, `activeSupervisors`

**Performance**: Uses `Promise.all()` for parallel queries

---

## Testing with Services

### Mocking Services

In tests, mock the entire service module at the module level. Mock services return null/empty arrays/false to simulate errors, or return mock data objects for success cases.

**See**: `docs/testing-strategy.md` for comprehensive testing patterns

---

## Common Patterns

### Pattern 1: Fetch and Display

Fetch data on mount, handle loading and null states.

### Pattern 2: Multiple Parallel Fetches

Use `Promise.all()` to fetch multiple data sources simultaneously for better performance.

### Pattern 3: Update and Refresh

After updating data, optionally refetch to get the latest state from the database.

### Pattern 4: Error Handling

Always check for null/empty returns and set appropriate error states for user feedback.

---

## Best Practices

### Do's

1. **Always check for null/empty returns** - Services return null on errors, check before using data
2. **Use parallel fetching when possible** - Use `Promise.all()` for independent queries
3. **Transform data in components if needed** - Apply sorting, filtering, or formatting in the UI layer

### Don'ts

1. **Don't call Firebase SDK directly from components** - Always use service layer
2. **Don't ignore error cases** - Check for null returns before accessing properties
3. **Don't throw errors from service methods** - Services return safe defaults, components handle nulls

---

## Related Documentation

- `docs/firebase-usage.md` - Firebase integration details
- `docs/type-system.md` - TypeScript type definitions
- `docs/testing-strategy.md` - Testing patterns and mocking
- `docs/development-process.md` - Migration from mock data
- `docs/system-architecture.md` - Overall system architecture

## File Reference

**Service Implementation**: `lib/services/firebase-services.ts`
**Type Definitions**: `types/database.ts`
**Service Tests**: `lib/services/__tests__/firebase-services.test.ts`

