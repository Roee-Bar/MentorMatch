/**
 * POST /api/partnerships/unpair
 * 
 * Unpair from current partner
 * Phase 3: Includes application synchronization
 * 
 * Authorization: Student role required
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/partnerships/partnership-service';
import { StudentService } from '@/lib/services/students/student-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    // Get student document to retrieve partnerId
    const student = await StudentService.getStudentById(user.uid);
    
    if (!student) {
      return ApiResponse.notFound('Student');
    }

    // Validate student is currently paired
    if (!student.partnerId || student.partnershipStatus !== 'paired') {
      logger.warn('Unpair attempt on unpaired student', {
        context: 'API',
        data: {
          userId: user.uid,
          partnershipStatus: student.partnershipStatus
        }
      });
      return ApiResponse.error('You are not currently paired with anyone', 400);
    }

    // Unpair students (includes application synchronization)
    await StudentPartnershipService.unpairStudents(user.uid, student.partnerId);

    return ApiResponse.successMessage('Successfully unpaired from your partner');
  },
  { allowedRoles: ['student'] }
);

