/**
 * PATCH /api/applications/[id]/status
 * 
 * Update application status (supervisor/admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
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
        { error: 'Application not found. It may have been deleted.' },
        { status: 404 }
      );
    }

    // Only the supervisor or admin can update status
    const isSupervisor = authResult.user?.uid === application.supervisorId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isSupervisor && !isAdmin) {
      return NextResponse.json(
        { error: 'You don\'t have permission to update this application.' },
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

    // Delegate to workflow service
    const result = await ApplicationWorkflowService.updateApplicationStatus(
      params.id,
      status,
      feedback,
      authResult.user?.uid,
      authResult.user?.role as 'admin' | 'supervisor' | 'student' | undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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

