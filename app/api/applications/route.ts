/**
 * GET /api/applications - Get all applications (admin only)
 * POST /api/applications - Create new application (students)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminApplicationService, AdminStudentService, AdminSupervisorService } from '@/lib/services/admin-services';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, createApplicationSchema } from '@/lib/middleware/validation';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Only admin can view all applications
    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const applications = await AdminApplicationService.getAllApplications();

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications.length,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/applications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, createApplicationSchema);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request data' },
        { status: 400 }
      );
    }

    // Fetch student and supervisor details
    const student = await AdminStudentService.getStudentById(authResult.user?.uid!);
    const supervisor = await AdminSupervisorService.getSupervisorById(validation.data.supervisorId);

    if (!student || !supervisor) {
      return NextResponse.json(
        { error: 'Student or supervisor not found' },
        { status: 404 }
      );
    }

    // Create application with complete data
    const applicationData = {
      ...validation.data,
      studentId: authResult.user?.uid,
      studentName: student.fullName,
      studentEmail: student.email,
      supervisorName: supervisor.fullName,
      studentSkills: student.skills || '',
      studentInterests: student.interests || '',
      isOwnTopic: true,
      status: 'pending' as const,
    };

    const applicationId = await AdminApplicationService.createApplication(applicationData as any);

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application created successfully',
      data: { applicationId },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/applications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

