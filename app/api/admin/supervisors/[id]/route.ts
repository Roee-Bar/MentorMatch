/**
 * DELETE /api/admin/supervisors/[id]
 * 
 * Admin-only endpoint to delete a supervisor and all related data
 */

import { NextRequest } from 'next/server';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

interface SupervisorIdParams {
  id: string;
}

export const DELETE = withAuth<SupervisorIdParams>(
  async (request: NextRequest, { params }, user) => {
    // Verify admin role
    if (user.role !== 'admin') {
      return ApiResponse.forbidden();
    }

    try {
      const supervisorId = params.id;

      // Verify supervisor exists
      const supervisor = await SupervisorService.getSupervisorById(supervisorId);
      if (!supervisor) {
        return ApiResponse.notFound('Supervisor');
      }

      // Delete supervisor and related data
      const result = await SupervisorService.deleteSupervisor(supervisorId);

      if (!result.success) {
        return ApiResponse.error(result.error || 'Failed to delete supervisor', 500);
      }

      return ApiResponse.success({
        message: 'Supervisor deleted successfully',
        deletedCounts: result.deletedCounts,
      });

    } catch (error: any) {
      console.error('Error in DELETE /api/admin/supervisors/[id]:', error);
      return ApiResponse.error(error.message || 'Failed to delete supervisor', 500);
    }
  }
);

