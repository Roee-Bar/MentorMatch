/**
 * GET /api/supervisors/[id]
 * PUT /api/supervisors/[id]
 * 
 * Get or update a specific supervisor
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupervisorService } from '@/lib/services/firebase-services.server';
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

    const supervisor = await SupervisorService.getSupervisorById(params.id);
    
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: supervisor,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/supervisors/[id]:', error);
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
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Check authorization: user must be owner or admin
    const isOwner = authResult.user?.uid === params.id;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const success = await SupervisorService.updateSupervisor(params.id, body);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update supervisor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supervisor updated successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PUT /api/supervisors/[id]:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

