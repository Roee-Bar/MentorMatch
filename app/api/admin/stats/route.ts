/**
 * GET /api/admin/stats - Get admin dashboard statistics
 * 
 * Authorization: Admin only
 */

import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/services/firebase-services.server';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles(
  ['admin'],
  async (request: NextRequest) => {
    const stats = await AdminService.getDashboardStats();
    return ApiResponse.success(stats);
  }
);

