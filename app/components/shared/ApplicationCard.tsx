// app/components/shared/ApplicationCard.tsx
// Updated to work with Firebase data types and support both student and supervisor views

'use client';

import { useRouter } from 'next/navigation';
import type { ApplicationCardData } from '@/types/database';
import StatusBadge from './StatusBadge';
import StudentNamesDisplay from './StudentNamesDisplay';
import { 
  cardBase, 
  btnPrimary, 
  btnDanger, 
  btnSuccess, 
  badgeInfo,
  cardHeader,
  cardTitle,
  cardDetailsSection,
  cardDetailRow,
  cardActionsSection,
  textSecondary,
  textMuted,
  textValue,
  textDescription,
  infoBoxBlue,
  textInfoLight,
  textInfoDark,
  textGreen,
  textRed,
  textOrange,
  commentBox
} from '@/lib/styles/shared-styles';

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
    <div className={cardBase} data-testid={`application-card-${application.id}`}>
      {/* Header with Title and Status */}
      <div className={cardHeader}>
        <div className="flex-1">
          <h3 className={cardTitle}>
            {application.projectTitle}
          </h3>
          {/* Show supervisor name for students, student name(s) for supervisors */}
          {isSupervisorView ? (
            <StudentNamesDisplay
              hasPartner={application.hasPartner}
              studentName={application.studentName}
              partnerName={application.partnerName}
              variant="inline"
              textSecondary={textSecondary}
            />
          ) : (
            <p className={`text-sm ${textSecondary}`}>
              Supervisor: {application.supervisorName}
            </p>
          )}
        </div>
        <StatusBadge status={application.status} variant="application" />
      </div>

      {/* Partner Information Badge */}
      {application.hasPartner && application.partnerName && application.studentName && (
        <div className={`mb-4 flex items-center gap-2 ${infoBoxBlue}`}>
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
          </svg>
          <div className="flex-1">
            <p className={`text-sm font-medium ${textInfoDark}`}>Team Project</p>
            <p className={`text-xs ${textInfoLight}`}>Co-applicants: {application.studentName} & {application.partnerName}</p>
          </div>
        </div>
      )}

      {/* Project Description */}
      <div className="mb-4">
        <p className={`${textDescription} line-clamp-3`}>
          {application.projectDescription}
        </p>
      </div>

      {/* Application Details */}
      <div className={cardDetailsSection}>
        <div className={cardDetailRow}>
          <span className={textMuted}>Date Applied:</span>
          <span className={textValue}>
            {application.dateApplied}
          </span>
        </div>
        {!isSupervisorView && (
          <div className={cardDetailRow}>
            <span className={textMuted}>Expected Response:</span>
            <span className={textValue}>
              {application.responseTime}
            </span>
          </div>
        )}
        {/* Show student email for supervisor view */}
        {isSupervisorView && application.studentEmail && (
          <div className={cardDetailRow}>
            <span className={textMuted}>Email:</span>
            <span className={textValue}>
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
              : textMuted
          }`}>
            {application.status === 'revision_requested' 
              ? 'Revision Requested' 
              : 'Supervisor Feedback:'}
          </p>
          <p className={commentBox}>
            {application.comments}
          </p>
        </div>
      )}

      {/* Action Buttons based on status and view mode */}
      <div className={cardActionsSection}>
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
              <div className={`flex-1 text-center text-sm py-2 ${textOrange}`}>
                Awaiting student revision
              </div>
            )}
            {application.status === 'approved' && (
              <div className={`flex-1 text-center text-sm py-2 ${textGreen}`}>
                ✓ Approved
              </div>
            )}
            {application.status === 'rejected' && (
              <div className={`flex-1 text-center text-sm py-2 ${textRed}`}>
                ✗ Rejected
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
