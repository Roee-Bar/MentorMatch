// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

/**
 * Mock Firebase modules globally to prevent real Firebase connections during tests
 * This must be done before any Firebase modules are imported
 */
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
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
}));

/**
 * Mock Web APIs for Next.js Server Components
 * 
 * Next.js server components use Web APIs like Request and Response
 * that aren't available in Node.js environment by default.
 */
if (typeof Request === 'undefined') {
  global.Request = class Request {};
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || '';
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }
  };
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers extends Map {};
}

/**
 * Mock fetch API for Firebase and other services
 * 
 * Firebase client SDK expects fetch to be available in the environment.
 * This mock provides basic fetch functionality for tests.
 */
if (typeof fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: new Map(),
    })
  );
}

/**
 * Console Warning Suppression
 * 
 * This configuration suppresses React's "not wrapped in act()" warnings that commonly
 * appear in async component tests. These warnings occur when state updates happen
 * after a component test completes but before React's test utilities can properly
 * track them.
 * 
 * WHY THIS EXISTS:
 * - Our dashboard components use useEffect with async data fetching
 * - The auth state listener (onAuthChange) triggers state updates asynchronously
 * - These patterns are correct in production but create timing issues in tests
 * 
 * IMPORTANT: This suppression should be temporary. The proper fix is to:
 * 1. Ensure all async operations complete before test assertions
 * 2. Use waitFor() to properly wait for state updates
 * 3. Mock timers and auth listeners to have synchronous behavior in tests
 * 
 * TODO: Refactor tests to properly handle async auth state changes and remove
 * this suppression once all tests pass without warnings.
 * 
 * @see https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning
 */
const originalError = console.error;
console.error = (...args) => {
  // Only suppress the specific "not wrapped in act" warning
  if (
    typeof args[0] === 'string' &&
    args[0].includes('not wrapped in act')
  ) {
    return;
  }
  originalError.call(console, ...args);
};
