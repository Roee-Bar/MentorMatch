// app/components/shared/SupervisorPartnershipRequestCard.tsx
// Component for displaying supervisor partnership requests (incoming/outgoing)

import type { SupervisorPartnershipRequest } from '@/types/database';
import { formatRelativeDate } from '@/lib/utils/date';
import { useRequestCardActions } from '@/lib/hooks/useRequestCardActions';
import { useRequestCardStatus } from '@/lib/hooks/useRequestCardStatus';
import BaseRequestCard from './BaseRequestCard';
import StatusBadge from './StatusBadge';
import { 
  btnSuccess, 
  btnSecondary, 
  btnDanger, 
  cardDetailRow,
  textSecondary,
  textMuted,
  textValue,
  headingLg,
  textInfoDark,
  badgeWarning
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

  const { handleAccept, handleReject, handleCancel } = useRequestCardActions({
    requestId: request.id,
    onAccept,
    onReject,
    onCancel,
  });

  const { statusConfig } = useRequestCardStatus({
    status: request.status,
    type,
    variant: 'supervisor',
  });

  // Render status badge based on configuration
  const renderStatusBadge = () => {
    if (statusConfig.showIncomingOutgoing) {
      return (
        <span className={badgeWarning}>
          {statusConfig.isIncoming ? 'Incoming' : 'Outgoing'}
        </span>
      );
    }
    if (statusConfig.variant) {
      return <StatusBadge status={statusConfig.status} variant={statusConfig.variant} />;
    }
    return null;
  };

  return (
    <BaseRequestCard
      renderHeader={() => (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={headingLg}>
              {displayName}
            </h3>
            {renderStatusBadge()}
          </div>
          <p className={`text-sm font-medium ${textSecondary} mb-1`}>Project: {projectTitle}</p>
        </div>
      )}
      renderDetails={() => (
        <>
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
              {formatRelativeDate(request.createdAt)}
            </span>
          </div>
          {request.respondedAt && (
            <div className={cardDetailRow}>
              <span className={textMuted}>Responded:</span>
              <span className={textValue}>
                {formatRelativeDate(request.respondedAt)}
              </span>
            </div>
          )}
        </>
      )}
      renderMessage={() => (
        <p className={`text-sm ${textInfoDark}`}>
          {isIncoming 
            ? `${request.requestingSupervisorName} wants to co-supervise the project "${projectTitle}" with you.`
            : `Waiting for ${request.targetSupervisorName} to respond to your partnership request for "${projectTitle}".`
          }
        </p>
      )}
      renderActions={() => (
        <>
          {request.status === 'pending' && isIncoming && (
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
        </>
      )}
    />
  );
}

