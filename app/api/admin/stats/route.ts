import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/services/admin/admin-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const stats = await AdminService.getDashboardStats();
  return ApiResponse.success(stats);
});

