import { NextRequest } from 'next/server';
import { UserService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, updateUserSchema } from '@/lib/middleware/validation';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return ApiResponse.forbidden();
  }
  
  const fetchedUser = await UserService.getUserById(params.id);
  if (!fetchedUser) {
    return ApiResponse.notFound('User');
  }
  
  return ApiResponse.success(fetchedUser);
});

export const PUT = withAuth(async (request: NextRequest, { params }, user) => {
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return ApiResponse.forbidden();
  }
  
  // Validate request body
  const validation = await validateRequest(request, updateUserSchema);
  if (!validation.valid || !validation.data) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }
  
  // Update user with validated data
  const success = await UserService.updateUser(params.id, validation.data);
  if (!success) {
    return ApiResponse.error('Failed to update user', 500);
  }
  
  return ApiResponse.successMessage('User updated successfully');
});

