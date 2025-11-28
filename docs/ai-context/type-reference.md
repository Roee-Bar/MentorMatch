# Type Reference (AI-Optimized)

Quick reference for core TypeScript types and interfaces used throughout the MentorMatch project.

## Type Files Location

```
types/
├── database.ts    # Firestore data types
├── user.ts        # User types
├── dashboard.ts   # Dashboard types
└── index.ts       # Type exports
```

## User Types

### BaseUser
Base user profile stored in `users` collection.

```typescript
interface BaseUser {
  email: string;
  name: string;
  role: 'student' | 'supervisor' | 'admin';
  photoURL?: string;
  department?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

### UserRole
```typescript
type UserRole = 'student' | 'supervisor' | 'admin';
```

## Student Type

Stored in `students` collection (document ID = userId).

```typescript
interface Student {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  studentId: string;              // Student ID number
  phone: string;
  department: string;
  academicYear: '3rd Year' | '4th Year' | 'Graduate';
  photoURL?: string;
  
  // Academic Information
  skills: string;                  // Comma-separated skills
  interests: string;
  previousProjects?: string;
  preferredTopics?: string;
  
  // Partner Information
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
  
  // Status
  profileComplete: boolean;
  matchStatus: 'unmatched' | 'pending' | 'matched';
  assignedSupervisorId?: string;
  assignedProjectId?: string;
  
  // Timestamps
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Match Status Values:**
- `unmatched` - No supervisor assigned
- `pending` - Application pending approval
- `matched` - Assigned to supervisor

## Supervisor Type

Stored in `supervisors` collection (document ID = userId).

```typescript
interface Supervisor {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  title: string;                   // Dr., Prof., etc.
  photoURL?: string;
  
  // Professional Information
  bio: string;
  researchInterests: string[];     // Array of research areas
  expertiseAreas: string[];        // Array of expertise
  officeLocation?: string;
  officeHours?: string;
  
  // Capacity Management
  maxCapacity: number;             // Maximum projects can supervise
  currentCapacity: number;         // Current number of projects
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  
  // Project Topics
  suggestedTopics?: ProjectTopic[];
  
  // Notification Preferences
  notificationPreference: 'immediate' | 'daily' | 'custom';
  notificationHour?: number;       // Hour of day (0-23)
  
  // Status
  isApproved: boolean;             // Admin approval status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Availability Status Values:**
- `available` - Accepting new students (currentCapacity < maxCapacity)
- `limited` - Near capacity
- `unavailable` - At capacity or inactive

## Admin Type

Stored in `admins` collection (document ID = userId).

```typescript
interface Admin {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  photoURL?: string;
  
  // Admin Role
  adminRole: 'project_coordinator' | 'department_secretary' | 'system_admin';
  permissions: AdminPermission[];
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

type AdminPermission = 
  | 'manage_users'
  | 'manage_supervisors'
  | 'manage_students'
  | 'manage_projects'
  | 'view_reports'
  | 'export_data'
  | 'import_data'
  | 'system_settings';
```

## Application Type

Stored in `applications` collection (auto-generated ID).

```typescript
interface Application {
  id: string;
  
  // Participants
  studentId: string;
  studentName: string;
  studentEmail: string;
  supervisorId: string;
  supervisorName: string;
  
  // Project Details
  projectTitle: string;
  projectDescription: string;
  proposedTopicId?: string;        // If selecting from supervisor's topics
  isOwnTopic: boolean;             // Student proposed own topic
  
  // Student Information (snapshot at time of application)
  studentSkills: string;
  studentInterests: string;
  
  // Partner Information
  hasPartner: boolean;
  partnerName?: string;
  partnerEmail?: string;
  
  // Status
  status: ApplicationStatus;
  
  // Feedback
  supervisorFeedback?: string;
  
  // Timestamps
  dateApplied: Date;
  lastUpdated: Date;
  responseDate?: Date;
  
  // Display
  responseTime?: string;           // Calculated field
}

type ApplicationStatus = 
  | 'pending' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'revision_requested';
```

## Project Type

Stored in `projects` collection (auto-generated ID).

```typescript
interface Project {
  id: string;
  projectCode: string;             // e.g., "25-2-D-01"
  
  // Participants
  studentIds: string[];            // Can have multiple students
  studentNames: string[];
  supervisorId: string;
  supervisorName: string;
  coSupervisorId?: string;
  coSupervisorName?: string;
  
  // Project Details
  title: string;
  description: string;
  
  // Status
  status: 'pending_approval' | 'approved' | 'in_progress' | 'completed';
  phase: 'A' | 'B';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
}
```

## Helper Types for UI

### ProjectTopic
```typescript
interface ProjectTopic {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isAvailable: boolean;
}
```

### SupervisorCardData
Transformed data for supervisor cards in UI.

```typescript
interface SupervisorCardData {
  id: string;
  name: string;
  department: string;
  bio: string;
  expertiseAreas: string[];
  researchInterests: string[];
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  currentCapacity: string;         // e.g., "2/5 projects"
  contact: string;
}
```

### ApplicationCardData
Transformed data for application cards in UI.

```typescript
interface ApplicationCardData {
  id: string;
  projectTitle: string;
  projectDescription: string;
  supervisorName: string;
  dateApplied: string;             // Formatted date string
  status: ApplicationStatus;
  responseTime: string;            // e.g., "2 days ago"
  comments?: string;
}
```

### DashboardStats
Statistics for dashboard displays.

```typescript
interface DashboardStats {
  totalStudents: number;
  matchedStudents: number;
  pendingMatches: number;
  activeSupervisors: number;
}
```

## Type Usage Patterns

### In Services
```typescript
import { BaseUser, Student, Supervisor, Application } from '@/types/database';

async function getUser(userId: string): Promise<BaseUser | null> {
  // Service implementation
}
```

### In Components
```typescript
import { Application, ApplicationStatus } from '@/types/database';

interface Props {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}
```

### In API Routes
```typescript
import { NextResponse } from 'next/server';
import { Supervisor } from '@/types/database';

export async function GET(request: Request) {
  const supervisors: Supervisor[] = await getSupervisors();
  return NextResponse.json({ success: true, data: supervisors });
}
```

## Type Transformations

### Firestore to Application Type
```typescript
const application: Application = {
  id: doc.id,
  ...doc.data(),
  dateApplied: doc.data().dateApplied?.toDate(),
  lastUpdated: doc.data().lastUpdated?.toDate(),
  responseDate: doc.data().responseDate?.toDate(),
};
```

### Application to ApplicationCardData
```typescript
const cardData: ApplicationCardData = {
  id: application.id,
  projectTitle: application.projectTitle,
  projectDescription: application.projectDescription,
  supervisorName: application.supervisorName,
  dateApplied: formatDate(application.dateApplied),
  status: application.status,
  responseTime: calculateResponseTime(application.dateApplied),
  comments: application.supervisorFeedback,
};
```

## Validation Schemas (Zod)

Located in `lib/middleware/validation.ts`:

### ApplicationCreateSchema
```typescript
{
  supervisorId: string,
  proposedTitle: string (min: 5, max: 200),
  description: string (min: 20),
  studentSkills: string[] (optional),
  preferredStartDate: string (optional)
}
```

### ApplicationUpdateSchema
```typescript
Partial<ApplicationCreateSchema>
```

### ApplicationStatusUpdateSchema
```typescript
{
  status: enum ApplicationStatus,
  feedback: string (optional)
}
```

## Type Guards

Useful type guards for runtime checks:

```typescript
function isStudent(user: BaseUser): user is Student {
  return user.role === 'student';
}

function isSupervisor(user: BaseUser): user is Supervisor {
  return user.role === 'supervisor';
}

function isAdmin(user: BaseUser): user is Admin {
  return user.role === 'admin';
}
```

## Firestore Collection Structure

| Collection | Document ID | Type | Purpose |
|------------|-------------|------|---------|
| `users` | userId | BaseUser | Base user profiles |
| `students` | userId | Student | Student details |
| `supervisors` | userId | Supervisor | Supervisor profiles |
| `applications` | auto-generated | Application | Applications |
| `projects` | auto-generated | Project | Active projects |
| `admins` | userId | Admin | Admin profiles |

## Date Handling

**Firestore to JavaScript:**
```typescript
// Firestore Timestamp → JavaScript Date
const date = firestoreTimestamp.toDate();
```

**JavaScript to Firestore:**
```typescript
// JavaScript Date → Firestore Timestamp (automatic)
const data = {
  createdAt: new Date(),  // Firestore converts automatically
};
```

**Date Formatting:**
```typescript
// For display
const formatted = date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
```

## Common Type Patterns

### Optional Fields
```typescript
interface Example {
  required: string;
  optional?: string;          // May be undefined
  nullable: string | null;    // May be null
}
```

### Union Types
```typescript
type Status = 'active' | 'inactive' | 'pending';
type Role = 'student' | 'supervisor' | 'admin';
```

### Array Types
```typescript
interface Example {
  items: string[];           // Array of strings
  users: BaseUser[];         // Array of objects
}
```

### Partial Types
```typescript
type PartialStudent = Partial<Student>;  // All fields optional
type StudentUpdate = Omit<Student, 'id'>;  // Exclude id field
type StudentCreate = Pick<Student, 'firstName' | 'lastName'>;  // Only these fields
```

## Import Patterns

```typescript
// Import specific types
import { BaseUser, Student } from '@/types/database';

// Import all types
import * as Types from '@/types/database';

// Import type and value
import { ApplicationStatus } from '@/types/database';
import type { Application } from '@/types/database';
```

## Type Safety Tips

1. **Always type function parameters and return values**
   ```typescript
   function getUser(id: string): Promise<BaseUser | null>
   ```

2. **Use type assertions sparingly**
   ```typescript
   const user = data as BaseUser;  // Only when absolutely necessary
   ```

3. **Prefer interfaces over types for objects**
   ```typescript
   interface User { }  // Better for objects
   type Status = 'active' | 'inactive';  // Better for unions
   ```

4. **Use const assertions for literal types**
   ```typescript
   const roles = ['student', 'supervisor', 'admin'] as const;
   ```

## Related Documentation

- Type System Guide: `/docs/guides/type-system.md`
- Code Conventions: `/docs/guides/code-conventions.md`
- API Reference: `/docs/architecture/backend/api-reference.md`
- Firebase Usage: `/docs/reference/firebase-usage.md`

---

**Location**: `types/` directory  
**Total Types**: 10+ interfaces, 5+ type aliases  
**Validation**: Zod schemas in `lib/middleware/validation.ts`

