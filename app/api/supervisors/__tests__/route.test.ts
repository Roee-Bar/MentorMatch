/**
 * [Integration] Supervisors API Route Tests
 * 
 * Tests for supervisor endpoints - serves as template for other routes
 */

// Mock Firebase modules first before any imports
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
  adminDb: {},
  adminStorage: {},
}));

// Mock auth library
jest.mock('@/lib/auth', () => ({
  getUserProfile: jest.fn(),
}));

// Mock dependencies
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/services/firebase-services');

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { SupervisorService } from '@/lib/services/firebase-services';

// Import routes after mocks are set up
const { GET } = require('../route');
const { GET: GET_BY_ID, PUT } = require('../[id]/route');

// Helper to create mock requests
function createMockRequest(url: string, init?: RequestInit) {
  return {
    url,
    method: init?.method || 'GET',
    headers: {
      get: (name: string) => null,
    },
    json: async () => (init?.body ? JSON.parse(init.body as string) : {}),
  } as any;
}

describe('[Integration] GET /api/supervisors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/supervisors');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return supervisors list when authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    (SupervisorService.getAllSupervisors as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Dr. Smith' },
      { id: '2', name: 'Dr. Jones' },
    ]);

    const request = createMockRequest('http://localhost:3000/api/supervisors');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.count).toBe(2);
  });

  it('should filter available supervisors when query param is set', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    (SupervisorService.getAvailableSupervisors as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Dr. Smith', availabilityStatus: 'available' },
    ]);

    const request = createMockRequest('http://localhost:3000/api/supervisors?available=true');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(SupervisorService.getAvailableSupervisors).toHaveBeenCalled();
    expect(data.data).toHaveLength(1);
  });

  it('should filter by department when query param is set', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    (SupervisorService.getSupervisorsByDepartment as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Dr. Smith', department: 'CS' },
    ]);

    const request = createMockRequest('http://localhost:3000/api/supervisors?department=CS');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(SupervisorService.getSupervisorsByDepartment).toHaveBeenCalledWith('CS');
    expect(data.data).toHaveLength(1);
  });

  it('should handle Firebase errors gracefully', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    (SupervisorService.getAllSupervisors as jest.Mock).mockRejectedValue(
      new Error('Firebase error')
    );

    const request = createMockRequest('http://localhost:3000/api/supervisors');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Firebase error');
  });
});

describe('[Integration] GET /api/supervisors/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/supervisors/123');
    const response = await GET_BY_ID(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return specific supervisor when authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    (SupervisorService.getSupervisorById as jest.Mock).mockResolvedValue({
      id: '123',
      fullName: 'Dr. Smith',
      department: 'CS',
    });

    const request = createMockRequest('http://localhost:3000/api/supervisors/123');
    const response = await GET_BY_ID(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('123');
    expect(SupervisorService.getSupervisorById).toHaveBeenCalledWith('123');
  });

  it('should return 404 for non-existent supervisor', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    (SupervisorService.getSupervisorById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/supervisors/999');
    const response = await GET_BY_ID(request, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Supervisor not found');
  });
});

describe('[Integration] PUT /api/supervisors/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/supervisors/123', {
      method: 'PUT',
      body: JSON.stringify({ bio: 'New bio' }),
    });
    const response = await PUT(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not the owner or admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'other-uid', role: 'supervisor' },
    });

    const request = createMockRequest('http://localhost:3000/api/supervisors/123', {
      method: 'PUT',
      body: JSON.stringify({ bio: 'New bio' }),
    });
    const response = await PUT(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should allow owner to update their profile', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: '123', role: 'supervisor' },
    });

    (SupervisorService.updateSupervisor as jest.Mock).mockResolvedValue(true);

    const updateData = { bio: 'New bio', researchInterests: ['AI', 'ML'] };
    const request = createMockRequest('http://localhost:3000/api/supervisors/123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const response = await PUT(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(SupervisorService.updateSupervisor).toHaveBeenCalledWith('123', updateData);
  });

  it('should allow admin to update any supervisor profile', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'admin-uid', role: 'admin' },
    });

    (SupervisorService.updateSupervisor as jest.Mock).mockResolvedValue(true);

    const updateData = { maxCapacity: 10 };
    const request = createMockRequest('http://localhost:3000/api/supervisors/123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    const response = await PUT(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle update failures', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: '123', role: 'supervisor' },
    });

    (SupervisorService.updateSupervisor as jest.Mock).mockResolvedValue(false);

    const request = createMockRequest('http://localhost:3000/api/supervisors/123', {
      method: 'PUT',
      body: JSON.stringify({ bio: 'New bio' }),
    });
    const response = await PUT(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update supervisor');
  });
});

