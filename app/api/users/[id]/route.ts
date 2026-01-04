import { NextRequest } from 'next/server';
import { userService } from '@/lib/services/users/user-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { updateUserSchema } from '@/lib/middleware/validation';
import { withValidatedRequestAndUser } from '@/lib/middleware/route-handlers';
import type { UserIdParams } from '@/types/api';

export const GET = withAuth<UserIdParams>(
  async (request: NextRequest, { params }, user) => {
    const fetchedUser = await userService.getUserById(params.id);
    if (!fetchedUser) {
      return ApiResponse.notFound('User');
    }
    return ApiResponse.success(fetchedUser);
  },
  { requireOwnerOrAdmin: true }
);

export const PUT = withAuth<UserIdParams>(
  async (request: NextRequest, { params }, user) => {
    return withValidatedRequestAndUser(
      request,
      user,
      updateUserSchema,
      (data, user) => userService.updateUser(params.id, data),
      'Failed to update user',
      () => ApiResponse.successMessage('User updated successfully')
    );
  },
  { requireOwnerOrAdmin: true, requireVerifiedEmail: true }
);

