/**
 * POST /api/admin/supervisors
 * 
 * Admin-only endpoint to create a new supervisor
 */

import { NextRequest } from 'next/server';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateBody } from '@/lib/middleware/validation';
import { createSupervisorSchema } from '@/lib/middleware/validation';

export const POST = withAuth(async (request: NextRequest, context, user) => {
  // Verify admin role
  if (user.role !== 'admin') {
    return ApiResponse.forbidden();
  }

  try {
    const body = await request.json();
    
    // Validate email
    const validation = validateBody(body, createSupervisorSchema);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.error || 'Invalid email');
    }

    const { email } = validation.data!;

    // Create supervisor
    const result = await SupervisorService.createSupervisor(email);

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to create supervisor', 400);
    }

    return ApiResponse.created(
      { supervisorId: result.supervisorId },
      'Supervisor created successfully. Default password: Supervisor123'
    );

  } catch (error: any) {
    console.error('Error in POST /api/admin/supervisors:', error);
    return ApiResponse.error(error.message || 'Failed to create supervisor', 500);
  }
});

