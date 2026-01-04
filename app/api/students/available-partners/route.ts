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
import { getOptionalQueryParam } from '@/lib/utils/query-params';

export const GET = withRoles<Record<string, string>>(['student'], async (request: NextRequest, context, user) => {
  // Check if student already has a partner - if so, return empty array immediately
  const currentStudent = await studentService.getStudentById(user.uid);
  if (currentStudent?.partnerId) {
    return ApiResponse.successWithCount([]);
  }
  
  // Parse filter parameters from query string
  const { searchParams } = new URL(request.url);
  const filters: StudentFilterParams = {
    search: getOptionalQueryParam(searchParams, 'search'),
    department: getOptionalQueryParam(searchParams, 'department'),
    skills: getOptionalQueryParam(searchParams, 'skills'),
    interests: getOptionalQueryParam(searchParams, 'interests'),
  };

  // Always use filtered method - it handles empty filters gracefully
  const result = await studentService.getFilteredAvailablePartners(user.uid, filters);

  if (!result.success) {
    return ApiResponse.error(result.error || 'Failed to fetch students');
  }

  return ApiResponse.successWithCount(result.data || []);
});

