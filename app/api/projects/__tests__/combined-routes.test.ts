/**
 * [Integration] Projects, Users, and Admin API Route Tests
 */

// Mock modules
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
jest.mock('@/lib/firebase-admin', () => ({ adminAuth: { verifyIdToken: jest.fn() }, adminDb: {}, adminStorage: {} }));
jest.mock('@/lib/auth', () => ({ getUserProfile: jest.fn() }));
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/services/firebase-services');

import { verifyAuth } from '@/lib/middleware/auth';
import { ProjectService, UserService, AdminService } from '@/lib/services/firebase-services';

const { GET: GET_PROJECTS, POST: POST_PROJECT } = require('../../projects/route');
const { GET: GET_PROJECT_BY_ID } = require('../../projects/[id]/route');
const { GET: GET_USERS } = require('../../users/route');
const { GET: GET_USER_BY_ID, PUT: PUT_USER } = require('../../users/[id]/route');
const { GET: GET_ADMIN_STATS } = require('../../admin/stats/route');
const { GET: GET_ADMIN_REPORTS } = require('../../admin/reports/route');

function createMockRequest(url: string, init?: RequestInit) {
  return { url, method: init?.method || 'GET', headers: { get: () => null }, json: async () => (init?.body ? JSON.parse(init.body as string) : {}) } as any;
}

describe('[Integration] Projects API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/projects should require authentication', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: false, user: null });
    const response = await GET_PROJECTS(createMockRequest('http://localhost:3000/api/projects'));
    expect(response.status).toBe(401);
  });

  it('GET /api/projects should return projects when authenticated', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    (ProjectService.getAllProjects as jest.Mock).mockResolvedValue([{id: '1'}]);
    const response = await GET_PROJECTS(createMockRequest('http://localhost:3000/api/projects'));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  it('POST /api/projects should require admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    const response = await POST_PROJECT(createMockRequest('http://localhost:3000/api/projects', { method: 'POST', body: JSON.stringify({}) }));
    expect(response.status).toBe(403);
  });

  it('GET /api/projects/[id] should return project', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    (ProjectService.getProjectById as jest.Mock).mockResolvedValue({id: '1', title: 'Test'});
    const response = await GET_PROJECT_BY_ID(createMockRequest('http://localhost:3000/api/projects/1'), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });
});

describe('[Integration] Users API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/users should require admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    const response = await GET_USERS(createMockRequest('http://localhost:3000/api/users'));
    expect(response.status).toBe(403);
  });

  it('GET /api/users should return users for admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'admin' } });
    (UserService.getAllUsers as jest.Mock).mockResolvedValue([{id: '1'}]);
    const response = await GET_USERS(createMockRequest('http://localhost:3000/api/users'));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
  });

  it('GET /api/users/[id] should allow owner access', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { uid: '1', role: 'student' } });
    (UserService.getUserById as jest.Mock).mockResolvedValue({id: '1'});
    const response = await GET_USER_BY_ID(createMockRequest('http://localhost:3000/api/users/1'), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });

  it('PUT /api/users/[id] should allow owner to update', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { uid: '1', role: 'student' } });
    const response = await PUT_USER(createMockRequest('http://localhost:3000/api/users/1', { method: 'PUT', body: JSON.stringify({}) }), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });
});

describe('[Integration] Admin API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/admin/stats should require admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'student' } });
    const response = await GET_ADMIN_STATS(createMockRequest('http://localhost:3000/api/admin/stats'));
    expect(response.status).toBe(403);
  });

  it('GET /api/admin/stats should return stats for admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'admin' } });
    (AdminService.getDashboardStats as jest.Mock).mockResolvedValue({totalStudents: 10});
    const response = await GET_ADMIN_STATS(createMockRequest('http://localhost:3000/api/admin/stats'));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.totalStudents).toBe(10);
  });

  it('GET /api/admin/reports should require admin', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { role: 'supervisor' } });
    const response = await GET_ADMIN_REPORTS(createMockRequest('http://localhost:3000/api/admin/reports'));
    expect(response.status).toBe(403);
  });
});

