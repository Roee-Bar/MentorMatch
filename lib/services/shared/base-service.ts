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
  protected abstract collectionName: string;
  protected abstract serviceName: string;
  protected abstract toEntity(id: string, data: any): T;

  protected async validateBeforeCreate(data: Omit<T, 'id'>): Promise<void> {
    // Override in subclasses for custom validation
  }

  protected async validateBeforeUpdate(id: string, updates: Partial<T>): Promise<void> {
    // Override in subclasses for custom validation
  }

  protected getCollection(): FirebaseFirestore.CollectionReference {
    return adminDb.collection(this.collectionName);
  }

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

  protected cleanData(data: any): any {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }

  protected mapDocuments<U>(
    docs: QueryDocumentSnapshot[],
    mapper: (doc: QueryDocumentSnapshot) => U
  ): U[] {
    return docs.map(mapper);
  }
}

