// app/components/shared/SupervisorPartnershipRequestCard.tsx
// Component for displaying supervisor partnership requests (incoming/outgoing)

import type { SupervisorPartnershipRequest } from '@/types/database';
import { 
  cardHover, 
  btnSuccess, 
  btnSecondary, 
  btnDanger, 
  badgeWarning,
  badgeSuccess,
  badgeInfo,
  cardHeader,
  cardDetailRow,
  textSecondary,
  textMuted,
  textValue,
  headingLg,
  infoBoxBlue,
  textInfoDark,
  textLabel,
  borderLeftAccentBlue
} from '@/lib/styles/shared-styles';

interface SupervisorPartnershipRequestCardProps {
  request: SupervisorPartnershipRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  isLoading?: boolean;
}

export default function SupervisorPartnershipRequestCard({ 
  request, 
  type, 
  onAccept, 
  onReject, 
  onCancel,
  isLoading = false
}: SupervisorPartnershipRequestCardProps) {
  const isIncoming = type === 'incoming';
  
  const displayName = isIncoming ? request.requestingSupervisorName : request.targetSupervisorName;
  const projectTitle = request.projectTitle;

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

  const getStatusBadge = () => {
    if (request.status === 'accepted') {
      return <span className={badgeSuccess}>Accepted</span>;
    }
    if (request.status === 'rejected') {
      return <span className={badgeInfo}>Rejected</span>;
    }
    if (request.status === 'cancelled') {
      return <span className={badgeInfo}>Cancelled</span>;
    }
    return <span className={badgeWarning}>{isIncoming ? 'Incoming' : 'Outgoing'}</span>;
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
    <div className={`${cardHover} ${borderLeftAccentBlue}`}>
      {/* Header */}
      <div className={cardHeader}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={headingLg}>
              {displayName}
            </h3>
            {getStatusBadge()}
          </div>
          <p className={`text-sm font-medium ${textSecondary} mb-1`}>Project: {projectTitle}</p>
        </div>
      </div>

      {/* Request Details */}
      <div className="space-y-2 mb-4">
        <div className={cardDetailRow}>
          <span className={textMuted}>
            {isIncoming ? 'Requesting Supervisor:' : 'Target Supervisor:'}
          </span>
          <span className={textValue}>
            {displayName}
          </span>
        </div>
        <div className={cardDetailRow}>
          <span className={textMuted}>Requested:</span>
          <span className={textValue}>
            {formatDate(request.createdAt)}
          </span>
        </div>
        {request.respondedAt && (
          <div className={cardDetailRow}>
            <span className={textMuted}>Responded:</span>
            <span className={textValue}>
              {formatDate(request.respondedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Message */}
      <div className={`${infoBoxBlue} mb-4`}>
        <p className={`text-sm ${textInfoDark}`}>
          {isIncoming 
            ? `${request.requestingSupervisorName} wants to co-supervise the project "${projectTitle}" with you.`
            : `Waiting for ${request.targetSupervisorName} to respond to your partnership request for "${projectTitle}".`
          }
        </p>
      </div>

      {/* Action Buttons */}
      {request.status === 'pending' && isIncoming && onAccept && onReject && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className={`${btnSuccess} flex-1`}
            disabled={isLoading}
          >
            {isLoading ? 'Accepting...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            className={`${btnSecondary} flex-1`}
            disabled={isLoading}
          >
            {isLoading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      )}

      {request.status === 'pending' && !isIncoming && onCancel && (
        <div>
          <button
            onClick={handleCancel}
            className={`${btnDanger} w-full`}
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Request'}
          </button>
        </div>
      )}
    </div>
  );
}

