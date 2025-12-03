/**
 * GET /api/students/[id]/applications - Get applications for a specific student
 */

import { NextRequest } from 'next/server';
import { AdminApplicationService } from '@/lib/services/admin-services';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Authorization: Students can only view their own applications
  // Supervisors and admins can view any student's applications
  const isOwner = user.uid === params.id;
  const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(user.role || '');

  if (!isOwner && !isSupervisorOrAdmin) {
    return ApiResponse.error('Forbidden', 403);
  }

  const applications = await AdminApplicationService.getStudentApplications(params.id);
  return ApiResponse.successWithCount(applications);
});

