/**
 * Request Validation Middleware
 * 
 * Provides Zod-based type-safe request validation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ valid: boolean; data?: T; error?: string }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Invalid request data' };
  }
}

/**
 * Schema for creating a new application
 */
export const createApplicationSchema = z.object({
  supervisorId: z.string().min(1, 'Supervisor ID is required'),
  projectTitle: z.string().min(5, 'Project title must be at least 5 characters').max(200, 'Project title must be at most 200 characters'),
  projectDescription: z.string().min(20, 'Project description must be at least 20 characters').max(2000, 'Project description must be at most 2000 characters'),
  hasPartner: z.boolean(),
  partnerName: z.string().optional(),
  partnerEmail: z.string().email('Invalid email format').optional(),
});

/**
 * Schema for updating supervisor profile
 */
export const updateSupervisorSchema = z.object({
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  researchInterests: z.array(z.string()).optional(),
  expertiseAreas: z.array(z.string()).optional(),
  maxCapacity: z.number().min(0, 'Max capacity cannot be negative').max(20, 'Max capacity cannot exceed 20').optional(),
  availabilityStatus: z.enum(['available', 'limited', 'unavailable']).optional(),
});

/**
 * Schema for updating application status
 */
export const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected', 'revision_requested']),
  feedback: z.string().max(1000, 'Feedback must be at most 1000 characters').optional(),
});
