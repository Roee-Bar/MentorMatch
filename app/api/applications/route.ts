/**
 * GET /api/applications - Get all applications (admin only)
 * POST /api/applications - Create new application (students)
 */

import { NextRequest } from 'next/server';
import { ApplicationService, StudentService, SupervisorService } from '@/lib/services/firebase-services.server';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, createApplicationSchema } from '@/lib/middleware/validation';
import { adminDb } from '@/lib/firebase-admin';

export const GET = withRoles(['admin'], async (request: NextRequest, context, user) => {
  const applications = await ApplicationService.getAllApplications();
  return ApiResponse.successWithCount(applications);
});

export const POST = withAuth(async (request: NextRequest, context, user) => {
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

  // Check for duplicate applications to the same supervisor
  const existingApplicationsSnapshot = await adminDb
    .collection('applications')
    .where('studentId', '==', user.uid)
    .where('supervisorId', '==', validation.data.supervisorId)
    .where('status', 'in', ['pending', 'under_review', 'approved'])
    .get();

  if (!existingApplicationsSnapshot.empty) {
    return ApiResponse.error(
      'You already have a pending or approved application to this supervisor. Please wait for a response or withdraw your existing application.',
      400
    );
  }

  // Check if student has a partner and get partner details
  let partnerInfo = {
    hasPartner: false,
    partnerName: '',
    partnerEmail: ''
  };

  let linkedApplicationId: string | undefined = undefined;
  let isLeadApplication = true; // Default to true for solo students

  if (student.partnerId) {
    const partner = await StudentService.getStudentById(student.partnerId);
    if (partner) {
      partnerInfo = {
        hasPartner: true,
        partnerName: partner.fullName,
        partnerEmail: partner.email
      };

      // Check if partner already has an application to the same supervisor
      const partnerApplicationsSnapshot = await adminDb
        .collection('applications')
        .where('studentId', '==', student.partnerId)
        .where('supervisorId', '==', validation.data.supervisorId)
        .where('status', 'in', ['pending', 'under_review', 'approved'])
        .get();

      if (!partnerApplicationsSnapshot.empty) {
        // Partner has an existing application - link to it
        const partnerApplication = partnerApplicationsSnapshot.docs[0];
        linkedApplicationId = partnerApplication.id;
        isLeadApplication = false; // This is the second application in the pair

        // Update partner's application to link back
        await adminDb.collection('applications').doc(partnerApplication.id).update({
          linkedApplicationId: 'pending', // Will be updated with this application's ID after creation
          lastUpdated: new Date()
        });
      }
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
    linkedApplicationId,
    isLeadApplication,
    isOwnTopic: true,
    status: 'pending' as const,
  };

  const applicationId = await ApplicationService.createApplication(applicationData as any);

  if (!applicationId) {
    return ApiResponse.error('Failed to create application', 500);
  }

  // If this was the second application in a pair, update the partner's application with this ID
  if (linkedApplicationId && linkedApplicationId !== 'pending') {
    await adminDb.collection('applications').doc(linkedApplicationId).update({
      linkedApplicationId: applicationId,
      lastUpdated: new Date()
    });
  }

  return ApiResponse.created({ applicationId }, 'Application created successfully');
});

