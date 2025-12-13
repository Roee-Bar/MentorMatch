// app/components/shared/PartnershipRequestCard.tsx
// Component for displaying partnership requests (incoming/outgoing)

import type { StudentPartnershipRequest } from '@/types/database';
import { 
  cardHover, 
  btnSuccess, 
  btnSecondary, 
  btnDanger, 
  badgeWarning,
  cardHeader,
  cardDetailRow,
  textSecondary,
  textMuted,
  textValue,
  headingLg,
  infoBoxBlue,
  linkEmail,
  textInfoDark,
  textLabel
} from '@/lib/styles/shared-styles';

interface PartnershipRequestCardProps {
  request: StudentPartnershipRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  isLoading?: boolean;
}

export default function PartnershipRequestCard({ 
  request, 
  type, 
  onAccept, 
  onReject, 
  onCancel,
  isLoading = false
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
    <div className={`${cardHover} border-l-4 border-blue-400`}>
      {/* Header */}
      <div className={cardHeader}>
        <div className="flex-1">
          <div className="flex gap-2 mb-1">
            <h3 className={headingLg}>
              {displayName}
            </h3>
            <span className={badgeWarning}>
              {isIncoming ? 'Incoming' : 'Outgoing'}
            </span>
          </div>
          <p className={`text-sm ${textSecondary}`}>{displayDepartment}</p>
          {displayStudentId && (
            <p className={textLabel}>ID: {displayStudentId}</p>
          )}
        </div>
      </div>

      {/* Request Details */}
      <div className="space-y-2 mb-4">
        <div className={cardDetailRow}>
          <span className={textMuted}>
            {isIncoming ? 'From:' : 'To:'}
          </span>
          <a 
            href={`mailto:${displayEmail}`}
            className={linkEmail}
          >
            {displayEmail}
          </a>
        </div>
        <div className={cardDetailRow}>
          <span className={textMuted}>Requested:</span>
          <span className={textValue}>
            {formatDate(request.createdAt)}
          </span>
        </div>
      </div>

      {/* Message */}
      <div className={`${infoBoxBlue} mb-4`}>
        <p className={`text-sm ${textInfoDark}`}>
          {isIncoming 
            ? `${request.requesterName} wants to partner with you for your final project.`
            : `Waiting for ${request.targetStudentName} to respond to your partnership request.`
          }
        </p>
      </div>

      {/* Action Buttons */}
      {isIncoming && onAccept && onReject && (
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

      {!isIncoming && onCancel && (
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
