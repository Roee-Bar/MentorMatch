/**
 * GET /api/supervisors
 * 
 * Get all supervisors or filter by availability/department
 */

import { NextRequest } from 'next/server';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(async (request: NextRequest, context, user) => {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const available = searchParams.get('available') === 'true';
  const department = searchParams.get('department');

  let supervisors;
  
  if (available) {
    supervisors = await SupervisorService.getAvailableSupervisors();
  } else if (department) {
    supervisors = await SupervisorService.getSupervisorsByDepartment(department);
  } else {
    supervisors = await SupervisorService.getAllSupervisors();
  }

  return ApiResponse.successWithCount(supervisors);
});
