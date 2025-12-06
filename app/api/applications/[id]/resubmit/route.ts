/**
 * POST /api/applications/[id]/resubmit
 * 
 * Resubmit an application after revision (student only)
 * Transitions status from 'revision_requested' to 'pending'
 * 
 * Authorization: Application owner (student)
 * Note: Uses manual auth to delegate complex workflow validation to service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { verifyAuth } from '@/lib/middleware/auth';
import { ApiResponse, AuthMessages } from '@/lib/middleware/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiResponse.unauthorized();
    }

    // Delegate to workflow service
    const result = await ApplicationWorkflowService.resubmitApplication(
      params.id,
      authResult.user.uid
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to resubmit application', 400);
    }

    return ApiResponse.successMessage(result.message || 'Application resubmitted successfully');

  } catch (error) {
    console.error('Error resubmitting application:', error);
    return ApiResponse.error(
      'An error occurred while resubmitting the application. Please try again.',
      500
    );
  }
}

