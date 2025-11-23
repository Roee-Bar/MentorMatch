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
3. **Implement Firestore Security Rules**: Set up security rules to control data access (future implementation)
4. **Validate Input Client-Side**: Validate user input before sending to Firebase
5. **Handle Auth Errors**: Provide appropriate error messages without exposing sensitive information

### Performance

1. **Use Specific Queries**: Query only the data you need, don't fetch entire collections
2. **Implement Pagination**: For large collections, use pagination with `limit()` and `startAfter()`
3. **Cache Frequently Accessed Data**: Consider caching user profiles and other frequently accessed data
4. **Use Indexes**: Create composite indexes for queries with multiple `where` clauses
5. **Optimize Queries**: Use `select()` to fetch only needed fields when possible

### Data Consistency

1. **Create User Documents in Multiple Collections**: When registering, create documents in both `users` and role-specific collections
2. **Use Transactions for Related Updates**: When updating multiple related documents, use Firestore transactions
3. **Include Timestamps**: Always include `createdAt` and `updatedAt` timestamps on documents
4. **Maintain Referential Integrity**: Ensure IDs match between related documents

## Testing Strategy

Since the application uses Firebase services for data operations, tests mock these services to avoid actual database calls. This approach is documented in `docs/testing-strategy.md`.

**Mocking Pattern**:
- Mock Firebase services (`@/lib/services`) at the module level
- Mock Firebase Auth (`@/lib/auth`) for authentication state
- Use mock data fixtures that match service return types
- Reset mocks in `beforeEach` to ensure test isolation

**Key Principles**: Mock services, not Firebase SDK directly; use real mock data structures for realistic tests; transform mock data to match service return types.

This approach ensures fast test execution, test isolation, realistic testing, and easy maintenance.

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

**Current Status**: Security rules are not yet implemented (future work)

**Implementation Roadmap**:
1. Define access patterns for each collection
2. Write security rules based on user roles
3. Test rules thoroughly in Firebase Console
4. Deploy rules using Firebase CLI
5. Monitor and update rules as needed

### Performance Optimization

1. Create composite indexes for queries with multiple `where` clauses
2. Use specific queries instead of fetching entire collections
3. Implement pagination for large collections
4. Cache frequently accessed data client-side
5. Use `select()` to fetch only needed fields when possible

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
