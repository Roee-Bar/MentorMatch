// lib/repositories/base-repository.ts

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { DocumentData } from 'firebase-admin/firestore';

export type RepositoryFilter = {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
};

export type RepositorySort = {
  field: string;
  direction: 'asc' | 'desc';
};

/**
 * Base repository class that abstracts Firestore operations
 * All repositories should extend this class to provide consistent data access
 * 
 * @template T - The entity type that must have an 'id' field
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected abstract collectionName: string;
  protected abstract repositoryName: string;
  
  protected abstract toEntity(id: string, data: DocumentData): T;

  protected getCollection(): FirebaseFirestore.CollectionReference {
    return adminDb.collection(this.collectionName);
  }

  async findById(id: string): Promise<T | null> {
    try {
      const doc = await this.getCollection().doc(id).get();
      if (doc.exists) {
        return this.toEntity(doc.id, doc.data()!);
      }
      return null;
    } catch (error) {
      logger.error(`Repository.findById failed for ${this.repositoryName}`, error, {
        data: { id, collection: this.collectionName },
      });
      throw error;
    }
  }

  async findAll(
    filters?: RepositoryFilter[],
    sort?: RepositorySort,
    limit?: number
  ): Promise<T[]> {
    try {
      let query: FirebaseFirestore.Query = this.getCollection();
      
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
      logger.error(`Repository.findAll failed for ${this.repositoryName}`, error, {
        data: { filters, sort, limit, collection: this.collectionName },
      });
      throw error;
    }
  }

  async create(
    data: Omit<T, 'id'>,
    timestampFields?: { createdAt?: string; updatedAt?: string }
  ): Promise<string> {
    try {
      const cleanData = this.cleanData(data);
      const createdAtField = timestampFields?.createdAt || 'createdAt';
      const updatedAtField = timestampFields?.updatedAt || 'updatedAt';
      
      const docRef = await this.getCollection().add({
        ...cleanData,
        [createdAtField]: new Date(),
        [updatedAtField]: new Date(),
      });
      
      return docRef.id;
    } catch (error) {
      logger.error(`Repository.create failed for ${this.repositoryName}`, error, {
        data: { data, collection: this.collectionName },
      });
      throw error;
    }
  }

  async set(
    id: string,
    data: Omit<T, 'id'>,
    timestampFields?: { createdAt?: string; updatedAt?: string }
  ): Promise<void> {
    try {
      const cleanData = this.cleanData(data);
      const createdAtField = timestampFields?.createdAt || 'createdAt';
      const updatedAtField = timestampFields?.updatedAt || 'updatedAt';
      
      await this.getCollection().doc(id).set({
        ...cleanData,
        [createdAtField]: new Date(),
        [updatedAtField]: new Date(),
      });
    } catch (error) {
      logger.error(`Repository.set failed for ${this.repositoryName}`, error, {
        data: { id, data, collection: this.collectionName },
      });
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<T>,
    timestampField?: string
  ): Promise<void> {
    try {
      const cleanData = this.cleanData(data);
      const updatedAtField = timestampField || 'updatedAt';
      
      await this.getCollection().doc(id).update({
        ...cleanData,
        [updatedAtField]: new Date(),
      });
    } catch (error) {
      logger.error(`Repository.update failed for ${this.repositoryName}`, error, {
        data: { id, data, collection: this.collectionName },
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.getCollection().doc(id).delete();
    } catch (error) {
      logger.error(`Repository.delete failed for ${this.repositoryName}`, error, {
        data: { id, collection: this.collectionName },
      });
      throw error;
    }
  }

  async batchUpdate(
    updates: Array<{ id: string; data: Partial<T> }>,
    timestampField?: string
  ): Promise<void> {
    const batch = adminDb.batch();
    const updatedAtField = timestampField || 'updatedAt';
    
    updates.forEach(({ id, data }) => {
      const ref = this.getCollection().doc(id);
      batch.update(ref, {
        ...this.cleanData(data),
        [updatedAtField]: new Date(),
      });
    });
    
    await batch.commit();
  }

  getDocumentRef(id: string): FirebaseFirestore.DocumentReference {
    return this.getCollection().doc(id);
  }

  getNewDocumentRef(): FirebaseFirestore.DocumentReference {
    return this.getCollection().doc();
  }

  buildQuery(): FirebaseFirestore.Query {
    return this.getCollection();
  }

  protected cleanData(data: any): any {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }
}

