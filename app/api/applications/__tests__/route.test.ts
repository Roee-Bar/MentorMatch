/**
 * [Integration] Applications API Route Tests
 * 
 * Tests for application CRUD operations
 */

// Mock Firebase modules first
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

jest.mock('@/lib/auth', () => ({
  getUserProfile: jest.fn(),
}));

// Mock dependencies
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/services/firebase-services');

import { verifyAuth } from '@/lib/middleware/auth';
import { ApplicationService } from '@/lib/services/firebase-services';

// Import routes after mocks
const { GET, POST } = require('../route');
const { GET: GET_BY_ID, PUT, DELETE: DELETE_APP } = require('../[id]/route');
const { PATCH } = require('../[id]/status/route');

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

describe('[Integration] GET /api/applications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'test-uid', role: 'student' },
    });

    const request = createMockRequest('http://localhost:3000/api/applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return all applications for admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'admin-uid', role: 'admin' },
    });

    (ApplicationService.getAllApplications as jest.Mock).mockResolvedValue([
      { id: '1', projectTitle: 'App 1' },
      { id: '2', projectTitle: 'App 2' },
    ]);

    const request = createMockRequest('http://localhost:3000/api/applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });
});

describe('[Integration] POST /api/applications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/applications', {
      method: 'POST',
      body: JSON.stringify({ projectTitle: 'Test' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow students to create applications', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'student-uid', role: 'student' },
    });

    (ApplicationService.createApplication as jest.Mock).mockResolvedValue('app-123');

    const applicationData = {
      supervisorId: 'sup-123',
      projectTitle: 'ML Research Project',
      projectDescription: 'A comprehensive study of machine learning algorithms',
      hasPartner: false,
    };

    const request = createMockRequest('http://localhost:3000/api/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.applicationId).toBe('app-123');
  });

  it('should return 400 for invalid data', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'student-uid', role: 'student' },
    });

    const request = createMockRequest('http://localhost:3000/api/applications', {
      method: 'POST',
      body: JSON.stringify({ projectTitle: 'Too short' }), // Missing required fields
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe('[Integration] GET /api/applications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/applications/123');
    const response = await GET_BY_ID(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return application when user is owner', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'student-uid', role: 'student' },
    });

    (ApplicationService.getApplicationById as jest.Mock).mockResolvedValue({
      id: '123',
      studentId: 'student-uid',
      projectTitle: 'Test Project',
    });

    const request = createMockRequest('http://localhost:3000/api/applications/123');
    const response = await GET_BY_ID(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('123');
  });

  it('should return 404 for non-existent application', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'admin-uid', role: 'admin' },
    });

    (ApplicationService.getApplicationById as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/applications/999');
    const response = await GET_BY_ID(request, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Application not found');
  });
});

describe('[Integration] PATCH /api/applications/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/applications/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });
    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow supervisor to update status', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'supervisor-uid', role: 'supervisor' },
    });

    (ApplicationService.getApplicationById as jest.Mock).mockResolvedValue({
      id: '123',
      supervisorId: 'supervisor-uid',
      projectTitle: 'Test',
    });

    (ApplicationService.updateApplicationStatus as jest.Mock).mockResolvedValue(true);

    const request = createMockRequest('http://localhost:3000/api/applications/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved', feedback: 'Great work!' }),
    });
    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 403 when supervisor is not the application owner', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'other-supervisor', role: 'supervisor' },
    });

    (ApplicationService.getApplicationById as jest.Mock).mockResolvedValue({
      id: '123',
      supervisorId: 'supervisor-uid',
      projectTitle: 'Test',
    });

    const request = createMockRequest('http://localhost:3000/api/applications/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });
    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });
});

describe('[Integration] DELETE /api/applications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    });

    const request = createMockRequest('http://localhost:3000/api/applications/123', {
      method: 'DELETE',
    });
    const response = await DELETE_APP(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow owner to delete their application', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { uid: 'student-uid', role: 'student' },
    });

    (ApplicationService.getApplicationById as jest.Mock).mockResolvedValue({
      id: '123',
      studentId: 'student-uid',
      projectTitle: 'Test',
    });

    const request = createMockRequest('http://localhost:3000/api/applications/123', {
      method: 'DELETE',
    });
    const response = await DELETE_APP(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

