// Shared test utilities for Firebase Services tests

import {
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  collection,
  doc,
} from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  Timestamp: jest.fn(),
}));

// Mock Firebase db
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

/**
 * Sets up common mocks for Firebase Firestore operations
 */
export function setupFirestoreMocks() {
  jest.clearAllMocks();
  (doc as jest.Mock).mockReturnValue({ id: 'mock-doc-ref' });
  (collection as jest.Mock).mockReturnValue({ id: 'mock-collection-ref' });
}

/**
 * Creates a mock Firestore document snapshot
 */
export function createMockDoc(exists: boolean, data?: any, id?: string) {
  return {
    exists: () => exists,
    data: () => data,
    id: id || 'mock-id',
  };
}

/**
 * Creates a mock Firestore query snapshot
 */
export function createMockQuerySnapshot(docs: any[]) {
  return {
    docs: docs.map(data => createMockDoc(true, data)),
    size: docs.length,
  };
}

/**
 * Creates a mock Firestore Timestamp object
 */
export function createMockTimestamp(date: Date) {
  return {
    toDate: jest.fn(() => date),
  };
}

export {
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  collection,
  doc,
};

