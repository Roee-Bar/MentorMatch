'use client';

// app/authenticated/student/applications/[id]/edit/page.tsx
// Student Application Edit Page - Edit and resubmit application after revision request

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudentAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import FormInput from '@/app/components/form/FormInput';
import FormTextArea from '@/app/components/form/FormTextArea';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import ErrorState from '@/app/components/feedback/ErrorState';
import FormCard from '@/app/components/display/FormCard';
import ConfirmModal from '@/app/components/shared/ConfirmModal';
import { Application } from '@/types/database';
import { btnPrimary, btnSecondary, btnSuccess } from '@/lib/styles/shared-styles';

export default function ApplicationEditPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const { userId, isAuthLoading } = useStudentAuth();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDescription: '',
    isOwnTopic: true,
    proposedTopicId: '',
    studentSkills: '',
    studentInterests: '',
    hasPartner: false,
    partnerName: '',
    partnerEmail: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch application data
  useEffect(() => {
    const fetchApplication = async () => {
      if (!userId || !applicationId) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push(ROUTES.LOGIN);
          return;
        }

        const response = await apiClient.getApplicationById(applicationId, token);
        if (response.data) {
          const data = response.data;
          
          // Authorization check
          if (data.studentId !== userId) {
            setLoadError('You do not have permission to edit this application');
            return;
          }

          // Status check
          if (data.status !== 'revision_requested') {
            setLoadError('This application cannot be edited. Only applications in revision_requested status can be edited.');
            return;
          }

          setApplication(data);
          
          // Populate form with current data
          setFormData({
            projectTitle: data.projectTitle || '',
            projectDescription: data.projectDescription || '',
            isOwnTopic: data.isOwnTopic ?? true,
            proposedTopicId: data.proposedTopicId || '',
            studentSkills: data.studentSkills || '',
            studentInterests: data.studentInterests || '',
            hasPartner: data.hasPartner || false,
            partnerName: data.partnerName || '',
            partnerEmail: data.partnerEmail || '',
          });
        } else {
          setLoadError('Application not found');
        }
      } catch (err) {
        console.error('Error fetching application:', err);
        setLoadError('Failed to load application. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    if (userId && applicationId) {
      fetchApplication();
    }
  }, [userId, applicationId, router]);

  const validateForm = (): boolean => {
    if (!formData.projectTitle.trim()) {
      setSaveError('Project title is required');
      return false;
    }
    if (formData.projectTitle.length < 5) {
      setSaveError('Project title must be at least 5 characters');
      return false;
    }
    if (!formData.projectDescription.trim()) {
      setSaveError('Project description is required');
      return false;
    }
    if (formData.projectDescription.length < 10) {
      setSaveError('Project description must be at least 10 characters');
      return false;
    }
    if (!formData.studentSkills.trim()) {
      setSaveError('Skills are required');
      return false;
    }
    if (!formData.studentInterests.trim()) {
      setSaveError('Interests are required');
      return false;
    }
    if (formData.hasPartner) {
      if (!formData.partnerName?.trim()) {
        setSaveError('Partner name is required when applying as a team');
        return false;
      }
      if (!formData.partnerEmail?.trim()) {
        setSaveError('Partner email is required when applying as a team');
        return false;
      }
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare update data
      const updateData = {
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        isOwnTopic: formData.isOwnTopic,
        proposedTopicId: formData.proposedTopicId || undefined,
        studentSkills: formData.studentSkills,
        studentInterests: formData.studentInterests,
        hasPartner: formData.hasPartner,
        partnerName: formData.hasPartner ? formData.partnerName : undefined,
        partnerEmail: formData.hasPartner ? formData.partnerEmail : undefined,
      };

      await apiClient.updateApplication(applicationId, updateData, token);
      
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating application:', err);
      setSaveError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubmitClick = () => {
    setSaveError(null);
    setSaveSuccess(false);
    setShowConfirmModal(true);
  };

  const handleConfirmResubmit = async () => {
    setShowConfirmModal(false);
    setIsResubmitting(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await apiClient.resubmitApplication(applicationId, token);
      
      // Navigate back to dashboard - success message will show there
      router.push(ROUTES.AUTHENTICATED.STUDENT);
    } catch (err: any) {
      console.error('Error resubmitting application:', err);
      setSaveError(err.message || 'Failed to resubmit application. Please try again.');
      setIsResubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.AUTHENTICATED.STUDENT);
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading application..." />;
  }

  // Show error state
  if (loadError || !application) {
    return (
      <PageLayout>
        <ErrorState message={loadError || 'Application not found'} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Edit Application"
        description="Update your application based on supervisor feedback"
      />

      {/* Supervisor Feedback Box */}
      {application.supervisorFeedback && (
        <div className="mb-6 bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-1">Revision Requested by Supervisor</h3>
              <p className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                {application.supervisorFeedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {saveError && (
        <StatusMessage 
          message={saveError} 
          type="error"
          className="mb-6"
        />
      )}
      {saveSuccess && (
        <StatusMessage 
          message="Changes saved successfully! You can continue editing or resubmit to the supervisor." 
          type="success"
          className="mb-6"
        />
      )}

      {/* Form */}
      <form onSubmit={handleSave}>
        <FormCard title="Application Details">
          <div className="space-y-6">
            {/* Project Title */}
            <FormInput
              label="Project Title"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleInputChange}
              required
              placeholder="Enter your project title"
              helperText="Provide a clear, descriptive title for your project"
            />

            {/* Project Description */}
            <FormTextArea
              label="Project Description / Motivation Letter"
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleInputChange}
              required
              rows={8}
              placeholder="Describe your project idea and explain why you're interested in working with this supervisor..."
              helperText="Provide a detailed description of your project proposal and motivation"
            />

            {/* Student Skills */}
            <FormTextArea
              label="Your Skills"
              name="studentSkills"
              value={formData.studentSkills}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="List your relevant skills and technical competencies..."
              helperText="Highlight skills that are relevant to this project"
            />

            {/* Student Interests */}
            <FormTextArea
              label="Your Interests"
              name="studentInterests"
              value={formData.studentInterests}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Describe your research interests and academic focus areas..."
              helperText="Explain your academic and research interests"
            />

            {/* Partner Information */}
            <div className="border-t pt-6">
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  name="hasPartner"
                  checked={formData.hasPartner}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This is a team project (with a partner)
                </span>
              </label>

              {formData.hasPartner && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <FormInput
                    label="Partner Name"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleInputChange}
                    required={formData.hasPartner}
                    placeholder="Enter your partner's full name"
                  />
                  <FormInput
                    label="Partner Email"
                    name="partnerEmail"
                    type="email"
                    value={formData.partnerEmail}
                    onChange={handleInputChange}
                    required={formData.hasPartner}
                    placeholder="Enter your partner's email address"
                  />
                </div>
              )}
            </div>
          </div>
        </FormCard>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`${btnSecondary} disabled:opacity-50`}
            disabled={isSaving || isResubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={btnPrimary}
            disabled={isSaving || isResubmitting}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleResubmitClick}
            className={btnSuccess}
            disabled={isSaving || isResubmitting}
          >
            {isResubmitting ? 'Resubmitting...' : 'Resubmit to Supervisor'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Resubmission"
        message="Are you sure you want to resubmit this application to the supervisor? This will move it back to pending status for review."
        confirmLabel="Yes, Resubmit"
        cancelLabel="Cancel"
        variant="success"
        onConfirm={handleConfirmResubmit}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={isResubmitting}
      />
    </PageLayout>
  );
}

