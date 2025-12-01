/**
 * PATCH /api/applications/[id]/status
 * 
 * Update application status (supervisor/admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, updateApplicationStatusSchema } from '@/lib/middleware/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const application = await ApplicationService.getApplicationById(params.id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Only the supervisor or admin can update status
    const isSupervisor = authResult.user?.uid === application.supervisorId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isSupervisor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, updateApplicationStatusSchema);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { status, feedback } = validation.data!;
    const success = await ApplicationService.updateApplicationStatus(
      params.id,
      status,
      feedback
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PATCH /api/applications/[id]/status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

