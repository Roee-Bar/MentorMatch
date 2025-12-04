/**
 * POST /api/applications/[id]/resubmit
 * 
 * Resubmit an application after revision (student only)
 * Transitions status from 'revision_requested' to 'pending'
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { verifyAuth } from '@/lib/middleware/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Delegate to workflow service
    const result = await ApplicationWorkflowService.resubmitApplication(
      params.id,
      authResult.user!.uid
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: result.message || 'Application resubmitted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error resubmitting application:', error);
    return NextResponse.json(
      { error: 'An error occurred while resubmitting the application. Please try again.' },
      { status: 500 }
    );
  }
}

