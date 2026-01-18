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
    await adminDb.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      role: 'student',
      department: data.department,
      createdAt: new Date(),
    });

    // Create complete student profile in 'students' collection
    await adminDb.collection('students').doc(userRecord.uid).set({
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
      partnerId: null,
      partnershipStatus: 'none',
      
      // DEPRECATED - Keep for backwards compatibility (set to defaults)
      hasPartner: false,
      partnerName: '',
      partnerEmail: '',
      
      // Status
      profileComplete: true,
      matchStatus: 'unmatched',
      
      // Timestamps
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`User registered successfully: ${userRecord.uid}`);

    return ApiResponse.created({ userId: userRecord.uid }, 'Registration successful');

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

