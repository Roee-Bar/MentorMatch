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

/**
 * Schema for user registration
 */
export const registrationSchema = z.object({
  // Account credentials
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  
  // Personal information
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  studentId: z.string().min(1, 'Student ID is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  department: z.string().min(1, 'Department is required'),
  
  // Academic information
  skills: z.string().optional(),
  interests: z.string().optional(),
  previousProjects: z.string().optional(),
  preferredTopics: z.string().optional(),
  
  // Partner information
  hasPartner: z.boolean(),
  partnerName: z.string().optional(),
  partnerEmail: z.string().email('Invalid partner email').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Validate registration data
 */
export function validateRegistration(data: any): { success: boolean; data?: z.infer<typeof registrationSchema>; error?: string } {
  try {
    const validatedData = registrationSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Invalid registration data' };
  }
}