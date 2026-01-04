/**
 * In-Memory Firestore Store
 * 
 * Firestore-compatible interface for in-memory database.
 * Provides the same API as Firebase Admin Firestore.
 */

import { testDatabase, type QueryFilter, type QuerySort } from './index';
import type { DocumentData } from 'firebase-admin/firestore';

export interface DocumentSnapshot {
  id: string;
  data(): DocumentData | undefined;
  exists: boolean;
}

export interface QuerySnapshot {
  docs: DocumentSnapshot[];
  empty: boolean;
  size: number;
}

export interface DocumentReference {
  id: string;
  path: string;
  get(): Promise<DocumentSnapshot>;
  set(data: DocumentData): Promise<void>;
  update(data: Partial<DocumentData>): Promise<void>;
  delete(): Promise<void>;
}

export interface CollectionReference {
  id: string;
  path: string;
  doc(id?: string): DocumentReference;
  add(data: DocumentData): Promise<DocumentReference>;
  get(): Promise<QuerySnapshot>;
  where(field: string, op: string, value: any): Query;
  orderBy(field: string, direction?: 'asc' | 'desc'): Query;
  limit(limit: number): Query;
}

export interface Query {
  where(field: string, op: string, value: any): Query;
  orderBy(field: string, direction?: 'asc' | 'desc'): Query;
  limit(limit: number): Query;
  get(): Promise<QuerySnapshot>;
}

export interface WriteBatch {
  set(ref: DocumentReference, data: DocumentData): WriteBatch;
  update(ref: DocumentReference, data: Partial<DocumentData>): WriteBatch;
  delete(ref: DocumentReference): WriteBatch;
  commit(): Promise<void>;
}

class TestDocumentReference implements DocumentReference {
  constructor(
    public id: string,
    public path: string,
    private collectionName: string
  ) {}

  async get(): Promise<DocumentSnapshot> {
    const data = testDatabase.get(this.collectionName, this.id);
    return {
      id: this.id,
      data: () => {
        if (!data) return undefined;
        // Remove the id field from data since it's already in the snapshot
        // But keep all other fields including userId if present
        const { id: _, ...dataWithoutId } = data;
        return dataWithoutId as DocumentData;
      },
      exists: data !== null,
    };
  }

  async set(data: DocumentData): Promise<void> {
    testDatabase.set(this.collectionName, this.id, data);
  }

  async update(data: Partial<DocumentData>): Promise<void> {
    const existing = testDatabase.get(this.collectionName, this.id);
    if (!existing) {
      throw new Error(`Document ${this.id} does not exist`);
    }
    // Merge with existing data, preserving id
    const { id: _, ...existingWithoutId } = existing;
    testDatabase.set(this.collectionName, this.id, { ...existingWithoutId, ...data });
  }

  async delete(): Promise<void> {
    testDatabase.delete(this.collectionName, this.id);
  }
}

class TestQuery implements Query {
  private filters: QueryFilter[] = [];
  private sort?: QuerySort;
  private limitValue?: number;

  constructor(private collectionName: string) {}

  where(field: string, op: string, value: any): Query {
    this.filters.push({ field, operator: op as any, value });
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): Query {
    this.sort = { field, direction };
    return this;
  }

  limit(limit: number): Query {
    this.limitValue = limit;
    return this;
  }

  async get(): Promise<QuerySnapshot> {
    const results = testDatabase.query(
      this.collectionName,
      this.filters,
      this.sort,
      this.limitValue
    );

    const docs = results.map((data) => ({
      id: data.id || data.id,
      data: () => data,
      exists: true,
    }));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

class TestCollectionReference implements CollectionReference {
  constructor(public id: string, public path: string) {}

  doc(id?: string): DocumentReference {
    const docId = id || this.generateId();
    return new TestDocumentReference(docId, `${this.path}/${docId}`, this.id);
  }

  async add(data: DocumentData): Promise<DocumentReference> {
    const docId = testDatabase.add(this.id, data);
    return new TestDocumentReference(docId, `${this.path}/${docId}`, this.id);
  }

  async get(): Promise<QuerySnapshot> {
    const results = testDatabase.getAll(this.id);
    const docs = results.map((data) => {
      const { id, ...dataWithoutId } = data;
      return {
        id: id || data.id,
        data: () => dataWithoutId as DocumentData,
        exists: true,
      };
    });

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }

  where(field: string, op: string, value: any): Query {
    const query = new TestQuery(this.id);
    return query.where(field, op, value);
  }

  orderBy(field: string, direction?: 'asc' | 'desc'): Query {
    const query = new TestQuery(this.id);
    return query.orderBy(field, direction);
  }

  limit(limit: number): Query {
    const query = new TestQuery(this.id);
    return query.limit(limit);
  }

  private generateId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 20; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}

class TestWriteBatch implements WriteBatch {
  private operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: DocumentReference;
    data?: DocumentData | Partial<DocumentData>;
  }> = [];

  set(ref: DocumentReference, data: DocumentData): WriteBatch {
    this.operations.push({ type: 'set', ref, data });
    return this;
  }

  update(ref: DocumentReference, data: Partial<DocumentData>): WriteBatch {
    this.operations.push({ type: 'update', ref, data });
    return this;
  }

  delete(ref: DocumentReference): WriteBatch {
    this.operations.push({ type: 'delete', ref });
    return this;
  }

  async commit(): Promise<void> {
    for (const op of this.operations) {
      if (op.type === 'set') {
        await op.ref.set(op.data!);
      } else if (op.type === 'update') {
        await op.ref.update(op.data!);
      } else if (op.type === 'delete') {
        await op.ref.delete();
      }
    }
    this.operations = [];
  }
}

/**
 * In-memory Firestore implementation
 */
export class InMemoryFirestore {
  collection(collectionName: string): CollectionReference {
    return new TestCollectionReference(collectionName, collectionName);
  }

  batch(): WriteBatch {
    return new TestWriteBatch();
  }

  clearAll(): void {
    testDatabase.clearAll();
  }
}

// Singleton instance
export const testFirestore = new InMemoryFirestore();

