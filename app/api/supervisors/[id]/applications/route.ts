/**
 * GET /api/supervisors/[id]/applications
 * 
 * Get all applications for a specific supervisor
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Check authorization: user must be the supervisor or admin
    const isOwner = authResult.user?.uid === params.id;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const applications = await ApplicationService.getSupervisorApplications(params.id);

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications.length,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/supervisors/[id]/applications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

