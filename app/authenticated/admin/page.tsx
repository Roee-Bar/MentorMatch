'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import CapacityEditModal from './_components/CapacityEditModal';
import type { Supervisor } from '@/types/database';

export default function AdminAuthenticated() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        // No user logged in - redirect to homepage
        router.replace('/');
        return;
      }

      // Get user profile to check role
      const token = await user.getIdToken();
      const profile = await getUserProfile(user.uid, token);
      
      if (!profile.success || !profile.data) {
        router.replace('/');
        return;
      }

      // Check if user is admin
      if (profile.data.role !== 'admin') {
        // Not an admin - redirect to homepage
        router.replace('/');
        return;
      }

      // User is authenticated and is an admin
      setAuthorized(true);
      
      // Fetch admin stats
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await apiClient.getAdminStats(token);
        setStats(response.data);

        fetchSupervisors(token);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load statistics. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSupervisors = async (token?: string) => {
    setLoadingSupervisors(true);
    try {
      if (!token) {
        token = await auth.currentUser?.getIdToken();
      }
      if (!token) return;

      const response = await apiClient.getSupervisors(token, {});
      setSupervisors(response.data || []);
    } catch (err) {
      console.error('Error fetching supervisors:', err);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const handleEditCapacity = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowCapacityModal(true);
  };

  const handleCapacityUpdateSuccess = async () => {
    setSuccessMessage('Supervisor capacity updated successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
    
    // Refresh supervisors list
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      await fetchSupervisors(token);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (!authorized) {
    return null; // Will redirect
  }

  return (
    <div className="page-container-simple">
      <div className="page-content py-8">
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
          <h1 className="text-3xl font-bold text-gray-900 text-balance">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage users, projects, and system settings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid-stats">
          <div className="card-base">
            <div className="flex-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats?.totalStudents ?? '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card-base">
            <div className="flex-between">
              <div>
                <p className="text-sm text-gray-500">Total Supervisors</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats?.totalSupervisors ?? '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card-base">
            <div className="flex-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats?.totalProjects ?? '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card-base">
            <div className="flex-between">
              <div>
                <p className="text-sm text-gray-500">Pending Applications</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stats?.pendingApplications ?? '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="card-base">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/admin/seed')}
              className="btn-primary text-left p-4 flex items-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <div>
                <div className="font-medium">Database Seeder</div>
                <div className="text-sm text-gray-500">Populate test data</div>
              </div>
            </button>

            <button className="btn-secondary text-left p-4 flex items-center space-x-3" disabled>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <div className="font-medium">Manage Users</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </button>

            <button className="btn-secondary text-left p-4 flex items-center space-x-3" disabled>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </button>
          </div>
        </div>

        {/* Supervisor Capacity Management Section */}
        <div className="card-base">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Manage Supervisor Capacity</h2>
            <button
              onClick={() => fetchSupervisors()}
              className="text-blue-600 text-sm font-medium hover:underline"
              disabled={loadingSupervisors}
            >
              {loadingSupervisors ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loadingSupervisors ? (
            <div className="text-center py-8">
              <LoadingSpinner message="Loading supervisors..." />
            </div>
          ) : supervisors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No supervisors found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supervisors.map((supervisor) => (
                    <tr key={supervisor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supervisor.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {supervisor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {supervisor.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {supervisor.currentCapacity} / {supervisor.maxCapacity}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              supervisor.currentCapacity >= supervisor.maxCapacity
                                ? 'bg-red-500'
                                : supervisor.currentCapacity / supervisor.maxCapacity > 0.8
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (supervisor.currentCapacity / supervisor.maxCapacity) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            supervisor.availabilityStatus === 'available'
                              ? 'bg-green-100 text-green-800'
                              : supervisor.availabilityStatus === 'limited'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {supervisor.availabilityStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCapacity(supervisor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit Capacity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Capacity Edit Modal */}
        {selectedSupervisor && (
          <CapacityEditModal
            supervisor={selectedSupervisor}
            isOpen={showCapacityModal}
            onClose={() => {
              setShowCapacityModal(false);
              setSelectedSupervisor(null);
            }}
            onSuccess={handleCapacityUpdateSuccess}
          />
        )}
      </div>
    </div>
  );
}

