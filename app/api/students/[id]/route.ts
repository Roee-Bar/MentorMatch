/**
 * GET /api/students/[id] - Get student by ID
 * PUT /api/students/[id] - Update student
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminStudentService } from '@/lib/services/admin-services';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owner, supervisor, or admin can view
    const isOwner = authResult.user?.uid === params.id;
    const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(authResult.user?.role || '');

    if (!isOwner && !isSupervisorOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await AdminStudentService.getStudentById(params.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: student }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/students/[id]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = authResult.user?.uid === params.id;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const success = await AdminStudentService.updateStudent(params.id, body);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PUT /api/students/[id]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

