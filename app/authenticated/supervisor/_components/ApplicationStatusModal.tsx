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
  textBody
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
      color: 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/70',
      description: 'Accept this student for supervision. This will count against your capacity.',
    },
    {
      type: 'revision',
      label: 'Request Revision',
      color: 'bg-orange-100 border-orange-500 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/70',
      description: 'Ask the student to revise their application with specific improvements.',
    },
    {
      type: 'reject',
      label: 'Reject',
      color: 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/70',
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Review Application</h2>
            <p className={`text-sm mt-1 ${textSecondary}`}>
              Update the status of this application
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none dark:text-slate-500 dark:hover:text-slate-300"
            aria-label="Close"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Application Details */}
        <div className="px-6 py-4 border-b bg-gray-50 dark:bg-slate-900/50 dark:border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">{application.projectTitle}</h3>
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
          <div className="mt-3 pt-3 border-t dark:border-slate-700">
            <p className={`${textLabel} mb-1`}>Project Description:</p>
            <p className={`${textBody} line-clamp-3`}>{application.projectDescription}</p>
          </div>

          {/* Student Info */}
          {(application.studentSkills || application.studentInterests) && (
            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 dark:border-slate-700">
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
            <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-slate-300">
              Select Action
            </label>
            <div className="space-y-3">
              {actionButtons.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => setSelectedAction(action.type)}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAction === action.type
                      ? action.color + ' border-current'
                      : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500 dark:text-slate-200'
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded dark:bg-red-900/30 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t dark:border-slate-700">
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
