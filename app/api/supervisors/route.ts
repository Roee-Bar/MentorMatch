/**
 * GET /api/supervisors
 * 
 * Get all supervisors or filter by availability/department
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminSupervisorService } from '@/lib/services/admin-services';
import { verifyAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/middleware/errorHandler';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available') === 'true';
    const department = searchParams.get('department');

    let supervisors;
    
    if (available) {
      supervisors = await AdminSupervisorService.getAvailableSupervisors();
    } else if (department) {
      supervisors = await AdminSupervisorService.getSupervisorsByDepartment(department);
    } else {
      supervisors = await AdminSupervisorService.getAllSupervisors();
    }

    return NextResponse.json({
      success: true,
      data: supervisors,
      count: supervisors.length,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/supervisors:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

