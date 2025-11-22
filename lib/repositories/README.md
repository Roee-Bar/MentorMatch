# Repository Pattern

This directory contains the repository pattern implementation for data access in the MentorMatch application.

## Overview

The repository pattern provides an abstraction layer between the application logic and data access, making it easy to switch between different data sources (e.g., mock data, Firebase, REST API) without changing the application code.

## Structure

```
lib/repositories/
├── interfaces/           # Repository interface definitions
│   ├── IApplicationRepository.ts
│   ├── IUserRepository.ts
│   ├── ISupervisorRepository.ts
│   └── index.ts
├── mock/                # Mock data implementations
│   ├── MockApplicationRepository.ts
│   ├── MockUserRepository.ts
│   ├── MockSupervisorRepository.ts
│   └── index.ts
├── firebase/            # Firebase implementations (future)
│   ├── FirebaseApplicationRepository.ts
│   ├── FirebaseUserRepository.ts
│   ├── FirebaseSupervisorRepository.ts
│   └── index.ts
├── RepositoryFactory.ts # Factory for creating repository instances
├── index.ts             # Barrel export
└── README.md           # This file
```

## Usage

### In Components

```typescript
import { RepositoryFactory } from '@/lib/repositories';

// Get repository instance
const applicationRepo = RepositoryFactory.getApplicationRepository();

// Use repository methods
const applications = await applicationRepo.getAllApplications();
const application = await applicationRepo.getApplicationById('123');
```

### In Tests

```typescript
import { applications } from '@/mock-data';

// Mock the RepositoryFactory
jest.mock('@/lib/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    getApplicationRepository: jest.fn(() => ({
      getAllApplications: jest.fn().mockResolvedValue(applications),
    })),
  },
}));

// Or use actual mock implementations
import { MockApplicationRepository } from '@/lib/repositories';

const repo = new MockApplicationRepository();
const data = await repo.getAllApplications();
```

## Switching Data Sources

The application uses an environment variable to determine which data source to use:

```env
# .env.local
NEXT_PUBLIC_USE_FIREBASE=false  # Use mock data
# NEXT_PUBLIC_USE_FIREBASE=true   # Use Firebase (when implemented)
```

To switch from mock data to Firebase:

1. Set `NEXT_PUBLIC_USE_FIREBASE=true` in your `.env.local` file
2. Implement Firebase repository classes (see "Adding Firebase Implementation" below)
3. No changes to component code are required!

## Adding Firebase Implementation

When ready to implement Firebase:

1. **Create Firebase repository classes** in `lib/repositories/firebase/`:

```typescript
// lib/repositories/firebase/FirebaseApplicationRepository.ts
import { IApplicationRepository } from '../interfaces/IApplicationRepository';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export class FirebaseApplicationRepository implements IApplicationRepository {
  private collectionName = 'applications';

  async getAllApplications(): Promise<Application[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Application));
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const docSnap = await getDoc(doc(db, this.collectionName, id));
    return docSnap.exists() 
      ? { id: docSnap.id, ...docSnap.data() } as Application 
      : null;
  }

  // Implement other methods...
}
```

2. **Update RepositoryFactory** to use Firebase implementations:

```typescript
// lib/repositories/RepositoryFactory.ts
import { FirebaseApplicationRepository } from './firebase';

export class RepositoryFactory {
  static getApplicationRepository(): IApplicationRepository {
    if (USE_FIREBASE) {
      return new FirebaseApplicationRepository(); // ✓ Uncomment this
    }
    return new MockApplicationRepository();
  }
  // ...
}
```

3. **Test incrementally**: Start with one repository at a time

## Benefits

✅ **Easy switching**: Change data source with one environment variable  
✅ **Type safety**: TypeScript interfaces ensure consistency  
✅ **Testability**: Easy to mock repositories in tests  
✅ **Maintainability**: Changes to data layer don't affect UI  
✅ **Gradual migration**: Can migrate one entity type at a time  
✅ **Clear contracts**: Interfaces define what each repository must provide

## Migration Checklist

- [x] Create repository interfaces
- [x] Implement mock repositories
- [x] Create repository factory
- [x] Update components to use factory
- [x] Update tests to mock factory
- [ ] Implement Firebase repositories
- [ ] Test Firebase implementation
- [ ] Switch to Firebase in production
- [ ] Remove deprecated mock services

## Deprecated Code

The following files in `mock-data/services/` are deprecated:
- `applicationService.ts`
- `userService.ts`
- `supervisorService.ts`

These are kept only for backward compatibility with tests. New code should use the repository pattern.

