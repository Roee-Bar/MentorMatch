/**
 * GET /api/students/[id]/applications - Get applications for a specific student
 *
 * Authorization: Owner, admin, supervisor, or partner of the student
 */

import { NextRequest } from 'next/server';
import { ApplicationService } from '@/lib/services/applications/application-service';
import { StudentService } from '@/lib/services/students/student-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { StudentIdParams } from '@/types/api';

export const GET = withAuth<StudentIdParams>(
  async (request: NextRequest, { params }, user) => {
    const applications = await ApplicationService.getStudentApplications(params.id);
    return ApiResponse.successWithCount(applications);
  },
  {
    requireResourceAccess: async (user, { params }) => {
      // Allow owner
      if (user.uid === params.id) return true;

      // Allow admin
      if (user.role === 'admin') return true;

      // Allow supervisor
      if (user.role === 'supervisor') return true;

      // Allow partner to view applications
      if (user.role === 'student') {
        const currentStudent = await StudentService.getStudentById(user.uid);
        if (currentStudent?.partnerId === params.id) {
          return true;
        }
      }

      return false;
    },
  }
);

