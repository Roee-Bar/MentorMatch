'use client';

// app/authenticated/student/profile/edit/page.tsx
// Student Profile Edit Page - Edit profile information

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import FormInput from '@/app/components/form/FormInput';
import FormTextArea from '@/app/components/form/FormTextArea';
import { Student } from '@/types/database';

export default function StudentProfileEditPage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useStudentAuth();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    department: '',
    skills: '',
    interests: '',
    previousProjects: '',
    preferredTopics: '',
    hasPartner: false,
    partnerName: '',
    partnerEmail: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch student profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push(ROUTES.LOGIN);
          return;
        }

        const response = await apiClient.getStudentById(userId, token);
        if (response.data) {
          const data = response.data;
          setStudent(data);
          
          // Populate form with current data
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            department: data.department || '',
            skills: data.skills || '',
            interests: data.interests || '',
            previousProjects: data.previousProjects || '',
            preferredTopics: data.preferredTopics || '',
            hasPartner: data.hasPartner || false,
            partnerName: data.partnerName || '',
            partnerEmail: data.partnerEmail || '',
          });
        } else {
          setLoadError('Unable to load profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
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
    if (formData.hasPartner && formData.partnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.partnerEmail)) {
      setSaveError('Please enter a valid partner email address');
      return false;
    }
    return true;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
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

      // Prepare update data
      const updateData: any = {
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        department: formData.department,
        skills: formData.skills || undefined,
        interests: formData.interests || undefined,
        previousProjects: formData.previousProjects || undefined,
        preferredTopics: formData.preferredTopics || undefined,
        hasPartner: formData.hasPartner,
      };

      // Only include partner info if hasPartner is true
      if (formData.hasPartner) {
        updateData.partnerName = formData.partnerName || undefined;
        updateData.partnerEmail = formData.partnerEmail || undefined;
      }

      await apiClient.updateStudent(userId!, updateData, token);
      
      setSaveSuccess(true);
      
      // Navigate back to profile after a short delay
      setTimeout(() => {
        router.push(ROUTES.AUTHENTICATED.STUDENT_PROFILE);
      }, 1500);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setSaveError(err.message || 'Failed to update profile. Please try again.');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.AUTHENTICATED.STUDENT_PROFILE);
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (loadError || !student) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-text">{loadError || 'Unable to load profile. Please try again later.'}</p>
          <button
            onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT)}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content-narrow">
        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title">Edit Profile</h1>
          <p className="text-gray-600">
            Update your profile information and click Save Changes when done
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="message-box-success">
            <p className="message-text-success">
              Profile updated successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Error Message */}
        {saveError && (
          <div className="message-box-error">
            <p className="message-text-error">{saveError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-group">
          {/* Personal Information */}
          <div className="card-base">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
            
            <div className="form-section">
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
                value={student.email}
                onChange={() => {}}
                disabled={true}
                helperText="Email cannot be changed"
              />
              
              <FormInput
                label="Student ID"
                name="studentId"
                value={student.studentId}
                onChange={() => {}}
                disabled={true}
                helperText="Student ID cannot be changed"
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
            </div>
          </div>

          {/* Academic Information */}
          <div className="card-base">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Information</h2>
            
            <div className="space-y-4">
              <FormTextArea
                label="Skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                showCharCount={true}
                placeholder="e.g., Python, JavaScript, Machine Learning"
                helperText="List your technical and professional skills"
              />
              
              <FormTextArea
                label="Interests"
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                showCharCount={true}
                placeholder="e.g., Data Science, Web Development, AI"
                helperText="Describe your academic and research interests"
              />
              
              <FormTextArea
                label="Previous Projects"
                name="previousProjects"
                value={formData.previousProjects}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
                showCharCount={true}
                placeholder="Describe any relevant projects you've worked on"
              />
              
              <FormTextArea
                label="Preferred Topics"
                name="preferredTopics"
                value={formData.preferredTopics}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                showCharCount={true}
                placeholder="e.g., Cloud Computing, Mobile Development, Security"
                helperText="Topics you'd like to work on for your project"
              />
            </div>
          </div>

          {/* Partner Information */}
          <div className="card-base">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Partner Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasPartner"
                  name="hasPartner"
                  checked={formData.hasPartner}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasPartner" className="ml-2 text-sm font-medium text-gray-700">
                  I have a project partner
                </label>
              </div>
              
              {formData.hasPartner && (
                <>
                  <FormInput
                    label="Partner Name"
                    name="partnerName"
                    value={formData.partnerName}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="Full name of your partner"
                  />
                  
                  <FormInput
                    label="Partner Email"
                    name="partnerEmail"
                    type="email"
                    value={formData.partnerEmail}
                    onChange={handleInputChange}
                    placeholder="partner@example.com"
                  />
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

