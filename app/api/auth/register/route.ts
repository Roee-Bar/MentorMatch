/**
 * POST /api/auth/register
 * 
 * User registration endpoint - creates user in Firebase Auth and Firestore
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { validateRegistration } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { userRepository } from '@/lib/repositories/user-repository';
import { studentRepository } from '@/lib/repositories/student-repository';
import { EmailVerificationService } from '@/lib/services/auth/email-verification-service';
import { logger } from '@/lib/logger';
import type { BaseUser } from '@/types/database';
import type { Student } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRegistration(body);
    
    if (!validation.success) {
      return ApiResponse.validationError(validation.error || 'Invalid registration data');
    }

    const data = validation.data!;

    // Create user in Firebase Auth using Admin SDK
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
    });

    // Create user document in 'users' collection
    await userRepository.set(userRecord.uid, {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      role: 'student',
      department: data.department,
    } as Omit<BaseUser, 'id'>);

    // Create complete student profile in 'students' collection
    await studentRepository.set(userRecord.uid, {
      // Personal Information
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      studentId: data.studentId,
      phone: data.phone,
      department: data.department,
      
      // Academic Information
      skills: data.skills || '',
      interests: data.interests || '',
      previousProjects: data.previousProjects || '',
      preferredTopics: data.preferredTopics || '',
      
      // Partner Information - NEW PARTNERSHIP SYSTEM
      partnerId: undefined,
      partnershipStatus: 'none',
      
      // DEPRECATED - Keep for backwards compatibility (set to defaults)
      // Note: Partner information is no longer collected during registration.
      // Students can manage partnerships through the partnership request system after registration.
      hasPartner: false,
      partnerName: '',
      partnerEmail: '',
      
      // Status
      profileComplete: true,
      matchStatus: 'unmatched',
      
      // Timestamps
      registrationDate: new Date(),
      createdAt: new Date(), // Will be overwritten by repository, but required by type
      updatedAt: new Date(), // Will be overwritten by repository, but required by type
    } as Omit<Student, 'id'>);

    console.log(`User registered successfully: ${userRecord.uid}`);

    // Send verification email (non-blocking - account is created even if email fails)
    let emailSent = false;
    let warning: string | undefined;
    
    try {
      await EmailVerificationService.sendVerificationEmail(
        userRecord.uid,
        data.email,
        `${data.firstName} ${data.lastName}`
      );
      emailSent = true;
      logger.info('Verification email sent after registration', {
        context: 'Register',
        data: { userId: userRecord.uid, email: data.email },
      });
    } catch (emailError) {
      // Log error but don't fail registration - account is already created
      logger.error('Failed to send verification email after registration', emailError, {
        context: 'Register',
        data: { userId: userRecord.uid, email: data.email },
      });
      // Set warning message for user
      warning = 'Account created successfully, but verification email could not be sent. Please use "Resend Verification Email" from your dashboard.';
    }

    return ApiResponse.created(
      { 
        userId: userRecord.uid,
        message: 'Registration successful. Please check your email to verify your account.',
        emailSent,
        ...(warning && { warning }),
      }, 
      'Registration successful'
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return ApiResponse.error('Email already in use. Please try logging in instead.', 400);
    }
    
    if (error.code === 'auth/invalid-email') {
      return ApiResponse.validationError('Invalid email address.');
    }
    
    if (error.code === 'auth/weak-password') {
      return ApiResponse.validationError('Password is too weak. Please use a stronger password.');
    }

    return ApiResponse.error(error.message || 'Registration failed. Please try again.', 500);
  }
}

