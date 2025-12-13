'use client';

// Component for supervisors to update application status (approve/reject/request revision)

import { useState } from 'react';
import type { Application, ApplicationStatus } from '@/types/database';
import FormTextArea from '@/app/components/form/FormTextArea';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { 
  modalBackdrop, 
  btnPrimary, 
  btnSecondary, 
  btnSuccess, 
  btnDanger, 
  btnWarning,
  modalContentLg,
  modalHeader,
  textSecondary,
  textMuted,
  textLabel,
  textBody,
  textPrimary,
  modalCloseBtn,
  headingXl,
  infoBoxRed,
  errorTextInline,
  borderBottom,
  borderTop,
  actionBtnBase,
  actionBtnDefault,
  actionBtnApprove,
  labelStyles,
  actionBtnRevision,
  actionBtnReject
} from '@/lib/styles/shared-styles';

interface ApplicationStatusModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (applicationId: string, status: ApplicationStatus, feedback?: string) => Promise<void>;
  isLoading?: boolean;
}

type ActionType = 'approve' | 'reject' | 'revision';

export default function ApplicationStatusModal({
  application,
  isOpen,
  onClose,
  onUpdateStatus,
  isLoading = false,
}: ApplicationStatusModalProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [feedback, setFeedback] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedAction) {
      setValidationError('Please select an action');
      return;
    }

    // Validate feedback for reject and revision
    if ((selectedAction === 'reject' || selectedAction === 'revision') && !feedback.trim()) {
      setValidationError('Feedback is required for this action');
      return;
    }

    const statusMap: Record<ActionType, ApplicationStatus> = {
      approve: 'approved',
      reject: 'rejected',
      revision: 'revision_requested',
    };

    // Let parent handle API errors via hook callbacks
    await onUpdateStatus(application.id, statusMap[selectedAction], feedback.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setSelectedAction(null);
    setFeedback('');
    setValidationError(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  const actionButtons: { type: ActionType; label: string; color: string; description: string }[] = [
    {
      type: 'approve',
      label: 'Approve',
      color: actionBtnApprove,
      description: 'Accept this student for supervision. This will count against your capacity.',
    },
    {
      type: 'revision',
      label: 'Request Revision',
      color: actionBtnRevision,
      description: 'Ask the student to revise their application with specific improvements.',
    },
    {
      type: 'reject',
      label: 'Reject',
      color: actionBtnReject,
      description: 'Decline this application. Please provide constructive feedback.',
    },
  ];

  return (
    <div 
      className={modalBackdrop}
      onClick={handleBackdropClick}
    >
      <div className={modalContentLg}>
        {/* Header */}
        <div className={`${modalHeader} items-start`}>
          <div>
            <h2 className={headingXl}>Review Application</h2>
            <p className={`text-sm mt-1 ${textSecondary}`}>
              Update the status of this application
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={modalCloseBtn}
            aria-label="Close"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Application Details */}
        <div className={`px-6 py-4 ${borderBottom} bg-gray-50 dark:bg-slate-900/50`}>
          <div className="flex items-start justify-between mb-3">
            <h3 className={`font-semibold ${textPrimary}`}>{application.projectTitle}</h3>
            <StatusBadge status={application.status} variant="application" />
          </div>
          
          <div className="space-y-2 text-sm">
            <p><span className={textMuted}>Student:</span> <span className="font-medium dark:text-slate-200">{application.studentName}</span></p>
            <p><span className={textMuted}>Email:</span> <span className="dark:text-slate-300">{application.studentEmail}</span></p>
            {application.hasPartner && application.partnerName && (
              <p className="text-blue-600 dark:text-blue-400">
                <span className={textMuted}>Partner:</span> {application.partnerName} (Team Project)
              </p>
            )}
          </div>

          {/* Project Description Preview */}
          <div className={`mt-3 pt-3 ${borderTop}`}>
            <p className={`${textLabel} mb-1`}>Project Description:</p>
            <p className={`${textBody} line-clamp-3`}>{application.projectDescription}</p>
          </div>

          {/* Student Info */}
          {(application.studentSkills || application.studentInterests) && (
            <div className={`mt-3 pt-3 ${borderTop} grid grid-cols-2 gap-4`}>
              {application.studentSkills && (
                <div>
                  <p className={`${textLabel} mb-1`}>Skills:</p>
                  <p className={textBody}>{application.studentSkills}</p>
                </div>
              )}
              {application.studentInterests && (
                <div>
                  <p className={`${textLabel} mb-1`}>Interests:</p>
                  <p className={textBody}>{application.studentInterests}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Action Selection */}
          <div className="mb-6">
            <label className={`${labelStyles} mb-3`}>
              Select Action
            </label>
            <div className="space-y-3">
              {actionButtons.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => setSelectedAction(action.type)}
                  disabled={isLoading}
                  className={`${actionBtnBase} ${
                    selectedAction === action.type
                      ? action.color + ' border-current'
                      : actionBtnDefault
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="font-medium">{action.label}</span>
                  <p className="text-xs mt-1 opacity-75">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Textarea */}
          {selectedAction && (
            <div className="mb-6">
              <FormTextArea
                id="feedback"
                name="feedback"
                label={
                  selectedAction === 'approve' 
                    ? 'Feedback (Optional)' 
                    : 'Feedback (Required)'
                }
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder={
                  selectedAction === 'approve'
                    ? 'Add any comments or next steps for the student...'
                    : selectedAction === 'revision'
                    ? 'Explain what changes or improvements are needed...'
                    : 'Provide constructive feedback about why the application was not accepted...'
                }
                required={selectedAction !== 'approve'}
                disabled={isLoading}
                helperText={
                  selectedAction === 'revision'
                    ? 'The student will be able to edit and resubmit their application based on this feedback.'
                    : undefined
                }
              />
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className={`mb-4 ${infoBoxRed}`}>
              <p className={errorTextInline}>{validationError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex gap-3 pt-4 ${borderTop}`}>
            <button
              type="button"
              onClick={handleClose}
              className={`${btnSecondary} flex-1`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 ${
                selectedAction === 'approve' ? btnSuccess :
                selectedAction === 'reject' ? btnDanger :
                selectedAction === 'revision' ? btnWarning :
                btnPrimary
              }`}
              disabled={isLoading || !selectedAction}
            >
              {isLoading ? 'Updating...' : selectedAction ? `Confirm ${actionButtons.find(a => a.type === selectedAction)?.label}` : 'Select an Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
