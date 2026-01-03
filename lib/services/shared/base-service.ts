// lib/services/shared/base-service.ts

import { logger } from '@/lib/logger';
import { ServiceResults } from './types';
import type { ServiceResult } from './types';
import type { BaseRepository } from '@/lib/repositories/base-repository';
import type { RepositoryFilter, RepositorySort } from '@/lib/repositories/base-repository';

/**
 * Base service class that provides common CRUD operations
 * All services should extend this class to reduce code duplication
 * Now uses repositories for data access instead of direct Firestore calls
 * 
 * @template T - The entity type that must have an 'id' field
 */
export abstract class BaseService<T extends { id: string }> {
  protected abstract serviceName: string;
  protected abstract repository: BaseRepository<T>;

  protected async validateBeforeCreate(data: Omit<T, 'id'>): Promise<void> {
    // Override in subclasses for custom validation
  }

  protected async validateBeforeUpdate(id: string, updates: Partial<T>): Promise<void> {
    // Override in subclasses for custom validation
  }

  protected async getById(id: string): Promise<T | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      logger.service.error(this.serviceName, 'getById', error, { id });
      return null;
    }
  }

  protected async getByIdWithResult(id: string): Promise<ServiceResult<T | null>> {
    try {
      const entity = await this.repository.findById(id);
      return ServiceResults.success(entity);
    } catch (error) {
      logger.service.error(this.serviceName, 'getByIdWithResult', error, { id });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to get entity by ID'
      );
    }
  }

  protected async getAll(): Promise<T[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      logger.service.error(this.serviceName, 'getAll', error);
      return [];
    }
  }

  protected async queryWithResult(
    conditions: RepositoryFilter[],
    orderBy?: RepositorySort,
    limit?: number
  ): Promise<ServiceResult<T[]>> {
    try {
      const results = await this.repository.findAll(conditions, orderBy, limit);
      return ServiceResults.success(results);
    } catch (error) {
      logger.service.error(this.serviceName, 'queryWithResult', error, { 
        conditions,
        orderBy,
        limit
      });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to query entities'
      );
    }
  }

  protected async query(
    conditions: RepositoryFilter[],
    orderBy?: RepositorySort,
    limit?: number
  ): Promise<T[]> {
    const result = await this.queryWithResult(conditions, orderBy, limit);
    if (!result.success) {
      logger.service.warn(
        this.serviceName,
        'query',
        `Query failed, returning empty array: ${result.error}`,
        { conditions, orderBy, limit }
      );
    }
    return result.success ? (result.data || []) : [];
  }

  protected async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'dateApplied' | 'lastUpdated'>,
    timestampFields?: { createdAt?: string; updatedAt?: string }
  ): Promise<ServiceResult<string>> {
    try {
      await this.validateBeforeCreate(data as Omit<T, 'id'>);
      
      const id = await this.repository.create(data as Omit<T, 'id'>, timestampFields);
      return ServiceResults.success(id, `${this.serviceName} created successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'create', error, { data });
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
      await this.validateBeforeUpdate(id, updates);
      await this.repository.update(id, updates, timestampField);
      return ServiceResults.success(undefined, `${this.serviceName} updated successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'update', error, { id, updates });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update entity'
      );
    }
  }

  protected async delete(id: string): Promise<ServiceResult> {
    try {
      await this.repository.delete(id);
      return ServiceResults.success(undefined, `${this.serviceName} deleted successfully`);
    } catch (error) {
      logger.service.error(this.serviceName, 'delete', error, { id });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to delete entity'
      );
    }
  }
}

