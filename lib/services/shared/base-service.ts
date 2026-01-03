// lib/services/shared/base-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Base service class providing common CRUD operations

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ServiceResults } from './types';
import type { ServiceResult } from './types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Query condition type for better type safety and readability
 */
export type QueryCondition = {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
};

/**
 * Base service class that provides common CRUD operations
 * All services should extend this class to reduce code duplication
 * 
 * @template T - The entity type that must have an 'id' field
 */
export abstract class BaseService<T extends { id: string }> {
  /**
   * The Firestore collection name (e.g., 'applications', 'students')
   * Must be implemented by subclasses
   */
  protected abstract collectionName: string;

  /**
   * The service name for logging (e.g., 'ApplicationService')
   * Must be implemented by subclasses
   */
  protected abstract serviceName: string;

  /**
   * Convert Firestore document to entity type
   * Must be implemented by subclasses
   * 
   * @param id - Document ID
   * @param data - Document data from Firestore
   */
  protected abstract toEntity(id: string, data: any): T;

  /**
   * Validate data before creation (override in subclasses for custom validation)
   * 
   * @param data - Entity data to validate
   * @throws Error if validation fails
   */
  protected async validateBeforeCreate(data: Omit<T, 'id'>): Promise<void> {
    // Default: no validation
    // Subclasses can override for custom validation
  }

  /**
   * Validate updates before applying (override in subclasses for custom validation)
   * 
   * @param id - Entity ID
   * @param updates - Updates to validate
   * @throws Error if validation fails
   */
  protected async validateBeforeUpdate(id: string, updates: Partial<T>): Promise<void> {
    // Default: no validation
    // Subclasses can override for custom validation
  }

  /**
   * Get collection reference (for complex multi-query scenarios)
   * 
   * @returns Firestore collection reference
   */
  protected getCollection(): FirebaseFirestore.CollectionReference {
    return adminDb.collection(this.collectionName);
  }

  /**
   * Get entity by ID
   * Returns null if not found or on error
   */
  protected async getById(id: string): Promise<T | null> {
    try {
      const doc = await adminDb.collection(this.collectionName).doc(id).get();
      if (doc.exists) {
        return this.toEntity(doc.id, doc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(this.serviceName, 'getById', error, { 
        id,
        collection: this.collectionName,
        operation: 'getById'
      });
      return null;
    }
  }

  /**
   * Get entity by ID with ServiceResult for error distinction
   * Use this when you need to distinguish between "not found" and "error occurred"
   */
  protected async getByIdWithResult(id: string): Promise<ServiceResult<T | null>> {
    try {
      const doc = await adminDb.collection(this.collectionName).doc(id).get();
      if (doc.exists) {
        const entity = this.toEntity(doc.id, doc.data()!);
        return ServiceResults.success(entity);
      }
      return ServiceResults.success(null);
    } catch (error) {
      logger.service.error(this.serviceName, 'getByIdWithResult', error, { 
        id,
        collection: this.collectionName,
        operation: 'getByIdWithResult'
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to get entity by ID'
      );
    }
  }

  /**
   * Get all entities in the collection
   * Returns empty array on error
   */
  protected async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await adminDb.collection(this.collectionName).get();
      return querySnapshot.docs.map((doc) => this.toEntity(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(this.serviceName, 'getAll', error, {
        collection: this.collectionName,
        operation: 'getAll'
      });
      return [];
    }
  }

  /**
   * Query entities with filters (returns ServiceResult for error handling)
   * Use this when you need to distinguish between "no results" and "error occurred"
   * 
   * @param conditions - Array of filter conditions
   * @param orderBy - Optional sorting configuration
   * @param limit - Optional limit on results
   * @returns ServiceResult with array of entities or error
   */
  protected async queryWithResult(
    conditions: QueryCondition[],
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number
  ): Promise<ServiceResult<T[]>> {
    try {
      let query: FirebaseFirestore.Query = adminDb.collection(this.collectionName);
      
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      const results = snapshot.docs.map(doc => this.toEntity(doc.id, doc.data()));
      return ServiceResults.success(results);
    } catch (error) {
      logger.service.error(this.serviceName, 'queryWithResult', error, { 
        conditions,
        collection: this.collectionName,
        operation: 'queryWithResult',
        orderBy,
        limit
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to query entities'
      );
    }
  }

  /**
   * Query entities with filters
   * Returns empty array on error (for backward compatibility)
   * Use `queryWithResult()` if you need to distinguish between "no results" and "error occurred"
   * 
   * @param conditions - Array of filter conditions
   * @param orderBy - Optional sorting configuration
   * @param limit - Optional limit on results
   * @returns Array of entities (empty array if error or no results)
   */
  protected async query(
    conditions: QueryCondition[],
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number
  ): Promise<T[]> {
    const result = await this.queryWithResult(conditions, orderBy, limit);
    if (!result.success) {
      // Log warning so errors aren't completely silent
      logger.service.warn(
        this.serviceName,
        'query',
        `Query failed, returning empty array: ${result.error}`,
        {
          conditions,
          collection: this.collectionName,
          operation: 'query',
          orderBy,
          limit
        }
      );
    }
    return result.success ? (result.data || []) : [];
  }

  /**
   * Create new entity
   * 
   * @param data - Entity data without id and timestamp fields (timestamp fields are handled internally)
   * @param timestampFields - Optional custom timestamp field names (defaults to createdAt/updatedAt)
   * @returns ServiceResult with entity ID on success
   */
  protected async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'dateApplied' | 'lastUpdated'>,
    timestampFields?: { createdAt?: string; updatedAt?: string }
  ): Promise<ServiceResult<string>> {
    try {
      // Validate before creation
      await this.validateBeforeCreate(data as Omit<T, 'id'>);
      
      const cleanData = this.cleanData(data);
      const createdAtField = timestampFields?.createdAt || 'createdAt';
      const updatedAtField = timestampFields?.updatedAt || 'updatedAt';
      
      const docRef = await adminDb.collection(this.collectionName).add({
        ...cleanData,
        [createdAtField]: new Date(),
        [updatedAtField]: new Date(),
      });
      
      return ServiceResults.success(docRef.id, `${this.serviceName} created successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'create', error, { 
        data,
        collection: this.collectionName,
        operation: 'create'
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create entity'
      );
    }
  }

  /**
   * Update entity
   * 
   * @param id - Entity ID
   * @param updates - Partial entity data to update
   * @param timestampField - Optional custom timestamp field name (defaults to updatedAt)
   * @returns ServiceResult indicating success or failure
   */
  protected async update(
    id: string,
    updates: Partial<T>,
    timestampField?: string
  ): Promise<ServiceResult> {
    try {
      // Validate before update
      await this.validateBeforeUpdate(id, updates);
      
      const cleanUpdates = this.cleanData(updates);
      const updatedAtField = timestampField || 'updatedAt';
      
      await adminDb.collection(this.collectionName).doc(id).update({
        ...cleanUpdates,
        [updatedAtField]: new Date(),
      });
      
      return ServiceResults.success(undefined, `${this.serviceName} updated successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'update', error, { 
        id,
        collection: this.collectionName,
        operation: 'update'
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update entity'
      );
    }
  }

  /**
   * Delete entity
   * 
   * @param id - Entity ID to delete
   * @returns ServiceResult indicating success or failure
   */
  protected async delete(id: string): Promise<ServiceResult> {
    try {
      await adminDb.collection(this.collectionName).doc(id).delete();
      return ServiceResults.success(undefined, `${this.serviceName} deleted successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'delete', error, { 
        id,
        collection: this.collectionName,
        operation: 'delete'
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to delete entity'
      );
    }
  }

  /**
   * Remove undefined values from data (Firestore doesn't accept undefined)
   * Also handles null values if needed
   */
  protected cleanData(data: any): any {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }

  /**
   * Map Firestore documents to a custom type
   * Useful for methods that return card data or other transformed types
   */
  protected mapDocuments<U>(
    docs: QueryDocumentSnapshot[],
    mapper: (doc: QueryDocumentSnapshot) => U
  ): U[] {
    return docs.map(mapper);
  }
}

