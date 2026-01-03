/**
 * PATCH /api/admin/supervisors/[id]/capacity
 * 
 * Update supervisor capacity (admin only)
 * Phase 6.1: Admin capacity override endpoint
 */

import { NextRequest } from 'next/server';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { SupervisorIdParams } from '@/types/api';

export const PATCH = withRoles<SupervisorIdParams>(['admin'], async (
  request: NextRequest,
  { params },
  user
) => {
  // Get supervisor
  const supervisor = await supervisorService.getSupervisorById(params.id);
  
  if (!supervisor) {
    return ApiResponse.notFound('Supervisor');
  }

  // Parse and validate request body
  const body = await request.json();
  const { maxCapacity, reason } = body;

  if (typeof maxCapacity !== 'number') {
    return ApiResponse.validationError('maxCapacity must be a number');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return ApiResponse.validationError('reason is required');
  }

  // Validate capacity constraints
  if (maxCapacity < supervisor.currentCapacity) {
    return ApiResponse.error(
      `Maximum capacity cannot be less than current capacity (${supervisor.currentCapacity})`,
      400
    );
  }

  if (maxCapacity > 50) {
    return ApiResponse.error('Maximum capacity cannot exceed 50', 400);
  }

  if (maxCapacity < 0) {
    return ApiResponse.error('Maximum capacity cannot be negative', 400);
  }

  // Update supervisor capacity
  await adminDb.collection('supervisors').doc(params.id).update({
    maxCapacity,
    updatedAt: new Date()
  });

  logger.info('Admin capacity override', {
    context: 'API',
    data: {
      supervisorId: params.id,
      adminId: user.uid,
      oldCapacity: supervisor.maxCapacity,
      newCapacity: maxCapacity,
      reason
    }
  });

  // Log the change for audit trail
  await adminDb.collection('capacity_changes').add({
    supervisorId: params.id,
    supervisorName: supervisor.fullName,
    adminId: user.uid,
    adminEmail: user.email,
    oldMaxCapacity: supervisor.maxCapacity,
    newMaxCapacity: maxCapacity,
    reason: reason.trim(),
    timestamp: new Date()
  });

  // Get updated supervisor
  const updatedSupervisor = await supervisorService.getSupervisorById(params.id);

  return ApiResponse.success(updatedSupervisor);
});


