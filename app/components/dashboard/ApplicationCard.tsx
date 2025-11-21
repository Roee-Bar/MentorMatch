// app/components/dashboard/ApplicationCard.tsx
// Updated to work with Firebase data types

import type { ApplicationCardData } from '@/types/database';

interface ApplicationCardProps {
  application: ApplicationCardData;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    under_review: 'bg-blue-100 text-blue-800',
    revision_requested: 'bg-orange-100 text-orange-800',
  };

  const statusLabels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    under_review: 'Under Review',
    revision_requested: 'Revision Requested',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      {/* Header with Title and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {application.projectTitle}
          </h3>
          <p className="text-sm text-gray-600">
            Supervisor: {application.supervisorName}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusColors[application.status]
          }`}
        >
          {statusLabels[application.status]}
        </span>
      </div>

      {/* Project Description */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
          {application.projectDescription}
        </p>
      </div>

      {/* Application Details */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date Applied:</span>
          <span className="text-gray-800 font-medium">
            {application.dateApplied}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Expected Response:</span>
          <span className="text-gray-800 font-medium">
            {application.responseTime}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      {application.comments && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-1">Supervisor Feedback:</p>
          <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded">
            {application.comments}
          </p>
        </div>
      )}

      {/* Action Buttons based on status */}
      <div className="mt-4 pt-4 border-t flex gap-2">
        {application.status === 'pending' && (
          <button className="flex-1 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Withdraw
          </button>
        )}
        {application.status === 'revision_requested' && (
          <button className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Edit & Resubmit
          </button>
        )}
        {application.status === 'approved' && (
          <button className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View Project Details
          </button>
        )}
      </div>
    </div>
  );
}