/**
 * GET /api/applications - Get all applications (admin only)
 * POST /api/applications - Create new application (students)
 */

import { NextRequest } from 'next/server';
import { AdminApplicationService, AdminStudentService, AdminSupervisorService } from '@/lib/services/admin-services';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, createApplicationSchema } from '@/lib/middleware/validation';

export const GET = withRoles(['admin'], async (request: NextRequest, context, user) => {
  const applications = await AdminApplicationService.getAllApplications();
  return ApiResponse.successWithCount(applications);
});

export const POST = withAuth(async (request: NextRequest, context, user) => {
  // Validate request body
  const validation = await validateRequest(request, createApplicationSchema);
  if (!validation.valid || !validation.data) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  // Fetch student and supervisor details
  const student = await AdminStudentService.getStudentById(user.uid);
  const supervisor = await AdminSupervisorService.getSupervisorById(validation.data.supervisorId);

  if (!student || !supervisor) {
    return ApiResponse.notFound('Student or supervisor');
  }

  // Check if student has a partner and get partner details
  let partnerInfo = {
    hasPartner: false,
    partnerName: '',
    partnerEmail: ''
  };

  if (student.partnerId) {
    const partner = await AdminStudentService.getStudentById(student.partnerId);
    if (partner) {
      partnerInfo = {
        hasPartner: true,
        partnerName: partner.fullName,
        partnerEmail: partner.email
      };
    }
  }

  // Create application with complete data
  const applicationData = {
    ...validation.data,
    studentId: user.uid,
    studentName: student.fullName,
    studentEmail: student.email,
    supervisorName: supervisor.fullName,
    studentSkills: student.skills || '',
    studentInterests: student.interests || '',
    ...partnerInfo,
    isOwnTopic: true,
    status: 'pending' as const,
  };

  const applicationId = await AdminApplicationService.createApplication(applicationData as any);

  if (!applicationId) {
    return ApiResponse.error('Failed to create application', 500);
  }

  return ApiResponse.created({ applicationId }, 'Application created successfully');
});

