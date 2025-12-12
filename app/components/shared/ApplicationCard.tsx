// app/components/shared/ApplicationCard.tsx
// Updated to work with Firebase data types and support both student and supervisor views

'use client';

import { useRouter } from 'next/navigation';
import type { ApplicationCardData } from '@/types/database';
import StatusBadge from './StatusBadge';
import { cardBase, btnPrimary, btnDanger, btnSuccess, badgeInfo } from '@/lib/styles/shared-styles';

interface ApplicationCardProps {
  application: ApplicationCardData;
  // Student actions
  onWithdraw?: (applicationId: string) => void;
  // Supervisor actions
  onReviewApplication?: (applicationId: string) => void;
  // View mode
  viewMode?: 'student' | 'supervisor';
  isLoading?: boolean;
}

export default function ApplicationCard({ 
  application, 
  onWithdraw, 
  onReviewApplication,
  viewMode = 'student',
  isLoading = false 
}: ApplicationCardProps) {
  const router = useRouter();
  const isSupervisorView = viewMode === 'supervisor';

  return (
    <div className={cardBase}>
      {/* Header with Title and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1 dark:text-slate-100">
            {application.projectTitle}
          </h3>
          {/* Show supervisor name for students, student name for supervisors */}
          {isSupervisorView ? (
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Student: <span className="font-medium">{application.studentName}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Supervisor: {application.supervisorName}
            </p>
          )}
        </div>
        <StatusBadge status={application.status} variant="application" />
      </div>

      {/* Partner Information Badge */}
      {application.hasPartner && application.partnerName && (
        <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/30 dark:border-blue-800">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium dark:text-blue-200">Team Project</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Partner: {application.partnerName}</p>
          </div>
          {application.linkedApplicationId && (
            <span className={badgeInfo}>Linked</span>
          )}
        </div>
      )}

      {/* Project Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 dark:text-slate-300">
          {application.projectDescription}
        </p>
      </div>

      {/* Application Details */}
      <div className="space-y-2 border-t pt-4 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Date Applied:</span>
          <span className="text-gray-800 font-medium dark:text-slate-200">
            {application.dateApplied}
          </span>
        </div>
        {!isSupervisorView && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-slate-400">Expected Response:</span>
            <span className="text-gray-800 font-medium dark:text-slate-200">
              {application.responseTime}
            </span>
          </div>
        )}
        {/* Show student email for supervisor view */}
        {isSupervisorView && application.studentEmail && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-slate-400">Email:</span>
            <span className="text-gray-800 font-medium dark:text-slate-200">
              {application.studentEmail}
            </span>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {application.comments && (
        <div className={`mt-4 pt-4 border-t dark:border-slate-700 ${
          application.status === 'revision_requested' 
            ? 'bg-orange-50 border-orange-200 -mx-4 -mb-4 px-4 pb-4 dark:bg-orange-900/20 dark:border-orange-800' 
            : ''
        }`}>
          <p className={`text-xs font-semibold mb-1 ${
            application.status === 'revision_requested' 
              ? 'text-orange-700 dark:text-orange-400' 
              : 'text-gray-500 dark:text-slate-400'
          }`}>
            {application.status === 'revision_requested' 
              ? 'Revision Requested' 
              : 'Supervisor Feedback:'}
          </p>
          <p className="text-sm text-gray-700 bg-white p-3 rounded border dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
            {application.comments}
          </p>
        </div>
      )}

      {/* Action Buttons based on status and view mode */}
      <div className="mt-4 pt-4 border-t flex gap-2 dark:border-slate-700">
        {/* Student Actions */}
        {!isSupervisorView && (
          <>
            {application.status === 'pending' && onWithdraw && (
              <button 
                className={`${btnDanger} flex-1`}
                onClick={() => onWithdraw(application.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            )}
            {application.status === 'revision_requested' && (
              <button 
                className={`${btnPrimary} flex-1`}
                onClick={() => router.push(`/authenticated/student/applications/${application.id}/edit`)}
              >
                Edit & Resubmit
              </button>
            )}
            {application.status === 'approved' && (
              <button className={`${btnSuccess} flex-1`}>
                View Project Details
              </button>
            )}
          </>
        )}

        {/* Supervisor Actions */}
        {isSupervisorView && (
          <>
            {application.status === 'pending' && onReviewApplication && (
              <button 
                className={`${btnPrimary} flex-1`}
                onClick={() => onReviewApplication(application.id)}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Review Application'}
              </button>
            )}
            {application.status === 'revision_requested' && (
              <div className="flex-1 text-center text-sm text-orange-600 py-2 dark:text-orange-400">
                Awaiting student revision
              </div>
            )}
            {application.status === 'approved' && (
              <div className="flex-1 text-center text-sm text-green-600 py-2 dark:text-green-400">
                ✓ Approved
              </div>
            )}
            {application.status === 'rejected' && (
              <div className="flex-1 text-center text-sm text-red-600 py-2 dark:text-red-400">
                ✗ Rejected
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
