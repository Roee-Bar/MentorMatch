import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function for integration tests
 * Can be extended with providers (Router, Context, etc.) as needed
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Wait for loading to finish by checking if loading text is gone
 */
export async function waitForLoadingToFinish(
  getByText: (text: string | RegExp) => HTMLElement,
  queryByText: (text: string | RegExp) => HTMLElement | null
) {
  // Wait a bit for loading to potentially appear
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  // Wait for loading text to disappear if it exists
  const loadingText = queryByText(/loading/i);
  if (loadingText) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Mock authentication state helper
 */
export function mockAuthState(user: any | null = null) {
  return {
    onAuthChange: jest.fn((callback) => {
      // Immediately call the callback with the user
      setTimeout(() => callback(user), 0);
      return jest.fn(); // Return unsubscribe function
    }),
    getUserProfile: jest.fn((uid: string) =>
      Promise.resolve({
        success: true,
        data: user || {
          id: uid,
          name: 'Test User',
          email: 'test@example.com',
          role: 'student',
        },
      })
    ),
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
}

/**
 * Create mock user for testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-123',
    uid: 'test-user-123',
    name: 'Test Student',
    email: 'student@braude.ac.il',
    role: 'student',
    profileImage: '/test-profile.jpg',
    studentId: 'STU-001',
    degree: 'B.Sc. Software Engineering',
    ...overrides,
  };
}

/**
 * Create mock Firebase auth user
 */
export function createMockAuthUser(overrides = {}) {
  return {
    uid: 'test-user-123',
    email: 'student@braude.ac.il',
    emailVerified: true,
    ...overrides,
  };
}

/**
 * Mock Next.js router
 */
export function mockRouter(overrides = {}) {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

