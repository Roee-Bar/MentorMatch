// app/components/authenticated/PartnershipRequestCard.tsx
// Component for displaying partnership requests (incoming/outgoing)

import type { StudentPartnershipRequest } from '@/types/database';

interface PartnershipRequestCardProps {
  request: StudentPartnershipRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export default function PartnershipRequestCard({ 
  request, 
  type, 
  onAccept, 
  onReject, 
  onCancel 
}: PartnershipRequestCardProps) {
  const isIncoming = type === 'incoming';
  
  const displayName = isIncoming ? request.requesterName : request.targetStudentName;
  const displayEmail = isIncoming ? request.requesterEmail : request.targetStudentEmail;
  const displayStudentId = isIncoming ? request.requesterStudentId : '';
  const displayDepartment = isIncoming ? request.requesterDepartment : request.targetDepartment;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString();
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(request.id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(request.id);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(request.id);
    }
  };

  return (
    <div className="card-hover border-l-4 border-blue-400">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex-gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-800">
              {displayName}
            </h3>
            <span className="badge-warning text-xs">
              {isIncoming ? 'Incoming' : 'Outgoing'}
            </span>
          </div>
          <p className="text-sm text-gray-600">{displayDepartment}</p>
          {displayStudentId && (
            <p className="text-xs text-gray-500">ID: {displayStudentId}</p>
          )}
        </div>
      </div>

      {/* Request Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            {isIncoming ? 'From:' : 'To:'}
          </span>
          <a 
            href={`mailto:${displayEmail}`}
            className="text-blue-600 font-medium hover:underline truncate ml-2"
          >
            {displayEmail}
          </a>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Requested:</span>
          <span className="text-gray-800 font-medium">
            {formatDate(request.createdAt)}
          </span>
        </div>
      </div>

      {/* Message */}
      <div className="bg-blue-50 p-3 rounded mb-4">
        <p className="text-sm text-blue-900">
          {isIncoming 
            ? `${request.requesterName} wants to partner with you for your final project.`
            : `Waiting for ${request.targetStudentName} to respond to your partnership request.`
          }
        </p>
      </div>

      {/* Action Buttons */}
      {isIncoming && onAccept && onReject && (
        <div className="flex-gap-2">
          <button
            onClick={handleAccept}
            className="btn-success flex-1"
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            className="btn-secondary flex-1"
          >
            Reject
          </button>
        </div>
      )}

      {!isIncoming && onCancel && (
        <div>
          <button
            onClick={handleCancel}
            className="btn-danger w-full"
          >
            Cancel Request
          </button>
        </div>
      )}
    </div>
  );
}

