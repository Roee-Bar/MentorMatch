import { NextRequest } from 'next/server';
import { userService } from '@/lib/services/users/user-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, updateUserSchema } from '@/lib/middleware/validation';
import { handleServiceResult } from '@/lib/middleware/service-result-handler';
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
    const validation = await validateRequest(request, updateUserSchema);
    if (!validation.valid || !validation.data) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }
    
    const result = await userService.updateUser(params.id, validation.data);
    
    const errorResponse = handleServiceResult(result, 'Failed to update user');
    if (errorResponse) return errorResponse;
    
    return ApiResponse.successMessage('User updated successfully');
  },
  { requireOwnerOrAdmin: true }
);

