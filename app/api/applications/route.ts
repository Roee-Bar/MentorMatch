/**
 * GET /api/applications - Get all applications (admin only)
 * POST /api/applications - Create new application (students)
 */

import { NextRequest } from 'next/server';
import { ApplicationService } from '@/lib/services/applications/application-service';
import { StudentService } from '@/lib/services/students/student-service';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { serviceEvents } from '@/lib/services/shared/events';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, createApplicationSchema } from '@/lib/middleware/validation';
import { adminDb } from '@/lib/firebase-admin';
import type { Application } from '@/types/database';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const applications = await ApplicationService.getAllApplications();
  return ApiResponse.successWithCount(applications);
});

export const POST = withAuth<Record<string, string>>(async (request: NextRequest, context, user) => {
  // Validate request body
  const validation = await validateRequest(request, createApplicationSchema);
  if (!validation.valid || !validation.data) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  // Fetch student and supervisor details
  const student = await StudentService.getStudentById(user.uid);
  const supervisor = await SupervisorService.getSupervisorById(validation.data.supervisorId);

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

  // Handle partner logic (using workflow service)
  let partnerInfo = { hasPartner: false, partnerName: '', partnerEmail: '' };
  let linkedApplicationId: string | undefined = undefined;
  let isLeadApplication = true;

  if (student.partnerId) {
    const partner = await StudentService.getStudentById(student.partnerId);
    if (partner) {
      partnerInfo = {
        hasPartner: true,
        partnerName: partner.fullName,
        partnerEmail: partner.email
      };

      const linkResult = await ApplicationWorkflowService.handlePartnerApplicationLink(
        user.uid,
        student.partnerId,
        validation.data.supervisorId
      );

      linkedApplicationId = linkResult.linkedApplicationId;
      isLeadApplication = linkResult.isLeadApplication;
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
    proposedTopicId: validation.data.proposedTopicId,
    isOwnTopic: true,
    // Student Information
    studentSkills: student.skills || '',
    studentInterests: student.interests || '',
    // Partner Information
    hasPartner: partnerInfo.hasPartner,
    partnerName: partnerInfo.partnerName || undefined,
    partnerEmail: partnerInfo.partnerEmail || undefined,
    // Capacity Tracking
    linkedApplicationId,
    isLeadApplication,
    // Status
    status: 'pending',
    // Timestamps (will be set by service, but required by type)
    dateApplied: new Date(),
    lastUpdated: new Date(),
  };

  const result = await ApplicationService.createApplication(applicationData);

  if (!result.success || !result.data) {
    return ApiResponse.error(result.error || 'Failed to create application', 500);
  }

  const applicationId = result.data;

  // If we linked to a partner's existing application, update their application to link back to ours
  if (linkedApplicationId && !isLeadApplication) {
    await adminDb.collection('applications').doc(linkedApplicationId).update({
      linkedApplicationId: applicationId,
      lastUpdated: new Date()
    });
  }

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

