/**
 * GET /api/students/[id]/partnership-requests
 * 
 * Get partnership requests for a specific student
 * Supports query parameter: ?type=incoming|outgoing|all
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Authorization: Students can only view their own requests
  // Supervisors and admins can view any student's requests
  const isOwner = user.uid === params.id;
  const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(user.role || '');

  if (!isOwner && !isSupervisorOrAdmin) {
    return ApiResponse.error('Forbidden', 403);
  }

  // Get query parameter for request type
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  // Validate type parameter
  if (!['incoming', 'outgoing', 'all'].includes(type)) {
    return ApiResponse.validationError('Invalid type parameter. Must be: incoming, outgoing, or all');
  }

  // Fetch partnership requests
  const requests = await StudentPartnershipService.getPartnershipRequests(
    params.id,
    type as 'incoming' | 'outgoing' | 'all'
  );

  return ApiResponse.successWithCount(requests);
});

