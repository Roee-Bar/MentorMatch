'use client';

// app/authenticated/supervisor/profile/edit/page.tsx
// Supervisor Profile Edit Page - Edit profile information

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
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
import FormActions from '@/app/components/display/FormActions';
import { Supervisor } from '@/types/database';
import { labelStyles, inputStyles, helperStyles, inputDisabled } from '@/lib/styles/shared-styles';

export default function SupervisorProfileEditPage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useAuth({ expectedRole: 'supervisor' });
  
  const [dataLoading, setDataLoading] = useState(true);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    department: '',
    bio: '',
    researchInterests: '',
    expertiseAreas: '',
    officeLocation: '',
    officeHours: '',
    maxCapacity: 5,
    availabilityStatus: 'available' as 'available' | 'limited' | 'unavailable',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch supervisor profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push(ROUTES.LOGIN);
          return;
        }

        const response = await apiClient.getSupervisorById(userId, token);
        if (response.data) {
          const data = response.data;
          setSupervisor(data);
          
          // Populate form with current data
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            department: data.department || '',
            bio: data.bio || '',
            researchInterests: data.researchInterests?.join(', ') || '',
            expertiseAreas: data.expertiseAreas?.join(', ') || '',
            officeLocation: data.officeLocation || '',
            officeHours: data.officeHours || '',
            maxCapacity: data.maxCapacity || 5,
            availabilityStatus: data.availabilityStatus || 'available',
          });
        } else {
          setLoadError('Unable to load profile');
        }
      } catch (err) {
        setLoadError('Failed to load profile. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, router]);

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setSaveError('Full name is required');
      return false;
    }
    if (formData.phone && formData.phone.length < 10) {
      setSaveError('Phone number must be at least 10 digits');
      return false;
    }
    if (!formData.department.trim()) {
      setSaveError('Department is required');
      return false;
    }
    if (!formData.bio.trim()) {
      setSaveError('Bio is required');
      return false;
    }
    if (formData.bio.length > 2000) {
      setSaveError('Bio must be at most 2000 characters');
      return false;
    }
    if (!formData.researchInterests.trim()) {
      setSaveError('Research interests are required');
      return false;
    }
    if (!formData.expertiseAreas.trim()) {
      setSaveError('Expertise areas are required');
      return false;
    }
    if (formData.maxCapacity < (supervisor?.currentCapacity || 0)) {
      setSaveError('Maximum capacity cannot be less than current capacity');
      return false;
    }
    if (formData.maxCapacity > 20) {
      setSaveError('Maximum capacity cannot exceed 20');
      return false;
    }
    return true;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Convert comma-separated strings to arrays
      const updateData = {
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        department: formData.department,
        bio: formData.bio,
        researchInterests: formData.researchInterests
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        expertiseAreas: formData.expertiseAreas
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        officeLocation: formData.officeLocation || undefined,
        officeHours: formData.officeHours || undefined,
        maxCapacity: formData.maxCapacity,
        availabilityStatus: formData.availabilityStatus,
      };

      await apiClient.updateSupervisor(userId!, updateData, token);
      
      setSaveSuccess(true);
      
      // Navigate back to profile after a short delay
      setTimeout(() => {
        router.push(ROUTES.AUTHENTICATED.SUPERVISOR_PROFILE);
      }, 1500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile. Please try again.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.AUTHENTICATED.SUPERVISOR_PROFILE);
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (loadError || !supervisor) {
    return (
      <ErrorState
        message={loadError || 'Unable to load profile. Please try again later.'}
        action={{
          label: 'Back to Dashboard',
          onClick: () => router.push(ROUTES.AUTHENTICATED.SUPERVISOR)
        }}
      />
    );
  }

  return (
    <PageLayout variant="narrow">
      {/* Header */}
      <PageHeader
        title="Edit Profile"
        description="Update your profile information and click Save Changes when done"
      />

      {/* Success Message */}
      {saveSuccess && (
        <StatusMessage
          message="Profile updated successfully! Redirecting..."
          type="success"
          className="mb-6"
        />
      )}

      {/* Error Message */}
      {saveError && (
        <StatusMessage
          message={saveError}
          type="error"
          className="mb-6"
        />
      )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <FormCard title="Personal Information">
            <FormInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              minLength={1}
              maxLength={100}
            />
            
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={supervisor.email}
              onChange={() => {}}
              disabled={true}
              helperText="Email cannot be changed"
            />
            
            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              minLength={10}
              placeholder="e.g., 555-123-4567"
            />
            
            <FormInput
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              minLength={1}
            />
          </FormCard>

          {/* Bio */}
          <FormCard title="Bio">
            <FormTextArea
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={6}
              maxLength={2000}
              showCharCount={true}
              helperText="Describe your background and research focus"
              required
            />
          </FormCard>

          {/* Research Interests */}
          <FormCard title="Research Interests">
            <FormInput
              label="Research Interests"
              name="researchInterests"
              value={formData.researchInterests}
              onChange={handleInputChange}
              placeholder="e.g., Machine Learning, Data Science, Web Development"
              helperText="Separate multiple interests with commas"
              required
            />
          </FormCard>

          {/* Expertise Areas */}
          <FormCard title="Expertise Areas">
            <FormInput
              label="Expertise Areas"
              name="expertiseAreas"
              value={formData.expertiseAreas}
              onChange={handleInputChange}
              placeholder="e.g., Python, JavaScript, Cloud Computing"
              helperText="Separate multiple areas with commas"
              required
            />
          </FormCard>

          {/* Office Information */}
          <FormCard title="Office Information">
            <FormInput
              label="Office Location"
              name="officeLocation"
              value={formData.officeLocation}
              onChange={handleInputChange}
              placeholder="e.g., Building A, Room 305"
              maxLength={100}
            />
            
            <FormInput
              label="Office Hours"
              name="officeHours"
              value={formData.officeHours}
              onChange={handleInputChange}
              placeholder="e.g., Monday 2-4 PM, Wednesday 10-12 PM"
              maxLength={200}
            />
          </FormCard>

          {/* Capacity Management */}
          <FormCard title="Supervision Capacity">
            {/* Current Capacity - Read Only */}
            <div>
              <label className={labelStyles}>Current Capacity</label>
              <div className={inputDisabled}>
                {supervisor?.currentCapacity || 0} projects currently supervised
              </div>
              <small className={helperStyles}>
                This is automatically calculated based on your active projects
              </small>
            </div>
            
            {/* Max Capacity - Editable */}
            <FormInput
              label="Maximum Capacity"
              name="maxCapacity"
              type="number"
              value={formData.maxCapacity.toString()}
              onChange={handleInputChange}
              required
              min={supervisor?.currentCapacity || 0}
              max={20}
              helperText="Maximum number of projects you can supervise this semester"
            />
            
            {/* Availability Status */}
            <div>
              <label htmlFor="availabilityStatus" className={labelStyles}>
                Availability Status *
              </label>
              <select
                id="availabilityStatus"
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleInputChange}
                className={inputStyles}
                required
              >
                <option value="available">Available - Accepting new students</option>
                <option value="limited">Limited - Few spots remaining</option>
                <option value="unavailable">Unavailable - Not accepting students</option>
              </select>
              <small className={helperStyles}>
                This status will be shown to students browsing supervisors
              </small>
            </div>
          </FormCard>

          {/* Action Buttons */}
          <FormActions
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        </form>
    </PageLayout>
  );
}

