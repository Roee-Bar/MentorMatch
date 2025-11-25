# Firebase Usage Documentation

This document provides a guide to using Firebase in the MentorMatch project. It covers configuration, service architecture, authentication, database operations, storage, best practices, and maintenance.

## Overview

MentorMatch uses Firebase as its backend infrastructure, providing authentication, database, and file storage services.

### Firebase Services Used

1. **Firebase Authentication** - User authentication and session management
2. **Cloud Firestore** - NoSQL database for storing application data
3. **Firebase Storage** - File storage for user profile photos

### Why Firebase?

- **Rapid Development**: Ready-made authentication and database solutions
- **Real-time Capabilities**: Firestore supports real-time data synchronization
- **Scalability**: Automatically scales with application growth
- **Security**: Built-in security rules and authentication mechanisms
- **Next.js Integration**: Seamless integration with Next.js applications
- **Cost-Effective**: Generous free tier suitable for academic projects

### Architecture Overview

The project uses a **service layer pattern** to abstract Firebase operations, providing:
- **Testability**: Services can be easily mocked for testing
- **Maintainability**: Centralized Firebase logic in service modules
- **Separation of Concerns**: Components don't directly interact with Firebase SDK
- **Type Safety**: TypeScript interfaces ensure type-safe data operations

For migration history, see `docs/development-process.md`.

## Configuration & Setup

### Environment Variables

Set these variables in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Important**: All Firebase environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Firebase Initialization

Firebase is initialized in `lib/firebase.ts` using a singleton pattern:

```1:20:lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

The singleton pattern (`getApps().length === 0`) ensures Firebase is only initialized once, even if the module is imported multiple times.

## Service Architecture Pattern

### Why a Service Layer?

Instead of calling Firebase SDK directly from components, the project uses a service layer abstraction (`lib/services/firebase-services.ts`). Benefits:

1. **Testability**: Services can be mocked at the module level for unit testing
2. **Maintainability**: All Firebase logic is centralized in one location
3. **Separation of Concerns**: Components focus on UI, services handle data operations
4. **Type Safety**: Services use TypeScript interfaces from `types/database.ts`
5. **Error Handling**: Consistent error handling patterns across all operations

### Service Modules

- **`UserService`** - User profile operations
- **`StudentService`** - Student-specific operations
- **`SupervisorService`** - Supervisor operations
- **`ApplicationService`** - Application CRUD operations
- **`ProjectService`** - Project management
- **`AdminService`** - Admin dashboard operations

### Error Handling Pattern

All service functions follow this pattern:
- Wrap Firebase operations in try-catch blocks
- Log errors with `console.error` for debugging
- Return safe defaults (`null` for single items, `[]` for arrays, `false` for booleans)
- Never throw errors from service functions - let components handle the null/empty cases

### Type Safety

All service functions use TypeScript interfaces from `types/database.ts`: `BaseUser`, `Student`, `Supervisor`, `Application`, `Project`, `Admin`. This ensures type safety and provides IntelliSense support.

## Authentication (Firebase Auth)

Authentication functions are located in `lib/auth.ts`: `signUp()`, `signIn()`, `signOut()`, `getUserProfile()`, `onAuthChange()`.

### Registration Flow

The registration process (from `app/register/page.tsx`) follows these steps:

1. Create Firebase Auth account with email and password
2. Upload photo to Firebase Storage (if provided)
3. Create base user document in `users` collection
4. Create detailed profile in role-specific collection (e.g., `students`)

### Authentication Best Practices

1. **Always Create Firestore User Document**: After creating an Auth account, immediately create a corresponding user document in Firestore
2. **Handle Auth Errors Gracefully**: Provide user-friendly error messages for common errors
3. **Use Auth State Listeners**: Use `onAuthStateChanged` for real-time authentication state updates
4. **Validate Passwords Client-Side**: Check password strength before sending to Firebase
5. **Error Code Handling**: Handle specific Firebase Auth error codes (`auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`, etc.)

## Firestore Database Operations

### Collections Structure

- **`users`** - Base user profiles (email, name, role, department)
- **`students`** - Student-specific data (academic info, skills, match status)
- **`supervisors`** - Supervisor profiles (expertise, capacity, availability)
- **`applications`** - Project applications (status, feedback, timestamps)
- **`projects`** - Active projects (participants, status, phase)
- **`admins`** - Admin profiles (permissions, role)

For detailed data models, see `types/database.ts` and `docs/dashboard-architecture.md`.

### Firestore Best Practices

1. **Use TypeScript Types**: Always use interfaces from `types/database.ts` for type safety
2. **Check Document Existence**: Always verify `doc.exists()` before accessing document data
3. **Use Transactions**: Use Firestore transactions for multi-document operations
4. **Index Queries Properly**: Create composite indexes in Firebase Console for queries with multiple `where` clauses
5. **Use Timestamp for Dates**: Use `new Date()` for date fields - Firestore automatically converts to Timestamp
6. **Return Safe Defaults**: Return `null` or empty arrays on errors, don't throw exceptions
7. **Transform Data When Needed**: Transform Firestore data to match UI component requirements
8. **Always Include Document IDs**: When mapping query results, always include `doc.id` in the returned objects
9. **Use Batch Writes for Multi-Document Operations**: Use `writeBatch()` for atomic operations on multiple documents
10. **Implement Pagination**: Use `limit()` and `startAfter()` for large collections to avoid performance issues

### Batch Operations and Transactions

Firestore supports batch writes and transactions for atomic multi-document operations.

#### Batch Writes

Use batch writes when you need to perform multiple write operations atomically (all succeed or all fail):

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);

// Add multiple operations to the batch
batch.set(doc(db, 'users', userId), userData);
batch.set(doc(db, 'students', userId), studentData);
batch.update(doc(db, 'stats', 'global'), { totalStudents: increment(1) });

// Commit all operations atomically
await batch.commit();
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

await runTransaction(db, async (transaction) => {
  const supervisorDoc = await transaction.get(doc(db, 'supervisors', supervisorId));
  
  if (!supervisorDoc.exists()) {
    throw new Error('Supervisor not found');
  }
  
  const currentCapacity = supervisorDoc.data().currentCapacity;
  
  // Update based on current value
  transaction.update(doc(db, 'supervisors', supervisorId), {
    currentCapacity: currentCapacity + 1
  });
  
  transaction.set(doc(db, 'applications', applicationId), applicationData);
});
```

**When to use transactions**:
- Reading data and then updating based on that data
- Ensuring data consistency across related documents
- Implementing counters or quotas
- Limit: 500 operations per transaction

**Best Practice**: For user registration, use batch writes to ensure user and role-specific documents are created atomically.

### Pagination

For collections that may grow large, implement pagination to improve performance:

```typescript
import { query, collection, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

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

**Pagination Best Practices**:
- Use `limit(pageSize + 1)` to efficiently check if more pages exist
- Always include `orderBy` with pagination for consistent results
- Store the last document snapshot for the next page
- Consider using cursor-based pagination for better UX

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

## Storage Operations

Firebase Storage is used for storing user profile photos. Files are organized as: `profile-photos/{userId}/{timestamp}.{extension}`

### Storage Operations

1. Create storage reference with `ref()` - includes path structure
2. Upload file with `uploadBytes()` - uploads the file to Storage
3. Get download URL with `getDownloadURL()` - returns public URL for the file

### Storage Best Practices

1. **Use User-Specific Folders**: Organize files by user ID to prevent conflicts
2. **Include Timestamps in Filenames**: Use timestamps to prevent filename conflicts and enable versioning
3. **Handle Upload Errors Gracefully**: Wrap upload operations in try-catch and provide user feedback
4. **Validate File Types and Sizes Client-Side**: Check file type and size before uploading
5. **Store Download URLs in Firestore**: Save the download URL in the user's Firestore document
6. **Set Storage Rules**: Configure Firebase Storage security rules to control access (future implementation)

## Best Practices & Patterns

### Service Layer Pattern

**Always use service functions, never direct Firebase calls in components.** This abstraction enables testing, maintains consistency, and centralizes Firebase logic.

### Error Handling

Consistent try-catch with console.error, return safe defaults. Always wrap Firebase operations in try-catch, log errors for debugging, return safe defaults, and never throw errors from service functions.

### Type Safety

Use TypeScript interfaces for all data operations. This ensures compile-time type checking, IntelliSense support, self-documenting code, and prevents type-related bugs.

### Initialization

Singleton pattern prevents multiple Firebase app instances. The initialization in `lib/firebase.ts` uses a singleton pattern to ensure Firebase is only initialized once, prevents errors from multiple app instances, and works correctly with Next.js hot module reloading.

### Testing

Mock services at module level, not Firebase SDK directly. See `docs/testing-strategy.md` for detailed testing strategies. Mock the service layer, not Firebase SDK.

### Security

1. **Never Expose Service Account Keys**: Service account keys should never be in client-side code
2. **Use Environment Variables**: All Firebase configuration comes from environment variables
3. **Implement Firestore Security Rules**: Set up security rules to control data access (see Security Rules section below)
4. **Validate Input Client-Side**: Validate user input before sending to Firebase
5. **Handle Auth Errors**: Provide appropriate error messages without exposing sensitive information
6. **Validate Firebase Configuration**: Check that all required environment variables are set before initializing Firebase
7. **Use HTTPS Only**: Firebase enforces HTTPS, but ensure all custom endpoints also use HTTPS
8. **Implement Rate Limiting**: Use Firebase Auth's built-in rate limiting and consider additional client-side throttling

#### Configuration Validation

Always validate that Firebase configuration is complete before initialization:

```typescript
// lib/firebase.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingEnvVars.join(', ')}\n` +
    `Please check your .env.local file.`
  );
}
```

This prevents runtime errors and provides clear feedback during development.

### Performance

1. **Use Specific Queries**: Query only the data you need, don't fetch entire collections
2. **Implement Pagination**: For large collections, use pagination with `limit()` and `startAfter()`
3. **Cache Frequently Accessed Data**: Consider caching user profiles and other frequently accessed data
4. **Use Indexes**: Create composite indexes for queries with multiple `where` clauses
5. **Optimize Queries**: Use `select()` to fetch only needed fields when possible
6. **Enable Offline Persistence**: Allow app to work offline and sync when online
7. **Use Field Selection**: Fetch only needed fields with `select()` to reduce bandwidth

#### Offline Persistence

Enable offline persistence to improve app performance and allow offline usage:

```typescript
// lib/firebase.ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence (only on client side)
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

**Benefits**:
- Faster data loading from cache
- App works offline
- Automatic sync when connection restored
- Reduced bandwidth usage

**Limitations**:
- Only one tab can have persistence enabled
- Cache size limits (40MB by default)
- Not supported in all browsers

#### Field Selection for Optimization

Use `select()` to fetch only needed fields:

```typescript
import { select } from 'firebase/firestore';

async getUsersBasicInfo(): Promise<Array<{id: string, name: string, email: string}>> {
  try {
    const q = query(
      collection(db, 'users'),
      select('name', 'email') // Only fetch these fields
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
    }));
  } catch (error) {
    console.error('Error fetching basic user info:', error);
    return [];
  }
}
```

**When to use field selection**:
- List views that don't need all data
- Autocomplete or search results
- Dashboard statistics
- Performance-critical queries

### Data Consistency

1. **Create User Documents in Multiple Collections**: When registering, create documents in both `users` and role-specific collections
2. **Use Transactions for Related Updates**: When updating multiple related documents, use Firestore transactions
3. **Include Timestamps**: Always include `createdAt` and `updatedAt` timestamps on documents
4. **Maintain Referential Integrity**: Ensure IDs match between related documents
5. **Use Batch Writes for Atomic Operations**: Ensure related documents are created/updated together using `writeBatch()`
6. **Implement Cleanup on Failure**: If multi-step operations fail, clean up partial changes (e.g., delete auth account if Firestore creation fails)

### Connection Monitoring

Monitor network connection state to provide better UX:

```typescript
// lib/firebase-utils.ts
export function monitorConnection(callback: (isOnline: boolean) => void) {
  if (typeof window !== 'undefined') {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial state
    callback(navigator.onLine);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  return () => {};
}
```

**Usage in components**:

```typescript
useEffect(() => {
  const cleanup = monitorConnection((isOnline) => {
    setIsOnline(isOnline);
    if (isOnline) {
      // Retry failed operations or show "Back online" message
    } else {
      // Show offline indicator
    }
  });
  
  return cleanup;
}, []);
```

**Benefits**:
- Inform users when offline
- Prevent unnecessary operation attempts
- Auto-retry when connection restored
- Better user experience

## Testing Strategy

Since the application uses Firebase services for data operations, tests mock these services to avoid actual database calls. This approach is documented in `docs/testing-strategy.md`.

**Mocking Pattern**:
- Mock Firebase services (`@/lib/services`) at the module level
- Mock Firebase Auth (`@/lib/auth`) for authentication state
- Use mock data fixtures that match service return types
- Reset mocks in `beforeEach` to ensure test isolation

**Key Principles**: Mock services, not Firebase SDK directly; use real mock data structures for realistic tests; transform mock data to match service return types.

This approach ensures fast test execution, test isolation, realistic testing, and easy maintenance.

## Common Refactoring Improvements

This section covers common issues found during code reviews and their solutions.

### Issue 1: Missing Document IDs in Query Results

**Problem**: Query results don't include the document ID, causing bugs when you need to reference the document.

**Bad Example**:
```typescript
async getAllUsers(): Promise<BaseUser[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(), // Missing doc.id!
  })) as BaseUser[];
}
```

**Good Example**:
```typescript
async getAllUsers(): Promise<BaseUser[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id, // Always include document ID
    ...doc.data(),
  })) as BaseUser[];
}
```

**Fix**: Always include `id: doc.id` when mapping query results.

### Issue 2: Non-Atomic Multi-Document Operations

**Problem**: Creating multiple related documents without atomicity can leave orphaned data if one operation fails.

**Bad Example** (Registration):
```typescript
// If any of these fail, you have inconsistent state
await createUserWithEmailAndPassword(auth, email, password);
await setDoc(doc(db, 'users', userId), userData);
await setDoc(doc(db, 'students', userId), studentData);
```

**Good Example**:
```typescript
// Create auth account first
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const userId = userCredential.user.uid;

try {
  // Use batch write for atomicity
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userId), userData);
  batch.set(doc(db, 'students', userId), studentData);
  await batch.commit();
} catch (error) {
  // Cleanup: delete auth account if Firestore fails
  await userCredential.user.delete();
  throw error;
}
```

**Fix**: Use `writeBatch()` for related document operations and implement cleanup on failure.

### Issue 3: Fetching Entire Collections Without Pagination

**Problem**: Fetching all documents from a collection causes performance issues as data grows.

**Bad Example**:
```typescript
async getAllStudents(): Promise<Student[]> {
  const querySnapshot = await getDocs(collection(db, 'students'));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[];
}
```

**Good Example**:
```typescript
async getStudentsPaginated(pageSize: number = 20, lastDoc?: any) {
  let q = query(
    collection(db, 'students'),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const querySnapshot = await getDocs(q);
  const students = querySnapshot.docs.slice(0, pageSize).map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Student[];
  
  return {
    students,
    hasMore: querySnapshot.docs.length > pageSize,
    lastVisible: querySnapshot.docs.length > pageSize ? querySnapshot.docs[pageSize - 1] : null,
  };
}
```

**Fix**: Implement pagination using `limit()` and `startAfter()` for all list operations.

### Issue 4: Not Using Real-time Listeners

**Problem**: Using one-time fetches means users must manually refresh to see updates.

**Improvement**: Add real-time listeners for frequently updated data:

```typescript
// Add to service
subscribeToApplications(
  studentId: string,
  callback: (applications: Application[]) => void
): () => void {
  const q = query(
    collection(db, 'applications'),
    where('studentId', '==', studentId)
  );
  
  return onSnapshot(q, 
    (snapshot) => {
      const apps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Application[];
      callback(apps);
    },
    (error) => {
      console.error('Error in subscription:', error);
      callback([]);
    }
  );
}
```

**Usage in component**:
```typescript
useEffect(() => {
  const unsubscribe = ApplicationService.subscribeToApplications(
    userId,
    (apps) => setApplications(apps)
  );
  return () => unsubscribe(); // Always cleanup!
}, [userId]);
```

### Issue 5: No Firebase Configuration Validation

**Problem**: Missing environment variables cause cryptic runtime errors.

**Solution**: Validate configuration before initialization:

```typescript
// At the top of lib/firebase.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingEnvVars.join(', ')}\n` +
    `Please check your .env.local file.`
  );
}
```

### Issue 6: Missing Error Recovery in File Uploads

**Problem**: If photo upload fails during registration, the entire process fails.

**Solution**: Make photo upload non-critical:

```typescript
// Upload photo but don't fail registration if it fails
let photoURL = '';
try {
  if (photoFile) {
    photoURL = await uploadPhoto(userId);
  }
} catch (photoError) {
  console.error('Photo upload failed, continuing without photo:', photoError);
  // Continue registration without photo
}
```

**Status**: Implemented in `app/register/page.tsx` - Photo uploads are now non-critical and registration continues even if the upload fails.

### Issue 7: Not Implementing Retry Logic

**Problem**: Transient network errors cause operations to fail unnecessarily.

**Solution**: Implement retry logic for critical operations:

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 'permission-denied' || 
          error.code === 'auth/email-already-in-use') {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError;
}
```

## Troubleshooting

### Common Issues

#### Firebase Not Initialized
**Symptoms**: "Firebase: No Firebase App '[DEFAULT]' has been created"
**Solutions**: Check environment variables are set in `.env.local`, verify `NEXT_PUBLIC_` prefix, restart dev server, check `lib/firebase.ts` imports

#### Permission Denied
**Symptoms**: "Missing or insufficient permissions"
**Solutions**: Check Firestore security rules, verify user is authenticated, ensure proper role/permissions

#### Queries Failing
**Symptoms**: "The query requires an index"
**Solutions**: Check Firebase Console for missing index notifications, create composite indexes for queries with multiple `where` clauses

#### Storage Upload Errors
**Symptoms**: Upload failures or permission errors
**Solutions**: Check file size limits (5MB for free tier), verify file type, check Storage security rules, ensure user is authenticated, validate client-side

#### Auth Errors
**Common Codes**: `auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`, `auth/user-not-found`, `auth/wrong-password`
**Solutions**: Handle specific error codes with user-friendly messages, validate input client-side, check Firebase Auth settings

### Debugging Tips

1. Check Firebase Console for database, storage, and authentication logs
2. Use browser console for client-side errors and network requests
3. Verify environment variables with `console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)`
4. Check Network tab in DevTools to see Firebase API calls
5. Enable Firebase debugging with `localStorage.setItem('firebase:debug', '*')`

## Maintenance & Future Considerations

### Updating Firebase SDK

1. Check release notes for breaking changes
2. Update dependencies: `npm update firebase` or `npm install firebase@latest`
3. Test all Firebase operations after updating
4. Ensure TypeScript types are compatible
5. Replace deprecated methods

### Migrating Data

1. Plan migration strategy for schema changes
2. Create migration scripts for bulk data updates
3. Test on staging environment first
4. Export data before major migrations
5. Update TypeScript interfaces to match new schema

### Monitoring

1. Regularly check Firebase Console for usage and quotas
2. Monitor error logs in Firebase Console
3. Use Firebase Performance Monitoring (if enabled)
4. Monitor usage against free tier limits
5. Track costs if using paid tier features

### Security Rules

**Current Status**: Security rules need to be implemented to protect data

**Critical**: Without security rules, your database is vulnerable. Implementing proper security rules is essential before production deployment.

#### Firestore Security Rules

Create `firestore.rules` file in your project root:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Students collection - students can update their own profile, all authenticated users can read
    match /students/{studentId} {
      allow read: if isSignedIn();
      allow create: if isOwner(studentId);
      allow update, delete: if isOwner(studentId);
    }
    
    // Supervisors collection - supervisors can update their own profile, all authenticated users can read
    match /supervisors/{supervisorId} {
      allow read: if isSignedIn();
      allow create: if isOwner(supervisorId);
      allow update, delete: if isOwner(supervisorId);
    }
    
    // Applications collection
    match /applications/{applicationId} {
      allow read: if isSignedIn() && 
        (request.auth.uid == resource.data.studentId || 
         request.auth.uid == resource.data.supervisorId);
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (request.auth.uid == resource.data.studentId || 
         request.auth.uid == resource.data.supervisorId);
      allow delete: if isOwner(resource.data.studentId);
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (request.auth.uid == resource.data.supervisorId || 
         request.auth.uid == resource.data.studentId);
      allow delete: if isOwner(resource.data.supervisorId);
    }
    
    // Admins collection - only admins can read/write
    match /admins/{adminId} {
      allow read: if isOwner(adminId);
      allow write: if isOwner(adminId);
    }
  }
}
```

#### Storage Security Rules

Create `storage.rules` file for Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - users can only upload to their own folder
    match /profile-photos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Images only
    }
  }
}
```

#### Composite Indexes

Create `firestore.indexes.json` for queries with multiple `where` clauses:

```json
{
  "indexes": [
    {
      "collectionGroup": "supervisors",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "isApproved", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "supervisors",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "department", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "supervisorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

#### Deploying Security Rules

Using Firebase CLI:

```bash
# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy Storage rules only
firebase deploy --only storage

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy all
firebase deploy
```

#### Testing Security Rules

Test rules in Firebase Console:
1. Go to Firestore Database → Rules
2. Click "Rules Playground" tab
3. Simulate read/write operations with different authentication states
4. Verify rules work as expected before deploying

**Best Practices for Security Rules**:
- Always require authentication for sensitive data
- Use helper functions to avoid repetition
- Test rules thoroughly before production deployment
- Monitor rule violations in Firebase Console
- Update rules as your data model evolves
- Document why specific rules exist
- Use custom claims for role-based access if needed

### Performance Optimization

**Required for Production**:
1. Create composite indexes for queries with multiple `where` clauses (see Security Rules section)
2. Implement pagination for large collections (see Pagination section)
3. Enable offline persistence (see Performance section)
4. Use `select()` to fetch only needed fields when possible (see Field Selection section)

**Recommended**:
1. Use specific queries instead of fetching entire collections
2. Cache frequently accessed data client-side
3. Monitor query performance in Firebase Console
4. Implement real-time listeners for frequently updated data
5. Use connection monitoring to improve UX

**Monitoring Performance**:
- Check Firebase Console → Performance tab
- Monitor document reads/writes usage
- Identify slow queries
- Set up alerts for quota limits
- Review Firebase Performance Monitoring reports

### Backup Strategies

1. Export Firestore data regularly using Firebase Console or CLI
2. Set up automated backup scripts
3. Keep backup of data structure/schema
4. Document recovery procedures
5. Periodically test data restoration

## Resources

### Firebase Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

### Project-Specific Files

- `lib/firebase.ts` - Firebase configuration and initialization
- `lib/auth.ts` - Authentication functions
- `lib/services/firebase-services.ts` - Service layer implementation
- `types/database.ts` - TypeScript type definitions
- `app/register/page.tsx` - Registration flow example

### Related Project Documentation

- `docs/testing-strategy.md` - Testing Firebase services and mocking strategies
- `docs/dashboard-architecture.md` - Data models and Firestore collections structure
- `docs/development-process.md` - Migration history from mock data to Firebase

### Additional Resources

- [Next.js Firebase Integration](https://nextjs.org/docs/authentication#firebase)
- [Firebase Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [TypeScript with Firebase](https://firebase.google.com/docs/firestore/query-data/get-data#typescript)
- [Firestore Security Rules Reference](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firestore Query Optimization](https://firebase.google.com/docs/firestore/query-data/queries)

---

## Implementation Checklist

Use this checklist to ensure your Firebase implementation follows best practices:

### Critical (Must Have Before Production)

- [ ] **Security Rules Implemented**: Firestore and Storage security rules are configured and tested
- [x] **Config Validation**: Environment variables are validated on startup
- [ ] **Batch Operations**: User registration uses batch writes for atomicity
- [x] **Document IDs Included**: All query results include `doc.id`
- [ ] **Error Cleanup**: Failed multi-step operations clean up partial changes
- [x] **Composite Indexes**: Required indexes are created for multi-field queries

### High Priority (Should Have Soon)

- [ ] **Pagination Implemented**: Large collections use pagination
- [ ] **Real-time Listeners**: Critical data uses `onSnapshot` for live updates
- [ ] **Offline Persistence**: `enableIndexedDbPersistence` is configured
- [ ] **Error Handling**: All Firebase operations have proper try-catch blocks
- [ ] **Timestamp Conversion**: Firestore Timestamps are converted to Date objects
- [ ] **Connection Monitoring**: App monitors online/offline state

### Medium Priority (Nice to Have)

- [ ] **Field Selection**: Queries use `select()` where appropriate
- [ ] **Retry Logic**: Critical operations implement retry on transient failures
- [ ] **Performance Monitoring**: Firebase Performance Monitoring is enabled
- [ ] **Usage Alerts**: Alerts configured for quota limits
- [ ] **Data Caching**: Frequently accessed data is cached client-side
- [ ] **Backup Strategy**: Regular data exports are automated

### Testing & Quality

- [ ] **Service Layer Tests**: All Firebase services have unit tests
- [ ] **Mock Strategy**: Tests mock services, not Firebase SDK
- [ ] **Security Rules Tests**: Rules are tested in Firebase Console
- [ ] **Error Scenarios**: Tests cover error cases and edge conditions
- [ ] **Integration Tests**: Key user flows are tested end-to-end

### Documentation

- [ ] **API Documentation**: All service methods are documented
- [ ] **Security Rules Comments**: Rules include explanatory comments
- [ ] **Migration Guides**: Data schema changes are documented
- [ ] **Troubleshooting Guide**: Common issues and solutions are documented
- [ ] **Team Training**: Team is trained on Firebase best practices

---

## Quick Reference

### Common Imports

```typescript
// Firestore
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  writeBatch, runTransaction,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

// Auth
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Storage
import { 
  ref, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
```

### Service Pattern Template

```typescript
export const ExampleService = {
  async getById(id: string): Promise<ExampleType | null> {
    try {
      const docRef = await getDoc(doc(db, 'collection', id));
      if (docRef.exists()) {
        return { id: docRef.id, ...docRef.data() } as ExampleType;
      }
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  },
  
  async getAll(): Promise<ExampleType[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'collection'));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ExampleType[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  },
};
```

### Real-time Listener Pattern

```typescript
useEffect(() => {
  const q = query(collection(db, 'collection'), where('field', '==', value));
  
  const unsubscribe = onSnapshot(q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(data);
    },
    (error) => {
      console.error('Error in listener:', error);
    }
  );
  
  return () => unsubscribe();
}, [value]);
```

---

**Last Updated**: November 2025
**Next Review**: Before Production Deployment
