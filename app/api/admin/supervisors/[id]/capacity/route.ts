/**
 * PATCH /api/admin/supervisors/[id]/capacity
 * 
 * Update supervisor capacity (admin only)
 * Phase 6.1: Admin capacity override endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupervisorService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get supervisor
    const supervisor = await SupervisorService.getSupervisorById(params.id);
    
    if (!supervisor) {
      return NextResponse.json(
        { error: 'Supervisor not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { maxCapacity, reason } = body;

    if (typeof maxCapacity !== 'number') {
      return NextResponse.json(
        { error: 'maxCapacity must be a number' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    // Validate capacity constraints
    if (maxCapacity < supervisor.currentCapacity) {
      return NextResponse.json(
        { error: `Maximum capacity cannot be less than current capacity (${supervisor.currentCapacity})` },
        { status: 400 }
      );
    }

    if (maxCapacity > 50) {
      return NextResponse.json(
        { error: 'Maximum capacity cannot exceed 50' },
        { status: 400 }
      );
    }

    if (maxCapacity < 0) {
      return NextResponse.json(
        { error: 'Maximum capacity cannot be negative' },
        { status: 400 }
      );
    }

    // Update supervisor capacity
    await adminDb.collection('supervisors').doc(params.id).update({
      maxCapacity,
      updatedAt: new Date()
    });

    // Log the change for audit trail
    await adminDb.collection('capacity_changes').add({
      supervisorId: params.id,
      supervisorName: supervisor.fullName,
      adminId: authResult.user.uid,
      adminEmail: authResult.user.email,
      oldMaxCapacity: supervisor.maxCapacity,
      newMaxCapacity: maxCapacity,
      reason: reason.trim(),
      timestamp: new Date()
    });

    // Get updated supervisor
    const updatedSupervisor = await SupervisorService.getSupervisorById(params.id);

    return NextResponse.json({
      success: true,
      message: 'Supervisor capacity updated successfully',
      data: updatedSupervisor
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PATCH /api/admin/supervisors/[id]/capacity:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}


