/**
 * GET /api/students - Get all students (supervisor/admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only supervisor or admin can view all students
    if (authResult.user?.role !== 'supervisor' && authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await StudentService.getAllStudents();
    return NextResponse.json({ success: true, data: students, count: students.length }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/students:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

