/**
 * POST /api/auth/register
 * 
 * User registration endpoint - creates user in Firebase Auth and Firestore
 * 
 * Rollback to PR #47 - Registration route handler
 */

import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { validateRegistration } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';
import { EmailVerificationService } from '@/lib/services/email-verification-service';
import { EmailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  let email: string | undefined;
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRegistration(body);
    
    if (!validation.success) {
      return ApiResponse.validationError(validation.error || 'Invalid registration data');
    }

    const data = validation.data!;
    email = data.email;

    // Create user in Firebase Auth using Admin SDK
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
    });

    // Create user document in 'users' collection
    await adminDb.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      role: 'student',
      department: data.department,
      emailVerified: false,
      createdAt: new Date(),
    });

    // Create complete student profile in 'students' collection
    await adminDb.collection('students').doc(userRecord.uid).set({
      // Personal Information
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      department: data.department,
      
      // Academic Information
      skills: data.skills || [],
      interests: data.interests || '',
      previousProjects: data.previousProjects || '',
      preferredTopics: data.preferredTopics || '',
      
      // Partner Information - NEW PARTNERSHIP SYSTEM
      partnerId: null,
      partnershipStatus: 'none',
      
      // DEPRECATED - Keep for backwards compatibility (set to defaults)
      hasPartner: false,
      partnerName: '',
      partnerEmail: '',
      
      // Status
      profileComplete: true,
      matchStatus: 'unmatched',
      emailVerified: false,
      
      // Timestamps
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate verification token
    const verificationToken = await EmailVerificationService.createVerificationToken(
      userRecord.uid,
      data.email
    );

    // Send verification email
    const emailResult = await EmailService.sendVerificationEmail(
      data.email,
      data.firstName,
      verificationToken
    );

    if (!emailResult.success) {
      logger.service.warn('AuthService', 'registerUser', 
        'User created but email failed to send', { userId: userRecord.uid });
    }

    logger.service.success('AuthService', 'registerUser', { userId: userRecord.uid, email: data.email });

    return ApiResponse.created({ 
      userId: userRecord.uid,
      verificationRequired: true 
    }, 'Registration successful! Please check your email to verify your account.');

  } catch (error: any) {
    // Try to extract email from error or request body for logging
    const errorEmail = email || (error as any)?.email || 'unknown';
    logger.service.error('AuthService', 'registerUser', error, { email: errorEmail });
    
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

