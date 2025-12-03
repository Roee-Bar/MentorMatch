// app/components/authenticated/ApplicationCard.tsx
// Updated to work with Firebase data types

import type { ApplicationCardData } from '@/types/database';

interface ApplicationCardProps {
  application: ApplicationCardData;
  onWithdraw?: (applicationId: string) => void;
}

export default function ApplicationCard({ application, onWithdraw }: ApplicationCardProps) {
  const statusColors = {
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger',
    under_review: 'badge-info',
    revision_requested: 'badge-orange',
  };

  const statusLabels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    under_review: 'Under Review',
    revision_requested: 'Revision Requested',
  };

  return (
    <div className="card-base">
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
        <span className={statusColors[application.status]}>
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
      <div className="mt-4 pt-4 border-t flex-gap-2">
        {application.status === 'pending' && (
          <button 
            className="btn-danger flex-1"
            onClick={() => onWithdraw?.(application.id)}
          >
            Withdraw
          </button>
        )}
        {application.status === 'revision_requested' && (
          <button className="btn-primary flex-1">
            Edit & Resubmit
          </button>
        )}
        {application.status === 'approved' && (
          <button className="btn-success flex-1">
            View Project Details
          </button>
        )}
      </div>
    </div>
  );
}
