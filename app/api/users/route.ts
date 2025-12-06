import { NextRequest } from 'next/server';
import { UserService } from '@/lib/services/users/user-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const users = await UserService.getAllUsers();
  return ApiResponse.successWithCount(users);
});

