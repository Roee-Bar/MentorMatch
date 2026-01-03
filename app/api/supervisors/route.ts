/**
 * GET /api/supervisors
 * 
 * Get all supervisors with advanced filtering options:
 * - search: Text search on name, bio, expertise, research interests
 * - department: Filter by department
 * - availability: Filter by availability status (available, limited, unavailable)
 * - expertise: Filter by expertise areas (comma-separated)
 * - interests: Filter by research interests (comma-separated)
 */

import { NextRequest } from 'next/server';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(async (request: NextRequest, context, user) => {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  
  // Build filter params from query string
  const filters = {
    search: searchParams.get('search') || undefined,
    department: searchParams.get('department') || undefined,
    availability: searchParams.get('availability') || undefined,
    expertise: searchParams.get('expertise') || undefined,
    interests: searchParams.get('interests') || undefined,
  };

  // Delegate filtering to service layer
  const result = await supervisorService.getFilteredSupervisors(filters);

  if (!result.success) {
    return ApiResponse.error(result.error || 'Failed to fetch supervisors');
  }

  return ApiResponse.successWithCount(result.data || []);
});
