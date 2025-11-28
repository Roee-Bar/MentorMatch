# Firebase Usage Reference

This document provides comprehensive Firebase patterns, best practices, and reference for the MentorMatch project.

## Overview

MentorMatch uses Firebase as its backend infrastructure, providing authentication, database, and file storage services through a service layer abstraction pattern.

### Firebase Services

- **Firebase Authentication** - User authentication and session management
- **Cloud Firestore** - NoSQL database for application data
- **Firebase Storage** - File storage for profile photos
- **Firebase Admin SDK** - Server-side operations with elevated privileges (used in API routes)

### Why Firebase?

- Rapid development with ready-made solutions
- Real-time data synchronization capabilities
- Automatic scaling with application growth
- Built-in security rules and authentication
- Seamless Next.js integration
- Cost-effective for academic projects (generous free tier)

## Service Architecture Pattern

The project uses a **service layer pattern** to abstract Firebase operations, located in `lib/services/firebase-services.ts`.

### Why a Service Layer?

Instead of calling Firebase SDK directly from components, all Firebase operations go through service functions:

**Benefits**:
1. **Testability**: Services can be mocked at the module level for unit testing
2. **Maintainability**: All Firebase logic centralized in one location
3. **Separation of Concerns**: Components focus on UI, services handle data
4. **Type Safety**: Services use TypeScript interfaces from `types/database.ts`
5. **Consistent Error Handling**: Standardized error handling across operations

### Service Modules

- **UserService** - User profile operations
- **StudentService** - Student-specific operations
- **SupervisorService** - Supervisor operations
- **ApplicationService** - Application CRUD operations
- **ProjectService** - Project management
- **AdminService** - Admin dashboard operations

### Error Handling Pattern

All service functions follow this consistent pattern:

```typescript
async getUser(userId: string): Promise<BaseUser | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null; // Return safe default
  }
}
```

**Key principles**:
- Wrap Firebase operations in try-catch blocks
- Log errors with `console.error` for debugging
- Return safe defaults (`null` for single items, `[]` for arrays, `false` for booleans)
- Never throw errors from service functions - let components handle null/empty cases

## Authentication

Authentication functions are in `lib/auth.ts`.

### Key Functions

- `signUp(email, password, userData)` - Create new user account
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `getUserProfile(userId)` - Fetch user profile from Firestore
- `onAuthChange(callback)` - Listen for authentication state changes

### Registration Flow

1. Create Firebase Auth account with email and password
2. Upload photo to Firebase Storage (if provided)
3. Create base user document in `users` collection
4. Create detailed profile in role-specific collection (`students` or `supervisors`)

```typescript
// Example registration flow
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const userId = userCredential.user.uid;

// Upload photo (non-critical)
let photoURL = '';
try {
  if (photoFile) {
    photoURL = await uploadProfilePhoto(userId, photoFile);
  }
} catch (error) {
  console.error('Photo upload failed, continuing without photo:', error);
}

// Create user documents atomically using batch
const batch = writeBatch(db);
batch.set(doc(db, 'users', userId), userData);
batch.set(doc(db, 'students', userId), studentData);
await batch.commit();
```

### Authentication Best Practices

1. **Always Create Firestore User Document**: After creating Auth account, immediately create corresponding Firestore document
2. **Handle Auth Errors Gracefully**: Provide user-friendly messages for common errors
3. **Use Auth State Listeners**: Use `onAuthStateChanged` for real-time state updates
4. **Validate Passwords Client-Side**: Check password strength before sending to Firebase
5. **Handle Specific Error Codes**: 
   - `auth/email-already-in-use`
   - `auth/invalid-email`
   - `auth/weak-password`
   - `auth/user-not-found`
   - `auth/wrong-password`

## Firestore Database Operations

### Collections Structure

```
Firestore Database
├── users/                  # Base user profiles
│   └── {userId}           # email, name, role, department
├── students/              # Student details
│   └── {userId}           # academic info, skills, match status
├── supervisors/           # Supervisor profiles
│   └── {userId}           # expertise, capacity, availability
├── applications/          # Project applications
│   └── {applicationId}    # status, feedback, timestamps
├── projects/              # Active projects
│   └── {projectId}        # participants, status, phase
└── admins/                # Admin profiles
    └── {userId}           # permissions, role
```

### Basic Operations

#### Reading Documents

```typescript
// Single document
async getUser(userId: string): Promise<BaseUser | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Query collection
async getAllStudents(): Promise<Student[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'students'));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id, // Always include document ID
      ...doc.data(),
    })) as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}
```

#### Writing Documents

```typescript
// Create document
async createStudent(studentData: Omit<Student, 'id'>): Promise<boolean> {
  try {
    await setDoc(doc(db, 'students', studentData.userId), studentData);
    return true;
  } catch (error) {
    console.error('Error creating student:', error);
    return false;
  }
}

// Update document
async updateStudent(userId: string, updates: Partial<Student>): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'students', userId), updates);
    return true;
  } catch (error) {
    console.error('Error updating student:', error);
    return false;
  }
}

// Delete document
async deleteStudent(userId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'students', userId));
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    return false;
  }
}
```

#### Querying with Filters

```typescript
// Query with filters
async getAvailableSupervisors(): Promise<Supervisor[]> {
  try {
    const q = query(
      collection(db, 'supervisors'),
      where('isActive', '==', true),
      where('isAvailable', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Supervisor[];
  } catch (error) {
    console.error('Error fetching available supervisors:', error);
    return [];
  }
}
```

### Batch Operations and Transactions

#### Batch Writes

Use batch writes when you need to perform multiple write operations atomically (all succeed or all fail):

```typescript
import { writeBatch, doc } from 'firebase/firestore';

async registerUser(userData, roleData): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    
    // Add multiple operations to the batch
    batch.set(doc(db, 'users', userId), userData);
    batch.set(doc(db, 'students', userId), roleData);
    
    // Commit all operations atomically
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error in batch operation:', error);
    return false;
  }
}
```

**When to use batch writes**:
- Creating related documents together (e.g., user registration)
- Deleting multiple documents at once
- Updating multiple documents that don't depend on each other
- Limit: 500 operations per batch

#### Transactions

Use transactions when you need to read data before writing, or when operations depend on each other:

```typescript
import { runTransaction } from 'firebase/firestore';

async assignStudent(supervisorId: string, applicationId: string): Promise<boolean> {
  try {
    await runTransaction(db, async (transaction) => {
      const supervisorDoc = await transaction.get(doc(db, 'supervisors', supervisorId));
      
      if (!supervisorDoc.exists()) {
        throw new Error('Supervisor not found');
      }
      
      const currentCapacity = supervisorDoc.data().currentCapacity;
      const maxCapacity = supervisorDoc.data().maxCapacity;
      
      if (currentCapacity >= maxCapacity) {
        throw new Error('Supervisor at capacity');
      }
      
      // Update based on current value
      transaction.update(doc(db, 'supervisors', supervisorId), {
        currentCapacity: currentCapacity + 1
      });
      
      transaction.update(doc(db, 'applications', applicationId), {
        status: 'accepted'
      });
    });
    return true;
  } catch (error) {
    console.error('Error in transaction:', error);
    return false;
  }
}
```

**When to use transactions**:
- Reading data and then updating based on that data
- Ensuring data consistency across related documents
- Implementing counters or quotas
- Limit: 500 operations per transaction

### Pagination

For collections that may grow large, implement pagination:

```typescript
async getStudentsPaginated(
  pageSize: number = 20,
  lastDoc?: any
): Promise<{ students: Student[], lastVisible: any, hasMore: boolean }> {
  try {
    let q = query(
      collection(db, 'students'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // Fetch one extra to check if there's more
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const students = querySnapshot.docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
    
    const hasMore = querySnapshot.docs.length > pageSize;
    const lastVisible = hasMore ? querySnapshot.docs[pageSize - 1] : null;
    
    return { students, lastVisible, hasMore };
  } catch (error) {
    console.error('Error fetching paginated students:', error);
    return { students: [], lastVisible: null, hasMore: false };
  }
}
```

### Real-time Listeners

Firestore supports real-time data synchronization using snapshot listeners:

```typescript
import { onSnapshot } from 'firebase/firestore';

// Subscribe to application updates
subscribeToApplications(
  studentId: string,
  callback: (applications: Application[]) => void
): () => void {
  const q = query(
    collection(db, 'applications'),
    where('studentId', '==', studentId)
  );
  
  // Returns unsubscribe function
  return onSnapshot(
    q,
    (snapshot) => {
      const applications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateApplied: doc.data().dateApplied?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as Application[];
      callback(applications);
    },
    (error) => {
      console.error('Error in applications subscription:', error);
      callback([]);
    }
  );
}
```

**Usage in React components**:

```typescript
useEffect(() => {
  const unsubscribe = ApplicationService.subscribeToApplications(
    userId,
    (applications) => setApplications(applications)
  );
  
  return () => unsubscribe(); // Cleanup on unmount
}, [userId]);
```

**When to use real-time listeners**:
- Dashboard data that updates frequently
- Application status changes
- Notifications and alerts
- Collaborative features

**Important**: Always unsubscribe from listeners when component unmounts to prevent memory leaks.

## Firebase Storage

Firebase Storage is used for storing user profile photos.

### File Organization

Files are organized as: `profile-photos/{userId}/{timestamp}.{extension}`

### Upload Pattern

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async uploadProfilePhoto(userId: string, file: File): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const storageRef = ref(storage, `profile-photos/${userId}/${timestamp}.${fileExtension}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
}
```

### Storage Best Practices

1. **Use User-Specific Folders**: Organize files by user ID to prevent conflicts
2. **Include Timestamps in Filenames**: Prevent filename conflicts and enable versioning
3. **Handle Upload Errors Gracefully**: Wrap upload operations in try-catch
4. **Validate File Types and Sizes**: Check file type and size before uploading
5. **Store Download URLs in Firestore**: Save the download URL in the user's document
6. **Make Uploads Non-Critical**: Don't fail entire operations if upload fails

## Best Practices

### 1. Service Layer Pattern

**Always use service functions, never direct Firebase calls in components.**

This abstraction enables testing, maintains consistency, and centralizes Firebase logic.

### 2. Error Handling

**Consistent try-catch with safe defaults:**

- Always wrap Firebase operations in try-catch
- Log errors with `console.error` for debugging
- Return safe defaults (`null`, `[]`, `false`)
- Never throw errors from service functions

### 3. Type Safety

**Use TypeScript interfaces for all data operations:**

```typescript
import { BaseUser, Student, Supervisor, Application } from '@/types/database';
```

Benefits:
- Compile-time type checking
- IntelliSense support
- Self-documenting code
- Prevents type-related bugs

### 4. Document IDs

**Always include document IDs in query results:**

```typescript
// GOOD
return querySnapshot.docs.map((doc) => ({
  id: doc.id, // Always include this
  ...doc.data(),
})) as BaseUser[];

// BAD - Missing document ID
return querySnapshot.docs.map((doc) => ({
  ...doc.data(),
})) as BaseUser[];
```

### 5. Atomic Operations

**Use batch writes for related document operations:**

```typescript
// Creating user and role-specific profile together
const batch = writeBatch(db);
batch.set(doc(db, 'users', userId), userData);
batch.set(doc(db, 'students', userId), studentData);
await batch.commit();
```

### 6. Timestamps

**Always include timestamps on documents:**

```typescript
{
  createdAt: new Date(),
  updatedAt: new Date(),
  ...otherData
}
```

Firestore automatically converts JavaScript `Date` objects to Firestore `Timestamp` type.

### 7. Pagination

**Implement pagination for all list operations:**

Don't fetch entire collections - use `limit()` and `startAfter()` for better performance as data grows.

### 8. Configuration Validation

**Validate Firebase configuration before initialization:**

```typescript
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  // ... other required vars
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`);
}
```

## Testing with Firebase

Tests mock Firebase services to avoid actual database calls. See [guides/testing-strategy.md](../guides/testing-strategy.md) for details.

**Mocking Pattern**:
- Mock Firebase services (`@/lib/services`) at the module level
- Mock Firebase Auth (`@/lib/auth`) for authentication state
- Use mock data fixtures that match service return types
- Reset mocks in `beforeEach` to ensure test isolation

**Example**:

```typescript
import { UserService } from '@/lib/services';

jest.mock('@/lib/services', () => ({
  UserService: {
    getUserById: jest.fn(),
    // ... other methods
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (UserService.getUserById as jest.Mock).mockResolvedValue(mockUserData);
});
```

## Security Considerations

### Environment Variables

- **NEVER** commit `.env.local` to git (already in `.gitignore`)
- **NEVER** expose Firebase Admin credentials client-side
- All client credentials should have `NEXT_PUBLIC_` prefix
- Admin credentials should NEVER have the `NEXT_PUBLIC_` prefix

### Firestore Security Rules

**Status**: Security rules need to be implemented before production.

See [guides/security.md](../guides/security.md) for complete security documentation including:
- Firestore security rules
- Storage security rules
- Composite indexes
- Authentication best practices

## Performance Optimization

### 1. Specific Queries

Query only the data you need - don't fetch entire collections.

### 2. Pagination

Use pagination with `limit()` and `startAfter()` for large collections.

### 3. Indexes

Create composite indexes for queries with multiple `where` clauses.

### 4. Offline Persistence

Enable offline persistence for better performance:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence');
    }
  });
}
```

### 5. Field Selection

Use `select()` to fetch only needed fields:

```typescript
const q = query(
  collection(db, 'users'),
  select('name', 'email') // Only fetch these fields
);
```

### 6. Connection Monitoring

Monitor network connection state for better UX:

```typescript
function monitorConnection(callback: (isOnline: boolean) => void) {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
    callback(navigator.onLine);
  }
}
```

## Troubleshooting

### Common Issues

**Firebase Not Initialized**
- Symptoms: "Firebase: No Firebase App '[DEFAULT]' has been created"
- Solutions: Check environment variables, verify `NEXT_PUBLIC_` prefix, restart dev server

**Permission Denied**
- Symptoms: "Missing or insufficient permissions"
- Solutions: Check Firestore security rules, verify user is authenticated, ensure proper role/permissions

**Queries Failing**
- Symptoms: "The query requires an index"
- Solutions: Check Firebase Console for missing index notifications, create composite indexes

**Storage Upload Errors**
- Symptoms: Upload failures or permission errors
- Solutions: Check file size limits (5MB for free tier), verify file type, check Storage security rules

**Auth Errors**
- Common codes: `auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`
- Solutions: Handle specific error codes with user-friendly messages, validate input client-side

### Debugging Tips

1. Check Firebase Console for database, storage, and authentication logs
2. Use browser console for client-side errors and network requests
3. Verify environment variables: `console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)`
4. Check Network tab in DevTools to see Firebase API calls
5. Enable Firebase debugging: `localStorage.setItem('firebase:debug', '*')`

## Maintenance

### Updating Firebase SDK

1. Check release notes for breaking changes
2. Update dependencies: `npm update firebase` or `npm install firebase@latest`
3. Test all Firebase operations after updating
4. Ensure TypeScript types are compatible
5. Replace deprecated methods

### Monitoring

1. Regularly check Firebase Console for usage and quotas
2. Monitor error logs in Firebase Console
3. Use Firebase Performance Monitoring (if enabled)
4. Track costs if using paid tier features

### Free Tier Limits

- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 document deletes/day
- 1GB storage
- 10GB/month bandwidth

Current usage: Well within limits for academic project.

## Related Documentation

- [Setup Guide](../getting-started/setup-guide.md) - Firebase setup instructions
- [Architecture Overview](../architecture/overview.md) - System architecture
- [API Reference](../architecture/backend/api-reference.md) - Backend API documentation
- [Security](../guides/security.md) - Security architecture and rules
- [Testing Strategy](../guides/testing-strategy.md) - Testing approach
- [Type System](../guides/type-system.md) - TypeScript types and interfaces

## External Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Last Updated**: November 2025

**Project**: MentorMatch - Final Year Project, Braude College of Engineering

