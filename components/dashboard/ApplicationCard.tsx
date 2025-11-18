import { Application } from '@/types/dashboard';

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    under_review: 'bg-blue-100 text-blue-800',
  };

  const statusLabels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    under_review: 'Under Review',
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
        <p className="text-sm text-gray-700 leading-relaxed">
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
          <p className="text-xs text-gray-500 mb-1">Comments:</p>
          <p className="text-sm text-gray-700 italic">
            {application.comments}
          </p>
        </div>
      )}
    </div>
  );
}

