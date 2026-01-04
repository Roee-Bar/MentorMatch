/**
 * In-Memory Test Database
 * 
 * Simple Map-based storage for E2E tests.
 * Replaces Firebase emulators with fast, reliable in-memory storage.
 */

export type WhereFilterOp = 
  | '<' 
  | '<=' 
  | '==' 
  | '!=' 
  | '>=' 
  | '>' 
  | 'array-contains' 
  | 'in' 
  | 'array-contains-any' 
  | 'not-in';

export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * In-memory database using nested Maps
 * Structure: Map<collectionName, Map<docId, data>>
 */
export class InMemoryDatabase {
  private collections: Map<string, Map<string, any>> = new Map();

  /**
   * Get or create a collection
   */
  private getCollection(collectionName: string): Map<string, any> {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    return this.collections.get(collectionName)!;
  }

  /**
   * Set a document in a collection
   */
  set(collectionName: string, docId: string, data: any): void {
    const collection = this.getCollection(collectionName);
    collection.set(docId, { ...data, id: docId });
  }

  /**
   * Get a document from a collection
   */
  get(collectionName: string, docId: string): any | null {
    const collection = this.getCollection(collectionName);
    return collection.get(docId) || null;
  }

  /**
   * Delete a document from a collection
   */
  delete(collectionName: string, docId: string): boolean {
    const collection = this.getCollection(collectionName);
    return collection.delete(docId);
  }

  /**
   * Add a new document (generates ID)
   */
  add(collectionName: string, data: any): string {
    const collection = this.getCollection(collectionName);
    const docId = this.generateId();
    collection.set(docId, { ...data, id: docId });
    return docId;
  }

  /**
   * Query documents with filters, sorting, and limit
   */
  query(
    collectionName: string,
    filters?: QueryFilter[],
    sort?: QuerySort,
    limit?: number
  ): any[] {
    const collection = this.getCollection(collectionName);
    let results = Array.from(collection.values());

    // Apply filters
    if (filters && filters.length > 0) {
      results = results.filter(doc => {
        return filters.every(filter => {
          const fieldValue = this.getNestedValue(doc, filter.field);
          return this.matchesFilter(fieldValue, filter.operator, filter.value);
        });
      });
    }

    // Apply sorting
    if (sort) {
      results.sort((a, b) => {
        const aValue = this.getNestedValue(a, sort.field);
        const bValue = this.getNestedValue(b, sort.field);
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Apply limit
    if (limit !== undefined) {
      results = results.slice(0, limit);
    }

    return results;
  }

  /**
   * Get all documents in a collection
   */
  getAll(collectionName: string): any[] {
    const collection = this.getCollection(collectionName);
    return Array.from(collection.values());
  }

  /**
   * Clear a collection
   */
  clearCollection(collectionName: string): void {
    const collection = this.getCollection(collectionName);
    collection.clear();
  }

  /**
   * Clear all collections
   */
  clearAll(): void {
    this.collections.clear();
  }

  /**
   * Check if a document exists
   */
  exists(collectionName: string, docId: string): boolean {
    const collection = this.getCollection(collectionName);
    return collection.has(docId);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Check if a value matches a filter
   */
  private matchesFilter(fieldValue: any, operator: WhereFilterOp, filterValue: any): boolean {
    switch (operator) {
      case '==':
        return fieldValue === filterValue;
      case '!=':
        return fieldValue !== filterValue;
      case '<':
        return fieldValue < filterValue;
      case '<=':
        return fieldValue <= filterValue;
      case '>':
        return fieldValue > filterValue;
      case '>=':
        return fieldValue >= filterValue;
      case 'array-contains':
        return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(fieldValue);
      case 'array-contains-any':
        return Array.isArray(fieldValue) && 
               Array.isArray(filterValue) &&
               filterValue.some(val => fieldValue.includes(val));
      case 'not-in':
        return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Generate a simple ID (similar to Firestore auto-IDs)
   */
  private generateId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 20; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}

// Singleton instance for test database
export const testDatabase = new InMemoryDatabase();

