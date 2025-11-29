# Firebase Guide

Complete guide to Firebase Authentication, Firestore, and Admin SDK patterns for MentorMatch.

## Table of Contents

1. [Authentication](#authentication) - Client-side authentication patterns
2. [Firestore](#firestore) - Database operations and patterns
3. [Admin SDK](#admin-sdk) - Server-side Firebase with elevated privileges

---

# Authentication

Client-side user authentication and session management patterns.

## Overview

Located in `lib/auth.ts`, handles user authentication, registration, and session management.

## Key Functions

- `signUp(email, password, userData)` - Create account
- `signIn(email, password)` - Sign in
- `signOut()` - Sign out
- `getUserProfile(userId)` - Fetch profile
- `onAuthChange(callback)` - Listen for auth state

## Registration Flow

1. Create Firebase Auth account
2. Upload photo (optional)
3. Create user document in `users` collection
4. Create role-specific profile (`students` or `supervisors`)

```typescript
// Registration example
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const userId = userCredential.user.uid;

// Upload photo (non-critical)
let photoURL = '';
try {
  if (photoFile) {
    photoURL = await uploadProfilePhoto(userId, photoFile);
  }
} catch (error) {
  console.error('Photo upload failed, continuing:', error);
}

// Create documents atomically
const batch = writeBatch(db);
batch.set(doc(db, 'users', userId), {
  email,
  name,
  role,
  photoURL,
  createdAt: new Date(),
});
batch.set(doc(db, 'students', userId), studentData);
await batch.commit();
```

## Auth State Management

### Listen for State Changes

```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User signed in
    const profile = await getUserProfile(user.uid);
    setUser(profile);
  } else {
    // User signed out
    setUser(null);
  }
});
```

### Custom Hook Pattern

```typescript
function useAuth() {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return { user, loading };
}
```

## Protected Routes

```typescript
'use client';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  
  return <div>Dashboard Content</div>;
}
```

## Error Handling

### Common Auth Errors

```typescript
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  switch (error.code) {
    case 'auth/user-not-found':
      setError('No account found with this email');
      break;
    case 'auth/wrong-password':
      setError('Incorrect password');
      break;
    case 'auth/invalid-email':
      setError('Invalid email address');
      break;
    case 'auth/too-many-requests':
      setError('Too many failed attempts. Try again later');
      break;
    default:
      setError('Failed to sign in. Please try again');
  }
}
```

## Profile Photos

### Upload Pattern

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `profile-photos/${userId}/${timestamp}.${ext}`);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
```

### Validation

```typescript
function validatePhotoFile(file: File): boolean {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (file.size > MAX_SIZE) {
    throw new Error('File too large (max 5MB)');
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  return true;
}
```

---

# Firestore

Database patterns and operations for data storage and retrieval.

## Service Layer Pattern

All Firestore operations use service layer (`lib/services/firebase-services.ts`):

- **UserService** - User profiles
- **StudentService** - Student operations
- **SupervisorService** - Supervisor operations
- **ApplicationService** - Application CRUD
- **ProjectService** - Project management
- **AdminService** - Admin operations

### Why Service Layer?

- Testability (mock at module level)
- Centralized Firebase logic
- Type safety with TypeScript
- Consistent error handling
- Separation of concerns

## Database Structure

```
Firestore
├── users/              # Base profiles
├── students/           # Student details
├── supervisors/        # Supervisor profiles  
├── applications/       # Project applications
├── projects/           # Active projects
└── admins/             # Admin profiles
```

## Basic Operations

### Read Operations

```typescript
// Single document
async getUser(userId: string): Promise<BaseUser | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() 
      ? { id: docSnap.id, ...docSnap.data() } as BaseUser
      : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Collection query
async getAllStudents(): Promise<Student[]> {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}
```

### Write Operations

```typescript
// Create
async createStudent(data: Omit<Student, 'id'>): Promise<boolean> {
  try {
    await setDoc(doc(db, 'students', data.userId), data);
    return true;
  } catch (error) {
    console.error('Error creating student:', error);
    return false;
  }
}

// Update
async updateStudent(userId: string, updates: Partial<Student>): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'students', userId), updates);
    return true;
  } catch (error) {
    console.error('Error updating student:', error);
    return false;
  }
}

// Delete
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

## Querying

### With Filters

```typescript
async getAvailableSupervisors(): Promise<Supervisor[]> {
  try {
    const q = query(
      collection(db, 'supervisors'),
      where('isActive', '==', true),
      where('isAvailable', '==', true),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Supervisor[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
```

### Pagination

```typescript
async getStudentsPaginated(
  pageSize: number = 20,
  lastDoc?: any
): Promise<{ students: Student[], lastVisible: any, hasMore: boolean }> {
  try {
    let q = query(
      collection(db, 'students'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const students = snapshot.docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
    
    const hasMore = snapshot.docs.length > pageSize;
    const lastVisible = hasMore ? snapshot.docs[pageSize - 1] : null;
    
    return { students, lastVisible, hasMore };
  } catch (error) {
    console.error('Error:', error);
    return { students: [], lastVisible: null, hasMore: false };
  }
}
```

## Batch Operations

Use for atomic multi-document writes:

```typescript
async registerUser(userData, roleData): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    
    batch.set(doc(db, 'users', userId), userData);
    batch.set(doc(db, 'students', userId), roleData);
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

**Use cases:**
- Related document creation
- Multiple deletions
- Updates that don't depend on each other
- **Limit:** 500 operations per batch

## Transactions

Use when reading before writing:

```typescript
async assignStudent(supervisorId: string, applicationId: string): Promise<boolean> {
  try {
    await runTransaction(db, async (transaction) => {
      const supervisorDoc = await transaction.get(doc(db, 'supervisors', supervisorId));
      
      if (!supervisorDoc.exists()) {
        throw new Error('Supervisor not found');
      }
      
      const current = supervisorDoc.data().currentCapacity;
      const max = supervisorDoc.data().maxCapacity;
      
      if (current >= max) {
        throw new Error('Supervisor at capacity');
      }
      
      transaction.update(doc(db, 'supervisors', supervisorId), {
        currentCapacity: current + 1
      });
      
      transaction.update(doc(db, 'applications', applicationId), {
        status: 'accepted'
      });
    });
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

**Use cases:**
- Read-then-write operations
- Data consistency across documents
- Counters/quotas
- **Limit:** 500 operations

## Real-time Listeners

```typescript
subscribeToApplications(
  studentId: string,
  callback: (applications: Application[]) => void
): () => void {
  const q = query(
    collection(db, 'applications'),
    where('studentId', '==', studentId)
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Application[];
      callback(applications);
    },
    (error) => {
      console.error('Error:', error);
      callback([]);
    }
  );
}
```

### React Usage

```typescript
useEffect(() => {
  const unsubscribe = ApplicationService.subscribeToApplications(
    userId,
    setApplications
  );
  
  return () => unsubscribe(); // Critical: cleanup
}, [userId]);
```

## Best Practices

### Error Handling
- Wrap all operations in try-catch
- Log errors for debugging
- Return safe defaults (`null`, `[]`, `false`)
- Never throw from service functions

### Type Safety
```typescript
import { BaseUser, Student } from '@/types/database';

// Always type returns
async getUser(id: string): Promise<BaseUser | null> {
  // ...
}
```

### Document IDs
```typescript
// Always include ID
return snapshot.docs.map(doc => ({
  id: doc.id,  // Required
  ...doc.data(),
}));
```

### Timestamps
```typescript
{
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
}
```

---

# Admin SDK

Server-side Firebase operations with elevated privileges for API routes.

## Overview

Located in `lib/firebase-admin.ts`, provides server-side Firebase access for API routes.

## Setup

### Environment Variables

Required in `.env.local`:

```bash
# Firebase Admin (Server-Side ONLY)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Get Credentials

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Extract: `project_id`, `client_email`, `private_key`

**Critical:** Keep private key secure, never commit to git.

## Initialization

```typescript
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
```

## Authentication

### Verify ID Tokens

```typescript
import { adminAuth } from '@/lib/firebase-admin';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
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
    console.error('Token verification failed:', error);
    return { authenticated: false };
  }
}
```

### Usage in API Routes

```typescript
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  // 1. Verify authentication
  const authResult = await verifyAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // 2. Check authorization
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // 3. Process request
  const data = await fetchData();
  return NextResponse.json(data);
}
```

## Firestore Operations

### Admin Database Access

```typescript
import { adminDb } from '@/lib/firebase-admin';

// Read document
const doc = await adminDb.collection('users').doc(userId).get();
const user = doc.exists ? { id: doc.id, ...doc.data() } : null;

// Write document
await adminDb.collection('users').doc(userId).set({
  name: 'John',
  email: 'john@example.com',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

// Update document
await adminDb.collection('users').doc(userId).update({
  lastLogin: admin.firestore.FieldValue.serverTimestamp(),
});

// Delete document
await adminDb.collection('users').doc(userId).delete();
```

### Batch Operations

```typescript
const batch = adminDb.batch();

batch.set(adminDb.collection('users').doc(userId), userData);
batch.set(adminDb.collection('students').doc(userId), studentData);

await batch.commit();
```

### Transactions

```typescript
await adminDb.runTransaction(async (transaction) => {
  const supervisorRef = adminDb.collection('supervisors').doc(supervisorId);
  const supervisorDoc = await transaction.get(supervisorRef);
  
  if (!supervisorDoc.exists) {
    throw new Error('Supervisor not found');
  }
  
  const currentCapacity = supervisorDoc.data()?.currentCapacity || 0;
  
  transaction.update(supervisorRef, {
    currentCapacity: currentCapacity + 1,
  });
});
```

## User Management

### Create User

```typescript
const user = await adminAuth.createUser({
  email: 'user@example.com',
  password: 'securePassword123',
  displayName: 'John Doe',
});
```

### Update User

```typescript
await adminAuth.updateUser(userId, {
  email: 'newemail@example.com',
  displayName: 'Jane Doe',
  disabled: false,
});
```

### Delete User

```typescript
await adminAuth.deleteUser(userId);
```

### Set Custom Claims

```typescript
// Set role claim
await adminAuth.setCustomUserClaims(userId, {
  role: 'admin',
  permissions: ['read', 'write'],
});

// Verify in ID token
const decodedToken = await adminAuth.verifyIdToken(token);
console.log(decodedToken.role); // 'admin'
```

## Security

### Critical Rules

1. **Never expose admin credentials**
   - Never include in client-side code
   - Never commit to git
   - Only use in API routes (server-side)

2. **Validate all inputs**
   - Always validate request data
   - Use Zod schemas for validation
   - Check user permissions

3. **Environment separation**
   - Different credentials for dev/prod
   - Separate Firebase projects
   - Different service accounts

### Secure Patterns

```typescript
// Good: Server-side only
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  // Use adminDb here
}

// Bad: Never in client components
'use client';
import { adminDb } from '@/lib/firebase-admin'; // ❌ NEVER DO THIS
```

## Troubleshooting

### "Invalid PEM formatted message"

**Cause:** Private key formatting incorrect

**Fix:**
```bash
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
- Wrap in quotes
- Keep `\n` as literal text (not actual newlines)
- Include BEGIN/END markers

### "Missing environment variables"

**Cause:** Variables not set or misspelled

**Fix:**
- Check `.env.local` exists
- Verify variable names exact (case-sensitive)
- Restart dev server

### "Permission denied"

**Cause:** Service account lacks permissions

**Fix:**
- Verify service account has required roles
- Check Firestore security rules
- Ensure account is enabled

## Best Practices

### Initialization
- Initialize once, reuse instance
- Check if already initialized
- Handle errors gracefully

### Error Handling
```typescript
try {
  const user = await adminAuth.getUserByEmail(email);
  return user;
} catch (error) {
  console.error('Error fetching user:', error);
  return null;
}
```

### Rate Limiting
- Implement rate limiting for API routes
- Use quota management
- Monitor usage in Firebase Console

### Monitoring
- Log critical operations
- Monitor quota usage
- Track error rates
- Review security logs

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Authentication Guide](https://firebase.google.com/docs/auth/admin)
- [Firestore Admin API](https://firebase.google.com/docs/firestore/security/rules)

---

**Last Updated**: November 2025

