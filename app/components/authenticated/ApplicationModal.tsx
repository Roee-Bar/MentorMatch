'use client';

import { useState } from 'react';
import FormInput from '@/app/components/form/FormInput';
import FormTextArea from '@/app/components/form/FormTextArea';
import { SupervisorCardData } from '@/types/database';

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
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDescription: '',
    hasPartner: studentProfile?.hasPartner || false,
    partnerName: studentProfile?.partnerName || '',
    partnerEmail: studentProfile?.partnerEmail || '',
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
        hasPartner: formData.hasPartner,
        partnerName: formData.partnerName.trim() || undefined,
        partnerEmail: formData.partnerEmail.trim() || undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Apply for Supervision</h2>
            <p className="text-sm text-gray-600 mt-1">
              Supervisor: <span className="font-medium">{supervisor.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              <p className="text-red-600 text-xs mt-1">{validationErrors.projectTitle}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
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
              <p className="text-red-600 text-xs mt-1">{validationErrors.projectDescription}</p>
            )}
          </div>

          {/* Partner Information */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="hasPartner"
                name="hasPartner"
                checked={formData.hasPartner}
                onChange={handleChange}
                disabled={loading}
                className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasPartner" className="text-sm font-medium text-gray-700">
                I have a partner for this project
              </label>
            </div>

            {formData.hasPartner && (
              <div className="space-y-4 ml-6">
                <FormInput
                  label="Partner Name"
                  name="partnerName"
                  value={formData.partnerName}
                  onChange={handleChange}
                  placeholder="Enter your partner's full name"
                  disabled={loading}
                />

                <div>
                  <FormInput
                    label="Partner Email"
                    name="partnerEmail"
                    type="email"
                    value={formData.partnerEmail}
                    onChange={handleChange}
                    placeholder="Enter your partner's email address"
                    disabled={loading}
                  />
                  {validationErrors.partnerEmail && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors.partnerEmail}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Supervisor Info Preview */}
          <div className="border-t pt-6 bg-gray-50 -mx-6 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Supervisor Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Name:</span> <span className="font-medium">{supervisor.name}</span></p>
              <p><span className="text-gray-600">Department:</span> {supervisor.department}</p>
              <p><span className="text-gray-600">Contact:</span> {supervisor.contact}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-t pt-6 -mx-6 px-6 pb-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

