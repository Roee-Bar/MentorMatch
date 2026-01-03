// app/components/shared/RequestActionButtons.tsx
// Reusable component for partnership request action buttons
// Handles Accept/Reject buttons for incoming requests and Cancel button for outgoing requests

import { 
  btnSuccess, 
  btnSecondary, 
  btnDanger
} from '@/lib/styles/shared-styles';

interface RequestActionButtonsProps {
  /**
   * Whether this is an incoming request (from another user)
   */
  isIncoming: boolean;
  
  /**
   * Whether actions are currently loading
   */
  isLoading: boolean;
  
  /**
   * Request status - only pending requests show action buttons
   */
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  
  /**
   * Handler for accept action
   */
  onAccept?: () => void;
  
  /**
   * Handler for reject action
   */
  onReject?: () => void;
  
  /**
   * Handler for cancel action
   */
  onCancel?: () => void;
  
  /**
   * Variant type (for future extensibility)
   */
  variant?: 'student' | 'supervisor';
}

/**
 * Reusable action buttons component for partnership request cards
 * Renders appropriate buttons based on request type (incoming/outgoing) and status
 */
export default function RequestActionButtons({
  isIncoming,
  isLoading,
  status = 'pending',
  onAccept,
  onReject,
  onCancel,
}: RequestActionButtonsProps) {
  // Only show buttons for pending requests
  if (status !== 'pending') {
    return null;
  }

  // Incoming requests: show Accept and Reject buttons
  if (isIncoming && onAccept && onReject) {
    return (
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className={`${btnSuccess} flex-1`}
          disabled={isLoading}
        >
          {isLoading ? 'Accepting...' : 'Accept'}
        </button>
        <button
          onClick={onReject}
          className={`${btnSecondary} flex-1`}
          disabled={isLoading}
        >
          {isLoading ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    );
  }

  // Outgoing requests: show Cancel button
  if (!isIncoming && onCancel) {
    return (
      <div>
        <button
          onClick={onCancel}
          className={`${btnDanger} w-full`}
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Request'}
        </button>
      </div>
    );
  }

  // No buttons to show
  return null;
}

