'use client';

// Component for supervisors to update application status (approve/reject/request revision)

import { useState } from 'react';
import type { Application, ApplicationStatus } from '@/types/database';
import FormTextArea from '@/app/components/form/FormTextArea';
import StatusBadge from '@/app/components/shared/StatusBadge';

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
      color: 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200',
      description: 'Accept this student for supervision. This will count against your capacity.',
    },
    {
      type: 'revision',
      label: 'Request Revision',
      color: 'bg-orange-100 border-orange-500 text-orange-700 hover:bg-orange-200',
      description: 'Ask the student to revise their application with specific improvements.',
    },
    {
      type: 'reject',
      label: 'Reject',
      color: 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200',
      description: 'Decline this application. Please provide constructive feedback.',
    },
  ];

  return (
    <div 
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Review Application</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update the status of this application
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Application Details */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{application.projectTitle}</h3>
            <StatusBadge status={application.status} variant="application" />
          </div>
          
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Student:</span> <span className="font-medium">{application.studentName}</span></p>
            <p><span className="text-gray-500">Email:</span> {application.studentEmail}</p>
            {application.hasPartner && application.partnerName && (
              <p className="text-blue-600">
                <span className="text-gray-500">Partner:</span> {application.partnerName} (Team Project)
              </p>
            )}
          </div>

          {/* Project Description Preview */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">Project Description:</p>
            <p className="text-sm text-gray-700 line-clamp-3">{application.projectDescription}</p>
          </div>

          {/* Student Info */}
          {(application.studentSkills || application.studentInterests) && (
            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
              {application.studentSkills && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Skills:</p>
                  <p className="text-sm text-gray-700">{application.studentSkills}</p>
                </div>
              )}
              {application.studentInterests && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Interests:</p>
                  <p className="text-sm text-gray-700">{application.studentInterests}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Action Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      : 'bg-white border-gray-200 hover:border-gray-300'
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 ${
                selectedAction === 'approve' ? 'btn-success' :
                selectedAction === 'reject' ? 'btn-danger' :
                selectedAction === 'revision' ? 'btn-warning' :
                'btn-primary'
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

