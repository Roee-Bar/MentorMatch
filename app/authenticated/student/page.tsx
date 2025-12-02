'use client';

// app/authenticated/student/page.tsx
// Updated Student Authenticated - Uses real Firebase data

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import StatCard from '@/app/components/authenticated/StatCard';
import ApplicationCard from '@/app/components/authenticated/ApplicationCard';
import SupervisorCard from '@/app/components/authenticated/SupervisorCard';
import StudentCard from '@/app/components/authenticated/StudentCard';
import PartnershipRequestCard from '@/app/components/authenticated/PartnershipRequestCard';
import ApplicationModal from '@/app/components/authenticated/ApplicationModal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import { ApplicationCardData, SupervisorCardData, StudentCardData, StudentPartnershipRequest } from '@/types/database';

export default function StudentAuthenticated() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationCardData[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorCardData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentCardData[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<StudentPartnershipRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<StudentPartnershipRequest[]>([]);
  const [currentPartner, setCurrentPartner] = useState<StudentCardData | null>(null);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorCardData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        // User not logged in - redirect to homepage
        router.replace('/');
        return;
      }

      // Get user profile to verify they're a student
      const token = await user.getIdToken();
      const profile = await getUserProfile(user.uid, token);
      if (!profile.success || profile.data?.role !== 'student') {
        // Redirect non-students to appropriate authenticated page
        if (profile.data?.role === 'supervisor') {
          router.replace('/authenticated/supervisor');
        } else if (profile.data?.role === 'admin') {
          router.replace('/authenticated/admin');
        } else {
          router.replace('/');
        }
        return;
      }

      setUserId(user.uid);
      setUserProfile(profile.data);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);
      
      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API endpoints
        const [appsResponse, supervisorsResponse] = await Promise.all([
          apiClient.getStudentApplications(userId, token),
          apiClient.getSupervisors(token, { available: true }),
        ]);

        setApplications(appsResponse.data);
        setSupervisors(supervisorsResponse.data);

        // Fetch partnership data
        try {
          const [studentsRes, incomingRes, outgoingRes] = await Promise.all([
            apiClient.getAvailablePartners(token),
            apiClient.getPartnershipRequests(userId, 'incoming', token),
            apiClient.getPartnershipRequests(userId, 'outgoing', token),
          ]);

          setAvailableStudents(studentsRes.data || []);
          setIncomingRequests(incomingRes.data || []);
          setOutgoingRequests(outgoingRes.data || []);

          // Get partner details if student has a partner
          if (userProfile?.partnerId) {
            try {
              const partnerRes = await apiClient.getPartnerDetails(userProfile.partnerId, token);
              setCurrentPartner(partnerRes.data);
            } catch (partnerError) {
              console.error('Error fetching partner details:', partnerError);
              setCurrentPartner(null);
            }
          }
        } catch (partnershipError) {
          console.error('Error fetching partnership data:', partnershipError);
          // Don't fail the whole page if partnership data fails
          setAvailableStudents([]);
          setIncomingRequests([]);
          setOutgoingRequests([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        // Even on error, we should stop loading to show the page
        setApplications([]);
        setSupervisors([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, router]);

  // Handle apply button click
  const handleApply = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    if (supervisor) {
      setSelectedSupervisor(supervisor);
      setShowApplicationModal(true);
    }
  };

  // Handle application submission
  const handleSubmitApplication = async (applicationData: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.createApplication({
        supervisorId: selectedSupervisor?.id,
        ...applicationData
      }, token);

      // Refresh applications list
      const appsResponse = await apiClient.getStudentApplications(userId!, token);
      setApplications(appsResponse.data);

      // Close modal and show success
      setShowApplicationModal(false);
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error creating application:', error);
      throw error; // Let modal handle the error display
    }
  };

  // Handle application withdrawal
  const handleWithdrawApplication = async (applicationId: string) => {
    // Confirm before deletion using browser's native confirm dialog
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Use existing API client method
      await apiClient.deleteApplication(applicationId, token);

      // Refresh applications list using existing pattern
      const appsResponse = await apiClient.getStudentApplications(userId!, token);
      setApplications(appsResponse.data);

      // Show success message using existing StatusMessage component pattern
      setSuccessMessage('Application withdrawn successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setError('Failed to withdraw application. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Partnership handlers
  const refreshPartnershipData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const [studentsRes, incomingRes, outgoingRes, profileRes] = await Promise.all([
        apiClient.getAvailablePartners(token),
        apiClient.getPartnershipRequests(userId!, 'incoming', token),
        apiClient.getPartnershipRequests(userId!, 'outgoing', token),
        apiClient.getStudentById(userId!, token),
      ]);

      setAvailableStudents(studentsRes.data || []);
      setIncomingRequests(incomingRes.data || []);
      setOutgoingRequests(outgoingRes.data || []);
      
      // Update user profile with latest data
      if (profileRes.success && profileRes.data) {
        setUserProfile({ ...userProfile, ...profileRes.data });
        
        // Get partner details if newly paired
        if (profileRes.data.partnerId && profileRes.data.partnerId !== currentPartner?.id) {
          const partnerRes = await apiClient.getPartnerDetails(profileRes.data.partnerId, token);
          setCurrentPartner(partnerRes.data);
        } else if (!profileRes.data.partnerId) {
          setCurrentPartner(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing partnership data:', error);
    }
  };

  const handleRequestPartnership = async (targetStudentId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.createPartnershipRequest({ targetStudentId }, token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership request sent successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error sending partnership request:', error);
      setError(error.message || 'Failed to send partnership request.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAcceptPartnership = async (requestId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.respondToPartnershipRequest(requestId, 'accept', token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership accepted! You are now paired.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error accepting partnership:', error);
      setError(error.message || 'Failed to accept partnership request.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRejectPartnership = async (requestId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.respondToPartnershipRequest(requestId, 'reject', token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership request rejected.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error rejecting partnership:', error);
      setError(error.message || 'Failed to reject partnership request.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.cancelPartnershipRequest(requestId, token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership request cancelled.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      setError(error.message || 'Failed to cancel partnership request.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUnpair = async () => {
    if (!confirm('Are you sure you want to unpair from your partner? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.unpairFromPartner(token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Successfully unpaired from your partner.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error unpairing:', error);
      setError(error.message || 'Failed to unpair from partner.');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Calculate stats
  const approvedCount = applications.filter((app) => app.status === 'approved').length;
  const pendingCount = applications.filter(
    (app) => app.status === 'pending' || app.status === 'under_review'
  ).length;

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Error Banner */}
        {error && (
          <StatusMessage 
            message={error} 
            type="error"
          />
        )}

        {/* Success Message */}
        {successMessage && (
          <StatusMessage 
            message={successMessage} 
            type="success"
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.name || 'Student'}! Here&apos;s your project matching overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid-stats">
          <StatCard
            title="My Applications"
            value={applications.length}
            description="Total applications"
            color="blue"
          />

          <StatCard
            title="Pending Review"
            value={pendingCount}
            description="Awaiting response"
            color="gray"
          />

          <StatCard
            title="Approved"
            value={approvedCount}
            description="Approved applications"
            color="green"
          />

          <StatCard
            title="Available Supervisors"
            value={supervisors.length}
            description="Ready to accept students"
            color="blue"
          />
        </div>

        {/* Partnership Requests Section - Show if any exist */}
        {incomingRequests.length > 0 && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">Partnership Requests</h2>
              <span className="badge-warning">{incomingRequests.length} Pending</span>
            </div>
            <div className="grid-cards">
              {incomingRequests.map(request => (
                <PartnershipRequestCard
                  key={request.id}
                  request={request}
                  type="incoming"
                  onAccept={handleAcceptPartnership}
                  onReject={handleRejectPartnership}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Partner Section - Show if paired */}
        {currentPartner && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">My Partner</h2>
            </div>
            <div className="grid-cards">
              <StudentCard
                student={currentPartner}
                showRequestButton={false}
                isCurrentPartner={true}
                onUnpair={handleUnpair}
              />
            </div>
          </div>
        )}

        {/* Outgoing Requests - Show if any */}
        {outgoingRequests.length > 0 && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">Pending Partnership Requests</h2>
              <span className="badge-warning">{outgoingRequests.length} Sent</span>
            </div>
            <div className="grid-cards">
              {outgoingRequests.map(request => (
                <PartnershipRequestCard
                  key={request.id}
                  request={request}
                  type="outgoing"
                  onCancel={handleCancelRequest}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Students - Show if not paired */}
        {!currentPartner && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">Available Students</h2>
              <button
                onClick={() => setShowAllStudents(!showAllStudents)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                {showAllStudents ? 'Show Less' : 'View All'} →
              </button>
            </div>
            
            {availableStudents.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No available students at the moment.</p>
              </div>
            ) : (
              <div className="grid-cards">
                {(showAllStudents ? availableStudents : availableStudents.slice(0, 3))
                  .map(student => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onRequestPartnership={handleRequestPartnership}
                      showRequestButton={true}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* My Applications Section */}
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">My Applications</h2>
            <button
              onClick={() => router.push('/supervisors')}
              className="btn-primary"
            >
              + New Application
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text mb-4">You haven&apos;t submitted any applications yet.</p>
              <button
                onClick={() => router.push('/supervisors')}
                className="btn-primary px-6 py-2"
              >
                Browse Supervisors
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {applications.map((application) => (
                <ApplicationCard 
                  key={application.id} 
                  application={application}
                  onWithdraw={handleWithdrawApplication}
                />
              ))}
            </div>
          )}
        </div>

        {/* Available Supervisors Section */}
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Available Supervisors</h2>
            <button
              onClick={() => router.push('/supervisors')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>

          {supervisors.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No supervisors available at the moment.</p>
            </div>
          ) : (
            <div className="grid-cards">
              {supervisors.slice(0, 3).map((supervisor) => (
                <SupervisorCard 
                  key={supervisor.id} 
                  supervisor={supervisor}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}
        </div>

        {/* Application Modal */}
        {showApplicationModal && selectedSupervisor && (
          <ApplicationModal
            isOpen={showApplicationModal}
            onClose={() => setShowApplicationModal(false)}
            supervisor={selectedSupervisor}
            studentProfile={userProfile}
            onSubmit={handleSubmitApplication}
          />
        )}
      </div>
    </div>
  );
}