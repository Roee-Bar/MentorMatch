// app/components/shared/PartnershipRequestCard.tsx
// Component for displaying partnership requests (incoming/outgoing)

import type { StudentPartnershipRequest } from '@/types/database';
import { formatRelativeDate } from '@/lib/utils/date';
import { useRequestCardActions } from '@/lib/hooks/useRequestCardActions';
import BaseRequestCard from './BaseRequestCard';
import { 
  btnSuccess, 
  btnSecondary, 
  btnDanger, 
  badgeWarning,
  cardDetailRow,
  textSecondary,
  textMuted,
  textValue,
  headingLg,
  linkEmailWithTruncate,
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

  const { handleAccept, handleReject, handleCancel } = useRequestCardActions({
    requestId: request.id,
    onAccept,
    onReject,
    onCancel,
  });

  return (
    <BaseRequestCard
      renderHeader={() => (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
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
      )}
      renderDetails={() => (
        <>
          <div className={cardDetailRow}>
            <span className={textMuted}>
              {isIncoming ? 'From:' : 'To:'}
            </span>
            <a 
              href={`mailto:${displayEmail}`}
              className={linkEmailWithTruncate}
            >
              {displayEmail}
            </a>
          </div>
          <div className={cardDetailRow}>
            <span className={textMuted}>Requested:</span>
            <span className={textValue}>
              {formatRelativeDate(request.createdAt)}
            </span>
          </div>
        </>
      )}
      renderMessage={() => (
        <p className={`text-sm ${textInfoDark}`}>
          {isIncoming 
            ? `${request.requesterName} wants to partner with you for your final project.`
            : `Waiting for ${request.targetStudentName} to respond to your partnership request.`
          }
        </p>
      )}
      renderActions={() => (
        <>
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
        </>
      )}
    />
  );
}
