/**
 * [Integration] Students API Route Tests
 */

// Mock Firebase modules first
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: jest.fn() },
  adminDb: {},
  adminStorage: {},
}));
jest.mock('@/lib/auth', () => ({ getUserProfile: jest.fn() }));
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/services/firebase-services');

import { verifyAuth } from '@/lib/middleware/auth';
import { StudentService } from '@/lib/services/firebase-services';

const { GET } = require('../route');
const { GET: GET_BY_ID, PUT } = require('../[id]/route');
const { GET: GET_UNMATCHED } = require('../unmatched/route');

function createMockRequest(url: string, init?: RequestInit) {
  return {
    url,
    method: init?.method || 'GET',
    headers: { get: () => null },
    json: async () => (init?.body ? JSON.parse(init.body as string) : {}),
  } as any;
}

describe('[Integration] GET /api/students', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when not authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: false, user: null });
    const response = await GET(createMockRequest('http://localhost:3000/api/students'));
    expect(response.status).toBe(401);
  });

  it('should return 403 when user is not supervisor or admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    const response = await GET(createMockRequest('http://localhost:3000/api/students'));
    expect(response.status).toBe(403);
  });

  it('should return students for supervisors', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'supervisor' } });
    (StudentService.getAllStudents as jest.Mock).mockResolvedValue([{id: '1'}, {id: '2'}]);
    const response = await GET(createMockRequest('http://localhost:3000/api/students'));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
  });
});

describe('[Integration] GET /api/students/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should allow owner to view their profile', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { uid: '123', role: 'student' } });
    (StudentService.getStudentById as jest.Mock).mockResolvedValue({ id: '123', fullName: 'Test' });
    const response = await GET_BY_ID(createMockRequest('http://localhost:3000/api/students/123'), { params: { id: '123' } });
    expect(response.status).toBe(200);
  });

  it('should return 403 when non-owner student tries to view', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { uid: 'other', role: 'student' } });
    const response = await GET_BY_ID(createMockRequest('http://localhost:3000/api/students/123'), { params: { id: '123' } });
    expect(response.status).toBe(403);
  });
});

describe('[Integration] PUT /api/students/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should allow owner to update their profile', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { uid: '123', role: 'student' } });
    (StudentService.updateStudent as jest.Mock).mockResolvedValue(true);
    const response = await PUT(
      createMockRequest('http://localhost:3000/api/students/123', { method: 'PUT', body: JSON.stringify({}) }),
      { params: { id: '123' } }
    );
    expect(response.status).toBe(200);
  });
});

describe('[Integration] GET /api/students/unmatched', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 403 for non-admin users', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    const response = await GET_UNMATCHED(createMockRequest('http://localhost:3000/api/students/unmatched'));
    expect(response.status).toBe(403);
  });

  it('should return unmatched students for admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'admin' } });
    (StudentService.getUnmatchedStudents as jest.Mock).mockResolvedValue([{id: '1'}]);
    const response = await GET_UNMATCHED(createMockRequest('http://localhost:3000/api/students/unmatched'));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });
});

