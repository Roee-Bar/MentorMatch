import { NextRequest } from 'next/server';
import { UserService } from '@/lib/services/firebase-services.server';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles(['admin'], async (request: NextRequest, context, user) => {
  const users = await UserService.getAllUsers();
  return ApiResponse.successWithCount(users);
});

