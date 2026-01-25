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
 * Validate parsed body directly against a Zod schema
 * Use this when body is already parsed to avoid redundant request recreation
 */
export function validateBody<T>(
  body: any,
  schema: z.ZodSchema<T>
): { valid: boolean; data?: T; error?: string } {
  try {
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
  proposedTopicId: z.string().optional(),
  hasPartner: z.boolean(),
  partnerName: z.string().optional(),
  partnerEmail: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Partner email must be a valid Braude email address (@e.braude.ac.il)')
    .optional(),
});

/**
 * Schema for updating application status
 */
export const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'revision_requested']),
  feedback: z.string().max(1000, 'Feedback must be at most 1000 characters').optional(),
});

/**
 * Schema for updating application content
 */
export const updateApplicationSchema = z.object({
  projectTitle: z.string().min(5, 'Project title must be at least 5 characters').max(200, 'Project title must be at most 200 characters'),
  projectDescription: z.string().min(10, 'Project description must be at least 10 characters').max(2000, 'Project description must be at most 2000 characters'),
  isOwnTopic: z.boolean(),
  proposedTopicId: z.string().optional(),
  studentSkills: z.string().min(1, 'Skills are required').max(500, 'Skills must be at most 500 characters'),
  studentInterests: z.string().min(1, 'Interests are required').max(500, 'Interests must be at most 500 characters'),
  hasPartner: z.boolean(),
  partnerName: z.string().max(100, 'Partner name too long').optional(),
  partnerEmail: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Partner email must be a valid Braude email address (@e.braude.ac.il)')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for user registration
 */
export const registrationSchema = z.object({
  // Account credentials
  email: z.string()
    .min(1, 'Email is required')
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Email must be a valid Braude email address (@e.braude.ac.il)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  
  // Personal information
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  department: z.string().min(1, 'Department is required'),
  
  // Academic information
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  interests: z.string().optional(),
  previousProjects: z.string().optional(),
  preferredTopics: z.string().optional(),
  
  // Partner information
  hasPartner: z.boolean(),
  partnerName: z.string().optional(),
  partnerEmail: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Partner email must be a valid Braude email address (@e.braude.ac.il)')
    .optional()
    .or(z.literal('')),
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

/**
 * Schema for updating user profile
 */
export const updateUserSchema = z.object({
  email: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Email must be a valid Braude email address (@e.braude.ac.il)')
    .optional(),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  department: z.string().min(1, 'Department is required').optional(),
}).strict();

/**
 * Schema for updating student profile
 */
export const updateStudentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  email: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Email must be a valid Braude email address (@e.braude.ac.il)')
    .optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  department: z.string().min(1, 'Department is required').optional(),
  skills: z.array(z.string()).optional(),
  interests: z.string().max(500, 'Interests must be at most 500 characters').optional(),
  previousProjects: z.string().max(1000, 'Previous projects must be at most 1000 characters').optional(),
  preferredTopics: z.string().max(500, 'Preferred topics must be at most 500 characters').optional(),
  
  // New partnership fields
  partnerId: z.string().optional(),
  partnershipStatus: z.enum(['none', 'pending_sent', 'pending_received', 'paired']).optional(),
  
  // Deprecated partnership fields
  hasPartner: z.boolean().optional(),
  partnerName: z.string().max(100, 'Partner name too long').optional(),
  partnerEmail: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Partner email must be a valid Braude email address (@e.braude.ac.il)')
    .optional()
    .or(z.literal('')),
  
  matchedSupervisorId: z.string().optional(),
  matchedProjectId: z.string().optional(),
}).strict();

/**
 * Schema for updating supervisor profile
 */
export const updateSupervisorSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long').optional(),
  email: z.string()
    .regex(/^[a-zA-Z0-9._%+-]+@e\.braude\.ac\.il$/, 
      'Email must be a valid Braude email address (@e.braude.ac.il)')
    .optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  department: z.string().min(1, 'Department is required').optional(),
  bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional(),
  researchInterests: z.array(z.string()).optional(),
  expertiseAreas: z.array(z.string()).optional(),
  officeLocation: z.string().max(100, 'Office location too long').optional(),
  officeHours: z.string().max(200, 'Office hours too long').optional(),
  maxCapacity: z.number().int().min(0, 'Max capacity must be non-negative').max(20, 'Max capacity too high').optional(),
  currentCapacity: z.number().int().min(0, 'Current capacity must be non-negative').optional(),
  availabilityStatus: z.enum(['available', 'limited', 'unavailable']).optional(),
}).strict();

/**
 * Schema for creating partnership request
 */
export const partnershipRequestSchema = z.object({
  targetStudentId: z.string().min(1, 'Target student ID is required'),
}).strict();

/**
 * Schema for responding to partnership request
 */
export const partnershipResponseSchema = z.object({
  action: z.enum(['accept', 'reject']),
}).strict();