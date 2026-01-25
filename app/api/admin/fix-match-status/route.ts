/**
 * POST /api/admin/fix-match-status
 *
 * Admin-only endpoint to fix students with approved applications
 * but incorrect matchStatus.
 */

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

interface FixResult {
  studentId: string;
  studentName: string;
  previousStatus: string;
  supervisorId: string;
}

export const POST = withRoles(['admin'], async (request: NextRequest, context, user) => {
  const results: FixResult[] = [];
  const processedStudentIds = new Set<string>();

  // Get all approved applications
  const applicationsSnapshot = await adminDb
    .collection('applications')
    .where('status', '==', 'approved')
    .get();

  if (applicationsSnapshot.empty) {
    return ApiResponse.success({
      message: 'No approved applications found. Nothing to fix.',
      fixed: 0,
      alreadyCorrect: 0,
    });
  }

  for (const appDoc of applicationsSnapshot.docs) {
    const application = appDoc.data();
    const studentId = application.studentId;

    // Skip if we already processed this student
    if (processedStudentIds.has(studentId)) {
      continue;
    }

    // Get the student
    const studentDoc = await adminDb.collection('students').doc(studentId).get();

    if (!studentDoc.exists) {
      continue;
    }

    const student = studentDoc.data();
    const currentStatus = student?.matchStatus || 'unmatched';

    // Only update if status is not already 'matched'
    if (currentStatus !== 'matched') {
      await adminDb.collection('students').doc(studentId).update({
        matchStatus: 'matched',
        assignedSupervisorId: application.supervisorId,
        updatedAt: new Date(),
      });

      results.push({
        studentId,
        studentName: student?.fullName || 'Unknown',
        previousStatus: currentStatus,
        supervisorId: application.supervisorId,
      });
    }

    processedStudentIds.add(studentId);
  }

  return ApiResponse.success({
    message: `Fixed ${results.length} student(s) with incorrect matchStatus`,
    fixed: results.length,
    alreadyCorrect: processedStudentIds.size - results.length,
    details: results,
  });
});
