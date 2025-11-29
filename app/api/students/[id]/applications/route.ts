/**
 * GET /api/students/[id]/applications - Get applications for a specific student
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(
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

    // Students can only view their own applications
    // Supervisors and admins can view any student's applications
    const isOwner = authResult.user?.uid === params.id;
    const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(authResult.user?.role || '');

    if (!isOwner && !isSupervisorOrAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const applications = await ApplicationService.getStudentApplications(params.id);

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications.length,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in GET /api/students/${params.id}/applications:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

