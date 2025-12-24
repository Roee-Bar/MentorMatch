'use client';

import { useState } from 'react';
import FormInput from '@/app/components/form/FormInput';
import FormTextArea from '@/app/components/form/FormTextArea';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import { SupervisorCardData } from '@/types/database';
import { 
  modalBackdrop, 
  btnPrimary, 
  btnSecondary,
  modalContentLg,
  modalHeader,
  modalBody,
  textSecondary,
  infoBoxBlue,
  infoBoxGray,
  modalCloseBtn,
  errorText,
  charCountText,
  linkEmailWithMargin,
  heading2xl,
  sectionDivider,
  borderTop
} from '@/lib/styles/shared-styles';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: SupervisorCardData;
  studentProfile: any;
  onSubmit: (applicationData: any) => Promise<void>;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  supervisor,
  studentProfile,
  onSubmit,
}: ApplicationModalProps) {
  const [formData, setFormData] = useState<{
    projectTitle: string;
    projectDescription: string;
    partnerEmail?: string;
  }>({
    projectTitle: '',
    projectDescription: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate project title
    if (!formData.projectTitle.trim()) {
      errors.projectTitle = 'Project title is required';
    } else if (formData.projectTitle.length < 5) {
      errors.projectTitle = 'Project title must be at least 5 characters';
    } else if (formData.projectTitle.length > 200) {
      errors.projectTitle = 'Project title must be at most 200 characters';
    }

    // Validate project description
    if (!formData.projectDescription.trim()) {
      errors.projectDescription = 'Project description is required';
    } else if (formData.projectDescription.length < 20) {
      errors.projectDescription = 'Project description must be at least 20 characters';
    } else if (formData.projectDescription.length > 2000) {
      errors.projectDescription = 'Project description must be at most 2000 characters';
    }

    // Validate partner email if provided
    if (formData.partnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.partnerEmail)) {
      errors.partnerEmail = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        supervisorId: supervisor.id,
        projectTitle: formData.projectTitle.trim(),
        projectDescription: formData.projectDescription.trim(),
        hasPartner: !!studentProfile?.partnerId,
        partnerName: studentProfile?.partnerName || undefined,
        partnerEmail: studentProfile?.partnerEmail || undefined,
      });

      // Close modal on success (parent will handle success message)
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={modalBackdrop}
      onClick={handleBackdropClick}
    >
      <div className={modalContentLg} data-application-modal="true">
        {/* Header */}
        <div className={modalHeader}>
          <div>
            <h2 className={heading2xl}>Apply for Supervision</h2>
            <p className={`text-sm mt-1 ${textSecondary}`}>
              Supervisor: <span className="font-medium">{supervisor.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className={modalCloseBtn}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4">
            <StatusMessage 
              type="error" 
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={modalBody}>
          {/* Project Title */}
          <div>
            <FormInput
              label="Project Title"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleChange}
              required
              placeholder="Enter your proposed project title"
              maxLength={200}
              disabled={loading}
            />
            {validationErrors.projectTitle && (
              <p className={errorText}>{validationErrors.projectTitle}</p>
            )}
            <p className={charCountText}>
              {formData.projectTitle.length}/200 characters
            </p>
          </div>

          {/* Project Description */}
          <div>
            <FormTextArea
              label="Project Description"
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleChange}
              required
              placeholder="Describe your project proposal in detail. Include objectives, methodology, and expected outcomes."
              rows={8}
              maxLength={2000}
              showCharCount
              disabled={loading}
            />
            {validationErrors.projectDescription && (
              <p className={errorText}>{validationErrors.projectDescription}</p>
            )}
          </div>

          {/* Partner Information - Display Only */}
          <div className={sectionDivider}>
            {studentProfile?.partnerId ? (
              <div className={`${infoBoxBlue} p-4`}>
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 mr-2 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">Team Project</h3>
                </div>
                <p className="text-sm text-blue-800 mb-2 dark:text-blue-300">
                  Project Partner: <strong>{studentProfile.partnerName || 'Your Partner'}</strong>
                </p>
                <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <p>✓ This application will be submitted as a team project</p>
                  <p>✓ Both students will be listed on the application</p>
                  <p>✓ Your partner can also apply separately to the same supervisor</p>
                  <p>✓ Applications will be automatically linked as one project</p>
                  <p>✓ Only one capacity slot will be used for both students</p>
                </div>
              </div>
            ) : (
              <div className={infoBoxGray}>
                <p className={`text-sm ${textSecondary}`}>
                  This will be an individual project. Want to work with a partner? 
                  <button 
                    type="button"
                    onClick={onClose}
                    className={linkEmailWithMargin}
                  >
                    Find a partner first
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Supervisor Info Preview */}
          <div className={`${sectionDivider} bg-gray-50 -mx-6 px-6 py-4 dark:bg-slate-900/50`}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 dark:text-slate-300">Supervisor Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className={textSecondary}>Name:</span> <span className="font-medium dark:text-slate-200">{supervisor.name}</span></p>
              <p><span className={textSecondary}>Department:</span> <span className="dark:text-slate-300">{supervisor.department}</span></p>
              <p><span className={textSecondary}>Contact:</span> <span className="dark:text-slate-300">{supervisor.contact}</span></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${sectionDivider} -mx-6 px-6 pb-0`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`${btnSecondary} flex-1`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${btnPrimary} flex-1`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
