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
import { logger } from '@/lib/logger';
import { supervisorRepository } from '@/lib/repositories/supervisor-repository';
import { capacityChangeRepository } from '@/lib/repositories/capacity-change-repository';
import type { SupervisorIdParams } from '@/types/api';
import type { CapacityChange } from '@/types/database';

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
  await supervisorRepository.update(params.id, {
    maxCapacity
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
  await capacityChangeRepository.create({
    supervisorId: params.id,
    supervisorName: supervisor.fullName,
    adminId: user.uid,
    adminEmail: user.email,
    oldMaxCapacity: supervisor.maxCapacity,
    newMaxCapacity: maxCapacity,
    reason: reason.trim(),
    timestamp: new Date()
  } as Omit<CapacityChange, 'id'>);

  // Get updated supervisor
  const updatedSupervisor = await supervisorService.getSupervisorById(params.id);

  return ApiResponse.success(updatedSupervisor);
});


