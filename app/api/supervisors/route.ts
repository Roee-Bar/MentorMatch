/**
 * GET /api/supervisors
 * 
 * Get all supervisors or filter by availability/department
 */

import { NextRequest } from 'next/server';
import { AdminSupervisorService } from '@/lib/services/admin-services';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(async (request: NextRequest, context, user) => {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const available = searchParams.get('available') === 'true';
  const department = searchParams.get('department');

  let supervisors;
  
  if (available) {
    supervisors = await AdminSupervisorService.getAvailableSupervisors();
  } else if (department) {
    supervisors = await AdminSupervisorService.getSupervisorsByDepartment(department);
  } else {
    supervisors = await AdminSupervisorService.getAllSupervisors();
  }

  return ApiResponse.successWithCount(supervisors);
});

