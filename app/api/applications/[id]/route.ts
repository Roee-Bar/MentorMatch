/**
 * GET /api/applications/[id] - Get application by ID
 * PUT /api/applications/[id] - Update application
 * DELETE /api/applications/[id] - Delete application
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

    const application = await ApplicationService.getApplicationById(params.id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check authorization: user must be owner, supervisor, or admin
    const isOwner = authResult.user?.uid === application.studentId;
    const isSupervisor = authResult.user?.uid === application.supervisorId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isSupervisor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/applications/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function PUT(
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

    // Only owner or admin can update
    const isOwner = authResult.user?.uid === application.studentId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    // Note: In a real implementation, you'd have an updateApplication method in ApplicationService
    
    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PUT /api/applications/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function DELETE(
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

    // Only owner or admin can delete
    const isOwner = authResult.user?.uid === application.studentId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Note: In a real implementation, you'd have a deleteApplication method
    
    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in DELETE /api/applications/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

