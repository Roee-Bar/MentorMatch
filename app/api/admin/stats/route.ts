import { NextRequest } from 'next/server';
import { adminService } from '@/lib/services/admin/admin-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const stats = await adminService.getDashboardStats();
  return ApiResponse.success(stats);
});

