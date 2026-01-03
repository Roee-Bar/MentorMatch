/**
 * GET /api/applications - Get all applications (admin only)
 * POST /api/applications - Create new application (students)
 */

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/services/applications/application-service';
import { studentService } from '@/lib/services/students/student-service';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { validatePartner } from '@/lib/services/applications/application-validation';
import { serviceEvents } from '@/lib/services/shared/events';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, createApplicationSchema } from '@/lib/middleware/validation';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { Application } from '@/types/database';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const applications = await applicationService.getAllApplications();
  return ApiResponse.successWithCount(applications);
});

export const POST = withAuth<Record<string, string>>(async (request: NextRequest, context, user) => {
  // Validate request body
  const validation = await validateRequest(request, createApplicationSchema);
  if (!validation.valid || !validation.data) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  // Fetch student and supervisor details
  const student = await studentService.getStudentById(user.uid);
  const supervisor = await supervisorService.getSupervisorById(validation.data.supervisorId);

  if (!student || !supervisor) {
    return ApiResponse.notFound('Student or supervisor');
  }

  // Check for duplicate applications (using workflow service)
  const duplicateCheck = await ApplicationWorkflowService.checkDuplicateApplication(
    user.uid,
    validation.data.supervisorId
  );

  if (duplicateCheck.isDuplicate) {
    return ApiResponse.error(
      'You already have a pending or approved application to this supervisor. Please wait for a response or withdraw your existing application.',
      400
    );
  }

  // Auto-include partner if student has one (with validation)
  let partnerInfo = { hasPartner: false, partnerName: '', partnerEmail: '', partnerId: undefined as string | undefined };

  if (student.partnerId) {
    const validation = await validatePartner(user.uid, student.partnerId);
    
    if (validation.isValid && validation.partner) {
      partnerInfo = {
        hasPartner: true,
        partnerName: validation.partner.fullName,
        partnerEmail: validation.partner.email,
        partnerId: validation.partner.id
      };
    } else {
      // Log warnings but proceed without partner (graceful handling)
      if (validation.warnings.length > 0) {
        logger.warn('Partner validation warnings during application creation', {
          context: 'API',
          data: {
            studentId: user.uid,
            partnerId: student.partnerId,
            warnings: validation.warnings
          }
        });
      }
    }
  }

  // Create application with properly typed data
  const applicationData: Omit<Application, 'id'> = {
    // Participants
    studentId: user.uid,
    studentName: student.fullName,
    studentEmail: student.email,
    supervisorId: validation.data.supervisorId,
    supervisorName: supervisor.fullName,
    // Project Details
    projectTitle: validation.data.projectTitle,
    projectDescription: validation.data.projectDescription,
    proposedTopicId: validation.data.proposedTopicId ?? undefined,
    isOwnTopic: true,
    // Student Information
    studentSkills: student.skills || '',
    studentInterests: student.interests || '',
    // Partner Information
    hasPartner: partnerInfo.hasPartner,
    partnerName: partnerInfo.partnerName || undefined,
    partnerEmail: partnerInfo.partnerEmail || undefined,
    partnerId: partnerInfo.partnerId,
    appliedByStudentId: user.uid, // Track who originally submitted
    // Capacity Tracking (DEPRECATED - kept for backward compatibility)
    linkedApplicationId: undefined,
    isLeadApplication: true, // All new applications are "lead" (no linking)
    // Status
    status: 'pending',
    // Timestamps (will be set by service, but required by type)
    dateApplied: new Date(),
    lastUpdated: new Date(),
  };

  const result = await applicationService.createApplication(applicationData);

  if (!result.success || !result.data) {
    return ApiResponse.error(result.error || 'Failed to create application', 500);
  }

  const applicationId = result.data;

  // Emit application created event for side effects (e.g., email notifications)
  await serviceEvents.emit({
    type: 'application:created',
    applicationId,
    studentId: user.uid,
    studentName: student.fullName,
    studentEmail: student.email,
    supervisorId: supervisor.id,
    supervisorName: supervisor.fullName,
    supervisorEmail: supervisor.email,
    projectTitle: validation.data.projectTitle,
    hasPartner: partnerInfo.hasPartner,
    partnerName: partnerInfo.partnerName,
    partnerEmail: partnerInfo.partnerEmail,
  });

  return ApiResponse.created({ applicationId }, 'Application created successfully');
});

