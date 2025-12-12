/**
 * GET /api/admin/supervisors
 * 
 * Get all supervisors with full data for admin management
 * Returns complete Supervisor objects including maxCapacity
 */

import { NextRequest } from 'next/server';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['admin'], async (
  request: NextRequest,
  context,
  user
) => {
  // Get all supervisors with full data for admin
  const supervisors = await SupervisorService.getAllSupervisors();

  return ApiResponse.successWithCount(supervisors);
});

