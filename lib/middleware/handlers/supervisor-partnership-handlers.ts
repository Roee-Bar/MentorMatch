/**
 * Shared Route Handlers for Supervisor Partnerships
 * 
 * Provides reusable handler functions for common supervisor partnership operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { ApiResponse } from '@/lib/middleware/response';
import { getQueryParam, getRequiredQueryParamFromRequest } from '@/lib/middleware/query-params';
import { ERROR_MESSAGES } from '@/lib/constants/error-messages';

/**
 * Handle GET request for partners with capacity
 * Supports both optional and required projectId based on requireProjectId flag
 * 
 * @param request - NextRequest object
 * @param userId - User ID of the requesting supervisor
 * @param requireProjectId - Whether projectId is required (default: false)
 * @returns NextResponse with supervisors list or error
 */
export async function handleGetPartnersWithCapacity(
  request: NextRequest,
  userId: string,
  requireProjectId: boolean = false
): Promise<NextResponse> {
  let projectId: string | undefined;

  if (requireProjectId) {
    const projectIdParam = getRequiredQueryParamFromRequest(request, 'projectId', ERROR_MESSAGES.PROJECT_ID_REQUIRED);
    if (projectIdParam instanceof NextResponse) {
      return projectIdParam;
    }
    projectId = projectIdParam;
  } else {
    projectId = getQueryParam(request, 'projectId') || '';
  }

  const supervisors = await SupervisorPartnershipPairingService.getPartnersWithCapacity(
    userId,
    projectId
  );

  return ApiResponse.successWithCount(supervisors);
}

