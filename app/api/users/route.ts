import { NextRequest } from 'next/server';
import { AdminUserService } from '@/lib/services/admin-services';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles(['admin'], async (request: NextRequest, context, user) => {
  const users = await AdminUserService.getAllUsers();
  return ApiResponse.successWithCount(users);
});

