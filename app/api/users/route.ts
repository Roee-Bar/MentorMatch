import { NextRequest } from 'next/server';
import { userService } from '@/lib/services/users/user-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const dynamic = 'force-dynamic';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const users = await userService.getAllUsers();
  return ApiResponse.successWithCount(users);
});

