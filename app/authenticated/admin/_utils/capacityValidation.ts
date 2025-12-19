'use client';

import type { Supervisor } from '@/types/database';

export interface CapacityValidationResult {
  isValid: boolean;
  error: string | null;
}

const MAX_CAPACITY = 50;
const MIN_CAPACITY = 0;

/**
 * Validates capacity update input
 * @param newCapacity - The new maximum capacity value
 * @param supervisor - The supervisor whose capacity is being updated
 * @param reason - The reason for the capacity change
 * @returns Validation result with isValid flag and error message
 */
export function validateCapacityUpdate(
  newCapacity: number,
  supervisor: Supervisor,
  reason: string
): CapacityValidationResult {
  if (newCapacity < supervisor.currentCapacity) {
    return {
      isValid: false,
      error: `Maximum capacity cannot be less than current capacity (${supervisor.currentCapacity})`,
    };
  }

  if (newCapacity > MAX_CAPACITY) {
    return {
      isValid: false,
      error: `Maximum capacity cannot exceed ${MAX_CAPACITY}`,
    };
  }

  if (newCapacity < MIN_CAPACITY) {
    return {
      isValid: false,
      error: 'Maximum capacity cannot be negative',
    };
  }

  if (!reason.trim()) {
    return {
      isValid: false,
      error: 'Please provide a reason for this change',
    };
  }

  return { isValid: true, error: null };
}

