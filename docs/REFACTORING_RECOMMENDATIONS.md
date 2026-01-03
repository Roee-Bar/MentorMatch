# Refactoring Recommendations for MentorMatch

**Date:** 2024  
**Purpose:** Improve separation of concerns and code reuse for better maintainability and future development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Priority 1: High-Impact Refactoring](#priority-1-high-impact-refactoring)
3. [Priority 2: Medium-Impact Improvements](#priority-2-medium-impact-improvements)
4. [Priority 3: Code Organization](#priority-3-code-organization)
5. [Implementation Strategy](#implementation-strategy)
6. [Quick Wins](#quick-wins)
7. [Code Examples](#code-examples)

---

## Executive Summary

This document outlines refactoring opportunities identified in the MentorMatch codebase to improve:
- **Separation of Concerns**: Clear boundaries between layers (API, Services, Hooks, Components)
- **Code Reuse**: Eliminate duplication and create reusable abstractions
- **Maintainability**: Make the codebase easier to understand and modify
- **Testability**: Improve ability to test individual components in isolation

### Current Architecture Strengths

✅ Good middleware patterns (`withAuth`, `withValidationAndServiceCall`)  
✅ Consistent service layer with `ServiceResult` pattern  
✅ Well-organized component structure  
✅ Type-safe API client  
✅ Centralized error messages and constants  

### Areas for Improvement

⚠️ Duplicated CRUD patterns across services  
⚠️ Similar action hooks with repeated loading state logic  
⚠️ Scattered date formatting logic  
⚠️ Direct Firestore calls in services (could use repository pattern)  
⚠️ Business logic mixed into components  

---

## Priority 1: High-Impact Refactoring

### 1. Abstract Base Service Pattern

**Status:** ✅ **COMPLETED** (PR #55)

**Current Issue:**
Each service (ApplicationService, StudentService, SupervisorService, etc.) repeats similar CRUD patterns:
- `getById()` methods with identical error handling
- `create()` methods with similar validation and Firestore operations
- `update()` methods with similar update logic
- `delete()` methods with similar deletion patterns

**Impact:** High - Reduces code duplication across ~10+ service files

**Implementation Notes:**
- BaseService class created at `lib/services/shared/base-service.ts`
- All services migrated to extend BaseService (UserService, StudentService, ApplicationService, SupervisorService, AdminService, ProjectService)
- Services export singleton instances (e.g., `export const applicationService = new ApplicationServiceClass()`)
- Custom timestamp field handling implemented for ApplicationService (dateApplied/lastUpdated)
- Added `queryWithResult()` method for better error handling (returns ServiceResult)
- Added validation hooks (`validateBeforeCreate`, `validateBeforeUpdate`) for subclasses to override
- Added `getCollection()` helper method for complex multi-query scenarios
- Enhanced type safety by excluding timestamp fields from create() method signature
- All public methods have JSDoc comments

**Recommendation:**

Create a base service class that provides common CRUD operations:

```typescript
// lib/services/shared/base-service.ts
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ServiceResults, type ServiceResult } from './types';

export abstract class BaseService<T extends { id: string }> {
  protected abstract collectionName: string;
  protected abstract serviceName: string;
  protected abstract toEntity(id: string, data: any): T;

  /**
   * Get entity by ID
   */
  protected async getById(id: string): Promise<T | null> {
    try {
      const doc = await adminDb.collection(this.collectionName).doc(id).get();
      if (doc.exists) {
        return this.toEntity(doc.id, doc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(this.serviceName, 'getById', error, { id });
      return null;
    }
  }

  /**
   * Query entities with filters
   */
  protected async query(
    conditions: Array<{ field: string; operator: any; value: any }>,
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  ): Promise<T[]> {
    try {
      let query: FirebaseFirestore.Query = adminDb.collection(this.collectionName);
      
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.toEntity(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(this.serviceName, 'query', error, { conditions });
      return [];
    }
  }

  /**
   * Create new entity
   */
  protected async create(data: Omit<T, 'id'>): Promise<ServiceResult<string>> {
    try {
      const cleanData = this.cleanData(data);
      const docRef = await adminDb.collection(this.collectionName).add({
        ...cleanData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return ServiceResults.success(docRef.id, `${this.serviceName} created successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'create', error, { data });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create entity'
      );
    }
  }

  /**
   * Update entity
   */
  protected async update(id: string, updates: Partial<T>): Promise<ServiceResult> {
    try {
      const cleanUpdates = this.cleanData(updates);
      await adminDb.collection(this.collectionName).doc(id).update({
        ...cleanUpdates,
        updatedAt: new Date(),
      });
      return ServiceResults.success(undefined, `${this.serviceName} updated successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'update', error, { id });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update entity'
      );
    }
  }

  /**
   * Delete entity
   */
  protected async delete(id: string): Promise<ServiceResult> {
    try {
      await adminDb.collection(this.collectionName).doc(id).delete();
      return ServiceResults.success(undefined, `${this.serviceName} deleted successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'delete', error, { id });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to delete entity'
      );
    }
  }

  /**
   * Remove undefined values from data (Firestore doesn't accept undefined)
   */
  protected cleanData(data: any): any {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }
}
```

**Usage Example:**

```typescript
// lib/services/applications/application-service.ts
import { BaseService } from '../shared/base-service';
import { toApplication } from '../shared/firestore-converters';
import type { Application } from '@/types/database';

export class ApplicationService extends BaseService<Application> {
  protected collectionName = 'applications';
  protected serviceName = 'ApplicationService';
  
  protected toEntity(id: string, data: any): Application {
    return toApplication(id, data);
  }

  // Now only implement custom methods
  async getStudentApplications(studentId: string): Promise<Application[]> {
    return this.query([
      { field: 'studentId', operator: '==', value: studentId }
    ]);
  }

  // Inherit getById, create, update, delete from BaseService
}
```

**Benefits:**
- Reduces code duplication by ~60-70% in service files
- Ensures consistent error handling across all services
- Makes it easier to add cross-cutting concerns (logging, caching, etc.)
- Simplifies testing with mockable base class

**Best Practices for Using BaseService:**

1. **Custom Timestamp Fields:**
   - Use `timestampFields` parameter in `create()` for entities with non-standard timestamp field names
   - Example: `ApplicationService` uses `dateApplied`/`lastUpdated` instead of `createdAt`/`updatedAt`
   - Exclude timestamp fields from data passed to `create()` - they're handled automatically

2. **Error Handling:**
   - Use `queryWithResult()` when you need to distinguish between "no results" and "error occurred"
   - Use `query()` for simple cases where empty array on error is acceptable
   - Always check `ServiceResult.success` when using methods that return `ServiceResult`

3. **Validation:**
   - Override `validateBeforeCreate()` and `validateBeforeUpdate()` for custom validation logic
   - Throw errors from validation methods - they'll be caught and converted to ServiceResult errors

4. **Complex Queries:**
   - Use `getCollection()` helper for multi-query scenarios
   - Keep complex methods (like `getStudentApplications`) in service classes when they need custom logic
   - Use `query()` for simple filtered queries

5. **Protected vs Public Methods:**
   - Base methods (`getById`, `create`, `update`, `delete`) are protected
   - Create public wrapper methods that call protected base methods
   - This allows you to add custom logic or different method names if needed

6. **Type Safety:**
   - The `create()` method excludes timestamp fields from the input type
   - This ensures TypeScript prevents passing timestamp fields that will be overwritten
   - Always use `Omit<T, 'id'>` or exclude timestamp fields when calling `create()`

---

### 2. Unified Action Hook Pattern

**Current Issue:**
Multiple action hooks (`useApplicationActions`, `usePartnershipActions`, `useSupervisorApplicationActions`) follow nearly identical patterns:
- Similar loading state management using `Record<string, boolean>`
- Identical token retrieval logic
- Similar error/success callback handling
- Duplicated `isLoading` check logic

**Impact:** High - Affects 5+ action hooks with significant duplication

**Recommendation:**

Create a generic action handler hook:

```typescript
// lib/hooks/useActionHandler.ts
'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';

export interface ActionConfig {
  userId: string | null;
  onRefresh?: () => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface ActionDefinition<TParams = any, TResult = void> {
  key: string | ((params: TParams) => string);
  handler: (params: TParams, token: string) => Promise<TResult>;
  successMessage?: string | ((params: TParams) => string);
}

export function useActionHandler<TActions extends Record<string, ActionDefinition>>(
  config: ActionConfig,
  actions: TActions
) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const createAction = <TParams, TResult>(
    actionDef: ActionDefinition<TParams, TResult>
  ) => {
    return async (params: TParams) => {
      const key = typeof actionDef.key === 'function' 
        ? actionDef.key(params) 
        : actionDef.key;
      
      setLoading(key, true);

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token || !config.userId) {
          throw new Error('Not authenticated');
        }

        const result = await actionDef.handler(params, token);
        
        const successMsg = typeof actionDef.successMessage === 'function'
          ? actionDef.successMessage(params)
          : actionDef.successMessage || 'Operation completed successfully';
        
        config.onSuccess?.(successMsg);
        await config.onRefresh?.();
        
        return result;
      } catch (error: any) {
        const errorMsg = error.message || 'Operation failed';
        config.onError?.(errorMsg);
        throw error;
      } finally {
        setLoading(key, false);
      }
    };
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  // Create action handlers dynamically
  const handlers = Object.entries(actions).reduce((acc, [name, actionDef]) => {
    acc[name] = createAction(actionDef);
    return acc;
  }, {} as Record<string, any>);

  return {
    ...handlers,
    isLoading,
  };
}
```

**Usage Example:**

```typescript
// lib/hooks/useApplicationActions.ts
import { useActionHandler } from './useActionHandler';
import { apiClient } from '@/lib/api/client';

export function useApplicationActions(config: ActionConfig) {
  return useActionHandler(config, {
    submitApplication: {
      key: (params) => `submit-${params.supervisorId}`,
      handler: async (params, token) => {
        await apiClient.createApplication(params, token);
      },
      successMessage: 'Application submitted successfully!',
    },
    withdrawApplication: {
      key: (params) => `withdraw-${params}`,
      handler: async (applicationId, token) => {
        await apiClient.deleteApplication(applicationId, token);
      },
      successMessage: 'Application withdrawn successfully',
    },
  });
}
```

**Benefits:**
- Reduces hook code by ~70%
- Ensures consistent behavior across all action hooks
- Makes it easier to add features like retry logic, optimistic updates
- Type-safe action definitions

---

### 3. Centralize Date Formatting

**Current Issue:**
Date conversion and formatting logic is scattered across:
- Components: `application.dateApplied instanceof Date ? ... : (application.dateApplied as any)?.toDate?.()?.toLocaleDateString()`
- Services: `data.dateApplied?.toDate?.()?.toLocaleDateString() || 'N/A'`
- Utils: `formatFirestoreDate()` function exists but not consistently used
- Converters: `toDate()` helper in firestore-converters.ts

**Impact:** Medium-High - Affects 12+ files with date handling

**Recommendation:**

Create a comprehensive date formatting utility:

```typescript
// lib/utils/date-formatter.ts
import type { Timestamp } from 'firebase/firestore';

export type DateInput = Date | Timestamp | string | number | undefined | null;

export class DateFormatter {
  /**
   * Safely convert any date input to Date object
   */
  private static toDate(input: DateInput): Date | null {
    if (!input) return null;
    if (input instanceof Date) return input;
    if (typeof input === 'string') return new Date(input);
    if (typeof input === 'number') return new Date(input);
    
    // Firestore Timestamp
    if (typeof input === 'object' && 'toDate' in input) {
      return (input as { toDate: () => Date }).toDate();
    }
    
    return null;
  }

  /**
   * Format for Firestore display (legacy compatibility)
   */
  static formatFirestoreDate(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  }

  /**
   * Format for table display (compact)
   */
  static formatForTable(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format for card/display (readable)
   */
  static formatForDisplay(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Format with time
   */
  static formatWithTime(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Format relative time (e.g., "2 days ago")
   */
  static formatRelative(input: DateInput): string {
    const date = this.toDate(input);
    if (!date) return 'N/A';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Calculate days between dates
   */
  static calculateDaysBetween(start: DateInput, end: DateInput = new Date()): number {
    const startDate = this.toDate(start);
    const endDate = this.toDate(end);
    if (!startDate || !endDate) return 0;
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
```

**Usage Example:**

```typescript
// Before (in component):
const dateAppliedStr = application.dateApplied instanceof Date
  ? application.dateApplied.toLocaleDateString()
  : (application.dateApplied as any)?.toDate?.()?.toLocaleDateString() || 'N/A';

// After:
import { DateFormatter } from '@/lib/utils/date-formatter';
const dateAppliedStr = DateFormatter.formatForDisplay(application.dateApplied);
```

**Migration Plan:**
1. Create `DateFormatter` class
2. Update `formatFirestoreDate` in `lib/utils/date.ts` to use `DateFormatter`
3. Replace all inline date formatting in components
4. Update service methods to use `DateFormatter`
5. Remove duplicate date conversion logic

**Benefits:**
- Single source of truth for date formatting
- Consistent date display across the application
- Easier to change date format globally
- Better type safety with `DateInput` union type

---

### 4. Repository Pattern for Firestore

**Current Issue:**
Direct Firestore calls scattered across services make it hard to:
- Mock database operations for testing
- Add caching layer
- Switch database providers
- Add cross-cutting concerns (audit logging, etc.)

**Impact:** Medium-High - Improves testability and maintainability

**Recommendation:**

Create a repository layer that abstracts Firestore operations:

```typescript
// lib/repositories/base-repository.ts
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DocumentData } from 'firebase-admin/firestore';

export interface Filter {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export abstract class BaseRepository<T extends { id: string }> {
  protected abstract collectionName: string;
  protected abstract toEntity(id: string, data: DocumentData): T;

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const doc = await adminDb.collection(this.collectionName).doc(id).get();
      if (doc.exists) {
        return this.toEntity(doc.id, doc.data()!);
      }
      return null;
    } catch (error) {
      logger.error(`Repository.findById failed for ${this.collectionName}`, error);
      throw error;
    }
  }

  /**
   * Find all entities matching filters
   */
  async findAll(filters?: Filter[], sort?: Sort, limit?: number): Promise<T[]> {
    try {
      let query: FirebaseFirestore.Query = adminDb.collection(this.collectionName);
      
      if (filters) {
        filters.forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }
      
      if (sort) {
        query = query.orderBy(sort.field, sort.direction);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.toEntity(doc.id, doc.data()));
    } catch (error) {
      logger.error(`Repository.findAll failed for ${this.collectionName}`, error);
      throw error;
    }
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const cleanData = this.cleanData(data);
      const docRef = await adminDb.collection(this.collectionName).add({
        ...cleanData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      logger.error(`Repository.create failed for ${this.collectionName}`, error);
      throw error;
    }
  }

  /**
   * Update entity
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const cleanData = this.cleanData(data);
      await adminDb.collection(this.collectionName).doc(id).update({
        ...cleanData,
        updatedAt: new Date(),
      });
    } catch (error) {
      logger.error(`Repository.update failed for ${this.collectionName}`, error);
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    try {
      await adminDb.collection(this.collectionName).doc(id).delete();
    } catch (error) {
      logger.error(`Repository.delete failed for ${this.collectionName}`, error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async batchUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<void> {
    const batch = adminDb.batch();
    updates.forEach(({ id, data }) => {
      const ref = adminDb.collection(this.collectionName).doc(id);
      batch.update(ref, { ...this.cleanData(data), updatedAt: new Date() });
    });
    await batch.commit();
  }

  protected cleanData(data: any): any {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }
}
```

**Usage Example:**

```typescript
// lib/repositories/application-repository.ts
import { BaseRepository } from './base-repository';
import { toApplication } from '@/lib/services/shared/firestore-converters';
import type { Application } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class ApplicationRepository extends BaseRepository<Application> {
  protected collectionName = 'applications';
  
  protected toEntity(id: string, data: DocumentData): Application {
    return toApplication(id, data);
  }

  // Custom query methods
  async findByStudentId(studentId: string): Promise<Application[]> {
    return this.findAll([
      { field: 'studentId', operator: '==', value: studentId }
    ]);
  }

  async findPendingBySupervisorId(supervisorId: string): Promise<Application[]> {
    return this.findAll([
      { field: 'supervisorId', operator: '==', value: supervisorId },
      { field: 'status', operator: '==', value: 'pending' }
    ]);
  }
}
```

**Benefits:**
- Easier to mock for testing
- Can add caching layer without changing services
- Can switch database providers (e.g., to MongoDB) by changing repository implementation
- Centralized query logic
- Better separation of concerns

---

## Priority 2: Medium-Impact Improvements

### 5. Extract Query Builders

**Current Issue:**
Similar Firestore query patterns repeated across services with slight variations.

**Recommendation:**

```typescript
// lib/repositories/query-builder.ts
export class FirestoreQueryBuilder {
  private query: FirebaseFirestore.Query;
  
  constructor(collection: string) {
    this.query = adminDb.collection(collection);
  }

  where(field: string, operator: FirebaseFirestore.WhereFilterOp, value: any): this {
    this.query = this.query.where(field, operator, value);
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query = this.query.orderBy(field, direction);
    return this;
  }

  limit(count: number): this {
    this.query = this.query.limit(count);
    return this;
  }

  build(): FirebaseFirestore.Query {
    return this.query;
  }

  async execute<T>(mapper: (doc: QueryDocumentSnapshot) => T): Promise<T[]> {
    const snapshot = await this.query.get();
    return snapshot.docs.map(mapper);
  }
}
```

---

### 6. Component Composition Patterns

**Current Issue:**
Similar card/list patterns with slight variations (ApplicationCard, StudentCard, SupervisorCard).

**Recommendation:**

Create generic, composable components:

```typescript
// app/components/shared/DataCard.tsx
interface DataCardProps<T> {
  data: T;
  title: (item: T) => string;
  subtitle?: (item: T) => string;
  content: (item: T) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  variant?: 'default' | 'compact' | 'detailed';
}

export function DataCard<T>({ data, title, subtitle, content, actions, variant = 'default' }: DataCardProps<T>) {
  // Generic card implementation
}
```

---

### 7. API Response Transformers

**Current Issue:**
Inconsistent response shapes from API client.

**Recommendation:**

```typescript
// lib/api/transformers.ts
export const responseTransformers = {
  toApplication: (data: any): Application => {
    // Standardize application response
  },
  toStudent: (data: any): Student => {
    // Standardize student response
  },
  // ... other transformers
};
```

---

### 8. Validation Schema Registry

**Current Issue:**
Validation schemas may be duplicated or inconsistent.

**Recommendation:**

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const validationSchemas = {
  application: {
    create: z.object({
      supervisorId: z.string().min(1),
      projectTitle: z.string().min(1),
      // ... other fields
    }),
    update: z.object({
      // ... update schema
    }),
  },
  partnership: {
    request: z.object({
      targetStudentId: z.string().min(1),
    }),
  },
  // ... other schemas
} as const;
```

---

## Priority 3: Code Organization

### 9. Feature-Based Folder Structure

**Current Structure:**
```
lib/
  services/
    applications/
    partnerships/
  hooks/
    useApplicationActions.ts
    usePartnershipActions.ts
```

**Proposed Structure:**
```
lib/
  features/
    applications/
      - service.ts
      - hooks.ts
      - components.tsx
      - types.ts
      - validation.ts
      - repository.ts
    partnerships/
      - ...
```

**Benefits:**
- Related code is co-located
- Easier to find all code for a feature
- Better for feature flags and modular architecture

---

### 10. Extract Business Logic from Components

**Current Issue:**
`student/page.tsx` has 456 lines with complex state management, scroll logic, and business logic mixed together.

**Recommendation:**

```typescript
// lib/hooks/useStudentDashboardLogic.ts
export function useStudentDashboardLogic(userId: string | null) {
  // Extract all state management
  // Extract scroll logic
  // Extract application submission logic
  // Extract partnership logic
  
  return {
    // Simplified interface
    dashboardData,
    actions,
    uiState,
  };
}
```

Then the component becomes:

```typescript
export default function StudentAuthenticated() {
  const { dashboardData, actions, uiState } = useStudentDashboardLogic(userId);
  
  // Pure presentation logic
  return (
    <PageLayout>
      {/* Render UI */}
    </PageLayout>
  );
}
```

---

### 11. Error Boundary and Error Handling Utilities

**Recommendation:**

```typescript
// lib/utils/error-handler.ts
export class ErrorHandler {
  static handleApiError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }

  static handleServiceError(error: unknown): string {
    // Service-specific error handling
  }

  static logError(context: string, error: unknown): void {
    logger.error(`[${context}]`, error);
  }
}
```

---

### 12. Constants and Configuration Centralization

**Current:** Good use of constants, but verify completeness.

**Recommendation:**

```typescript
// lib/constants/index.ts
export * from './error-messages';
export * from './success-messages';
export * from './ui-constants';
export * from './api-constants';
export * from './validation-messages';
```

---

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
1. ✅ Create `DateFormatter` utility
2. ✅ Create `useActionHandler` hook
3. ✅ Migrate one service to use base service pattern
4. ✅ Create base repository class

### Phase 2: Migration (Weeks 3-4)
1. Migrate all action hooks to use `useActionHandler`
2. Replace all date formatting with `DateFormatter`
3. Migrate remaining services to base service pattern
4. Create repositories for main entities

### Phase 3: Enhancement (Weeks 5-6)
1. Extract business logic from large components
2. Implement query builders
3. Create component composition patterns
4. Add API response transformers

### Phase 4: Organization (Weeks 7-8)
1. Reorganize to feature-based structure (optional)
2. Add comprehensive error handling
3. Document all patterns
4. Create migration guide for team

---

## Quick Wins

These can be implemented immediately with minimal risk:

### 1. Date Formatting Centralization
- **Effort:** 2-3 hours
- **Impact:** High
- **Risk:** Low
- **Files affected:** ~12 files

### 2. Unified Action Hook
- **Effort:** 4-6 hours
- **Impact:** High
- **Risk:** Medium
- **Files affected:** 5+ hooks

### 3. Base Service Class
- **Effort:** 6-8 hours
- **Impact:** High
- **Risk:** Medium
- **Files affected:** 10+ services

### 4. Extract Component Logic
- **Effort:** 3-4 hours per component
- **Impact:** Medium
- **Risk:** Low
- **Start with:** `student/page.tsx`

---

## Code Examples

### Before: Scattered Date Formatting

```typescript
// In component
const dateStr = application.dateApplied instanceof Date
  ? application.dateApplied.toLocaleDateString()
  : (application.dateApplied as any)?.toDate?.()?.toLocaleDateString() || 'N/A';

// In service
dateApplied: data.dateApplied?.toDate?.()?.toLocaleDateString() || 'N/A',
```

### After: Centralized Date Formatting

```typescript
import { DateFormatter } from '@/lib/utils/date-formatter';

// Everywhere
const dateStr = DateFormatter.formatForDisplay(application.dateApplied);
```

---

### Before: Duplicated Action Hook

```typescript
// useApplicationActions.ts - 82 lines
export function useApplicationActions({ userId, onRefresh, onSuccess, onError }) {
  const [loadingStates, setLoadingStates] = useState({});
  // ... 50+ lines of similar code
}

// usePartnershipActions.ts - 141 lines
export function usePartnershipActions({ userId, onRefresh, onSuccess, onError }) {
  const [loadingStates, setLoadingStates] = useState({});
  // ... 100+ lines of similar code
}
```

### After: Unified Action Hook

```typescript
// useActionHandler.ts - Generic implementation
export function useActionHandler(config, actions) {
  // Single implementation
}

// useApplicationActions.ts - 20 lines
export function useApplicationActions(config) {
  return useActionHandler(config, {
    submitApplication: { /* definition */ },
    withdrawApplication: { /* definition */ },
  });
}
```

---

### Before: Service with Duplication

```typescript
// ApplicationService - 230 lines
export const ApplicationService = {
  async getApplicationById(id: string) {
    try {
      const doc = await adminDb.collection('applications').doc(id).get();
      if (doc.exists) {
        return toApplication(doc.id, doc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error('ApplicationService', 'getApplicationById', error, { id });
      return null;
    }
  },
  
  async createApplication(data) {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );
      const docRef = await adminDb.collection('applications').add({
        ...cleanData,
        dateApplied: new Date(),
        lastUpdated: new Date(),
      });
      return ServiceResults.success(docRef.id, 'Application created successfully');
    } catch (error) {
      logger.service.error('ApplicationService', 'createApplication', error, { data });
      return ServiceResults.error(error.message || 'Failed to create application');
    }
  },
  // ... more similar methods
};
```

### After: Service with Base Class

```typescript
// ApplicationService - 80 lines
export class ApplicationService extends BaseService<Application> {
  protected collectionName = 'applications';
  protected serviceName = 'ApplicationService';
  
  protected toEntity(id: string, data: any): Application {
    return toApplication(id, data);
  }

  // Only custom methods
  async getStudentApplications(studentId: string): Promise<Application[]> {
    return this.query([
      { field: 'studentId', operator: '==', value: studentId }
    ]);
  }
  
  // getById, create, update, delete inherited from BaseService
}
```

---

## Testing Strategy

For each refactoring:

1. **Write tests first** (if possible) or immediately after
2. **Test the abstraction** (base class, hook, utility)
3. **Test migration** (ensure existing functionality still works)
4. **Integration tests** (ensure components still work with new abstractions)

---

## Migration Checklist

- [ ] Create `DateFormatter` utility
- [ ] Migrate all date formatting calls
- [ ] Create `useActionHandler` hook
- [ ] Migrate `useApplicationActions`
- [ ] Migrate `usePartnershipActions`
- [ ] Migrate other action hooks
- [x] Create `BaseService` class ✅
- [x] Migrate `ApplicationService` ✅
- [x] Migrate other services ✅ (UserService, StudentService, SupervisorService, AdminService, ProjectService)
- [ ] Create `BaseRepository` class
- [ ] Create repository implementations
- [ ] Extract business logic from `student/page.tsx`
- [ ] Extract business logic from other large components
- [ ] Create query builders
- [ ] Add API response transformers
- [ ] Update documentation
- [ ] Create team migration guide

---

## Notes

- **Incremental Migration**: Don't try to refactor everything at once. Do one service/hook at a time.
- **Backward Compatibility**: Keep old code working while migrating. Use feature flags if needed.
- **Testing**: Add tests for new abstractions before migrating existing code.
- **Documentation**: Update JSDoc comments and README as you go.
- **Code Reviews**: Have team review new patterns before widespread adoption.

---

## Questions or Concerns?

If you have questions about any of these recommendations or need clarification on implementation details, please discuss with the team before proceeding.

---

**Last Updated:** 2026-01-03  
**Status:** Partially Implemented - BaseService Pattern Complete (PR #55)

### Implementation Status

✅ **Completed:**
- BaseService pattern implemented and all services migrated (PR #55)
- Custom timestamp field handling
- Error handling improvements
- Validation hooks
- Type safety enhancements

⏳ **In Progress:**
- None currently

📋 **Pending:**
- Date formatting centralization
- Unified action hook pattern
- Repository pattern
- Component logic extraction

