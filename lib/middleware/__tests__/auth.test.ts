/**
 * [Unit] Authentication Middleware Tests
 * 
 * Tests for Firebase Admin token verification and role-based authorization
 */

// Mock Firebase Admin before any imports
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
}));

// Mock getUserProfile from auth lib
jest.mock('@/lib/auth', () => ({
  getUserProfile: jest.fn(),
}));

import { verifyAuth, requireRole } from '../auth';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserProfile } from '@/lib/auth';

// Helper function to create a mock NextRequest
function createMockRequest(url: string, headers?: Record<string, string>) {
  return {
    url,
    headers: {
      get: (name: string) => headers?.[name.toLowerCase()] || null,
    },
  } as any;
}

describe('[Unit] Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAuth', () => {
    it('should return authenticated=false when no authorization header is present', async () => {
      const request = createMockRequest('http://localhost:3000/api/test');
      
      const result = await verifyAuth(request);
      
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return authenticated=false when authorization header does not start with Bearer', async () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'InvalidToken',
      });
      
      const result = await verifyAuth(request);
      
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return authenticated=false when token verification fails', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer invalid-token',
      });
      
      const result = await verifyAuth(request);
      
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return authenticated=false when user profile fetch fails', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'User not found',
      });

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer valid-token',
      });
      
      const result = await verifyAuth(request);
      
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return authenticated=true with valid token and user profile', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'test-uid',
          email: 'test@example.com',
          role: 'student',
          fullName: 'Test User',
        },
      });

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer valid-token',
      });
      
      const result = await verifyAuth(request);
      
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'student',
      });
    });

    it('should extract and verify the token from authorization header', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'test-uid',
          email: 'test@example.com',
          role: 'supervisor',
        },
      });

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer my-test-token-123',
      });
      
      await verifyAuth(request);
      
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('my-test-token-123');
    });
  });

  describe('requireRole', () => {
    it('should return authorized=false when user is not authenticated', async () => {
      const request = createMockRequest('http://localhost:3000/api/test');
      
      const middleware = requireRole(['admin']);
      const result = await middleware(request);
      
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return authorized=false when user role does not match allowed roles', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'test-uid',
          email: 'test@example.com',
          role: 'student',
        },
      });

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer valid-token',
      });
      
      const middleware = requireRole(['admin', 'supervisor']);
      const result = await middleware(request);
      
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Forbidden');
    });

    it('should return authorized=true when user role matches allowed roles', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'test-uid',
          email: 'test@example.com',
          role: 'admin',
        },
      });

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer valid-token',
      });
      
      const middleware = requireRole(['admin', 'supervisor']);
      const result = await middleware(request);
      
      expect(result.authorized).toBe(true);
      expect(result.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    it('should allow multiple roles', async () => {
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'supervisor-uid',
        email: 'supervisor@example.com',
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'supervisor-uid',
          email: 'supervisor@example.com',
          role: 'supervisor',
        },
      });

      const request = createMockRequest('http://localhost:3000/api/test', {
        'authorization': 'Bearer valid-token',
      });
      
      const middleware = requireRole(['admin', 'supervisor']);
      const result = await middleware(request);
      
      expect(result.authorized).toBe(true);
      expect(result.user?.role).toBe('supervisor');
    });
  });
});
