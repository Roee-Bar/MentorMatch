/**
 * Hook for handling request card actions (accept, reject, cancel)
 * Provides standardized action handlers for partnership request cards
 */

interface UseRequestCardActionsProps {
  requestId: string;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

interface UseRequestCardActionsReturn {
  handleAccept: () => void;
  handleReject: () => void;
  handleCancel: () => void;
}

/**
 * Hook that provides action handlers for request cards
 * @param props - Request ID and optional callback functions
 * @returns Object with handler functions
 */
export function useRequestCardActions({
  requestId,
  onAccept,
  onReject,
  onCancel,
}: UseRequestCardActionsProps): UseRequestCardActionsReturn {
  const handleAccept = () => {
    if (onAccept) {
      onAccept(requestId);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(requestId);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(requestId);
    }
  };

  return {
    handleAccept,
    handleReject,
    handleCancel,
  };
}

