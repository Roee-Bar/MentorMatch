/**
 * GET /api/students/available-partners - Get students available for partnership
 * Returns students who don't have a partner, excluding the current user
 * If the requesting student already has a partner, returns empty array
 * Supports optional query parameters for filtering: search, department, skills, interests
 */

import { NextRequest } from 'next/server';
import { studentService } from '@/lib/services/students/student-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { StudentFilterParams } from '@/types/database';
import { isServiceSuccess } from '@/lib/services/shared/types';

export const GET = withRoles<Record<string, string>>(['student'], async (request: NextRequest, context, user) => {
  // Check if student already has a partner - if so, return empty array immediately
  const currentStudent = await studentService.getStudentById(user.uid);
  if (currentStudent?.partnerId) {
    return ApiResponse.successWithCount([]);
  }
  
  // Parse filter parameters from query string
  const searchParams = request.nextUrl.searchParams;
  const filters: StudentFilterParams = {
    search: searchParams.get('search') || undefined,
    department: searchParams.get('department') || undefined,
    skills: searchParams.get('skills') || undefined,
    interests: searchParams.get('interests') || undefined,
  };

  // Check if any filters are provided
  const hasFilters = filters.search || filters.department || filters.skills || filters.interests;

  if (hasFilters) {
    // Use filtered method
    const result = await studentService.getFilteredAvailablePartners(user.uid, filters);
    if (isServiceSuccess(result)) {
      return ApiResponse.successWithCount(result.data || []);
    } else {
      return ApiResponse.error(result.error || 'Failed to fetch students');
    }
  } else {
    // No filters, use original method for backward compatibility
    const students = await studentService.getAvailablePartners(user.uid);
    return ApiResponse.successWithCount(students);
  }
});

