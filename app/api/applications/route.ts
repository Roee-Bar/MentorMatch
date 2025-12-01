/**
 * GET /api/applications - Get all applications (admin only)
 * POST /api/applications - Create new application (students)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
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

    const applications = await ApplicationService.getAllApplications();

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
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create application with student ID
    const applicationData = {
      ...validation.data,
      studentId: authResult.user?.uid,
      status: 'pending' as const,
    };

    const applicationId = await ApplicationService.createApplication(applicationData as any);

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

