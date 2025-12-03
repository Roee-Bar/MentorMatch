/**
 * PATCH /api/applications/[id]/status
 * 
 * Update application status (supervisor/admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService, SupervisorService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, updateApplicationStatusSchema } from '@/lib/middleware/validation';
import { adminDb } from '@/lib/firebase-admin';

export async function PATCH(
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

    // Only the supervisor or admin can update status
    const isSupervisor = authResult.user?.uid === application.supervisorId;
    const isAdmin = authResult.user?.role === 'admin';

    if (!isSupervisor && !isAdmin) {
      return NextResponse.json(
        { error: 'You don\'t have permission to update this application.' },
        { status: 403 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, updateApplicationStatusSchema);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { status, feedback } = validation.data!;
    const previousStatus = application.status;

    // Handle edge case: Rejecting a lead application with a linked partner
    if (status === 'rejected' && application.isLeadApplication && application.linkedApplicationId) {
      // Check if linked application exists and update it
      const linkedAppRef = adminDb.collection('applications').doc(application.linkedApplicationId);
      const linkedAppSnap = await linkedAppRef.get();
      
      if (linkedAppSnap.exists) {
        const linkedAppData = linkedAppSnap.data();
        // If linked application is not yet processed, auto-reject it too
        if (linkedAppData?.status === 'pending' || linkedAppData?.status === 'under_review') {
          await linkedAppRef.update({
            status: 'rejected',
            supervisorFeedback: feedback ? `${feedback} (Linked partner application was rejected)` : 'Linked partner application was rejected',
            lastUpdated: new Date(),
            responseDate: new Date()
          });
        }
      }
    }

    // Check if capacity needs to be updated (approving or unapproving)
    const isApproving = status === 'approved' && previousStatus !== 'approved';
    const isUnapproving = previousStatus === 'approved' && status !== 'approved';
    
    // Only update capacity for lead applications (or applications without a partner)
    const shouldUpdateCapacity = application.isLeadApplication || !application.linkedApplicationId;
    
    if ((isApproving || isUnapproving) && shouldUpdateCapacity) {
      await adminDb.runTransaction(async (transaction) => {
        const supervisorRef = adminDb.collection('supervisors').doc(application.supervisorId);
        const supervisorSnap = await transaction.get(supervisorRef);

        if (!supervisorSnap.exists) {
          throw new Error('Supervisor not found');
        }

        const supervisorData = supervisorSnap.data();
        const currentCapacity = supervisorData?.currentCapacity || 0;
        const maxCapacity = supervisorData?.maxCapacity || 0;

        if (isApproving) {
          // Approving application - check capacity
          if (currentCapacity >= maxCapacity) {
            throw new Error(
              `Cannot approve: Supervisor has reached maximum capacity (${currentCapacity}/${maxCapacity} projects). Please contact admin to increase capacity or select a different supervisor.`
            );
          }

          // Increment capacity (only for lead applications)
          transaction.update(supervisorRef, {
            currentCapacity: currentCapacity + 1,
            updatedAt: new Date()
          });

        } else if (isUnapproving) {
          // Changing from approved to something else - release capacity (only for lead applications)
          const newCapacity = Math.max(0, currentCapacity - 1);
          transaction.update(supervisorRef, {
            currentCapacity: newCapacity,
            updatedAt: new Date()
          });
        }

        // Update application status
        const applicationRef = adminDb.collection('applications').doc(params.id);
        const updateData: any = {
          status,
          lastUpdated: new Date(),
        };
        
        if (feedback) {
          updateData.supervisorFeedback = feedback;
        }
        
        if (status === 'approved' || status === 'rejected') {
          updateData.responseDate = new Date();
        }

        transaction.update(applicationRef, updateData);
      });

    } else {
      // No capacity change needed - update normally
      const success = await ApplicationService.updateApplicationStatus(
        params.id,
        status,
        feedback
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update application status' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PATCH /api/applications/[id]/status:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

