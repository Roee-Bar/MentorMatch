/**
 * POST /api/auth/register
 * 
 * User registration endpoint - creates user in Firebase Auth and Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';
import { validateRegistration } from '@/lib/middleware/validation';
import { handleApiError } from '@/lib/middleware/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRegistration(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error || 'Invalid registration data' 
        },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // Create user in Firebase Auth using Admin SDK
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
    });

    let photoURL = '';

    // Upload photo if provided (base64 to Firebase Storage)
    if (data.photoBase64) {
      try {
        // Convert base64 to buffer
        const base64Data = data.photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Determine file extension from base64 data
        const matches = data.photoBase64.match(/^data:image\/(\w+);base64,/);
        const fileExtension = matches ? matches[1] : 'jpg';
        
        // Upload to Firebase Storage
        const bucket = adminStorage.bucket();
        const fileName = `profile-photos/${userRecord.uid}.${fileExtension}`;
        const file = bucket.file(fileName);
        
        await file.save(imageBuffer, {
          metadata: {
            contentType: `image/${fileExtension}`,
          },
          public: true,
        });

        // Get public URL
        photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      } catch (photoError) {
        console.error('Photo upload failed:', photoError);
        // Continue without photo - don't fail registration
      }
    }

    // Create user document in 'users' collection
    await adminDb.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      role: 'student',
      department: data.department,
      photoURL: photoURL || '',
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
      academicYear: data.academicYear,
      photoURL: photoURL || '',
      
      // Academic Information
      skills: data.skills || '',
      interests: data.interests || '',
      previousProjects: data.previousProjects || '',
      preferredTopics: data.preferredTopics || '',
      
      // Partner Information
      hasPartner: data.hasPartner,
      partnerName: data.partnerName || '',
      partnerEmail: data.partnerEmail || '',
      
      // Status
      profileComplete: true,
      matchStatus: 'unmatched',
      
      // Timestamps
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`User registered successfully: ${userRecord.uid}`);

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: 'Registration successful',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({
        success: false,
        error: 'Email already in use. Please try logging in instead.',
      }, { status: 400 });
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address.',
      }, { status: 400 });
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json({
        success: false,
        error: 'Password is too weak. Please use a stronger password.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Registration failed. Please try again.',
    }, { status: 500 });
  }
}

