/**
 * POST /api/applications/[id]/resubmit
 * 
 * Resubmit an application after revision (student only)
 * Transitions status from 'revision_requested' to 'pending'
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { adminDb } from '@/lib/firebase-admin';

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

    const application = await ApplicationService.getApplicationById(params.id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found. It may have been deleted.' },
        { status: 404 }
      );
    }

    // Only the student owner or admin can resubmit
    const isOwner = authResult.user?.uid === application.studentId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You don\'t have permission to resubmit this application.' },
        { status: 403 }
      );
    }

    // Application must be in 'revision_requested' status
    if (application.status !== 'revision_requested') {
      return NextResponse.json(
        { error: 'Application can only be resubmitted when in revision_requested status.' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: 'pending',
      lastUpdated: new Date(),
      resubmittedDate: new Date(),
    };

    // Handle linked applications
    if (application.linkedApplicationId) {
      const linkedAppRef = adminDb.collection('applications').doc(application.linkedApplicationId);
      const linkedAppSnap = await linkedAppRef.get();
      
      if (linkedAppSnap.exists) {
        const linkedAppData = linkedAppSnap.data();
        
        // If partner is also in revision_requested, transition both
        if (linkedAppData?.status === 'revision_requested') {
          await linkedAppRef.update({
            status: 'pending',
            lastUpdated: new Date(),
            resubmittedDate: new Date(),
          });
        }
      }
    }

    // Update the application
    const applicationRef = adminDb.collection('applications').doc(params.id);
    await applicationRef.update(updateData);

    return NextResponse.json(
      { 
        success: true,
        message: 'Application resubmitted successfully. The supervisor will review your changes.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error resubmitting application:', error);
    return NextResponse.json(
      { error: 'An error occurred while resubmitting the application. Please try again.' },
      { status: 500 }
    );
  }
}

