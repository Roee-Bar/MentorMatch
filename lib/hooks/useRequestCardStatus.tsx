/**
 * Hook for handling request card status badge logic
 * Provides status configuration for partnership request cards
 * 
 * Note: This hook returns data, not JSX, following React hooks best practices.
 * Components should use this data to render the appropriate badge.
 */

interface UseRequestCardStatusProps {
  status: string;
  type: 'incoming' | 'outgoing';
  variant?: 'student' | 'supervisor';
}

export interface StatusBadgeConfig {
  status: string;
  variant?: 'application' | 'availability' | 'partnership' | 'matchStatus' | 'supervisorPartnership' | 'custom';
  showIncomingOutgoing: boolean;
  isIncoming: boolean;
  isPending: boolean;
}

interface UseRequestCardStatusReturn {
  statusConfig: StatusBadgeConfig;
  isPending: boolean;
}

/**
 * Hook that provides status badge configuration for request cards
 * @param props - Status string, request type (incoming/outgoing), and variant (student/supervisor)
 * @returns Object with status configuration and status flags
 */
export function useRequestCardStatus({
  status,
  type,
  variant = 'student',
}: UseRequestCardStatusProps): UseRequestCardStatusReturn {
  const isIncoming = type === 'incoming';
  const isPending = status === 'pending';

  // Determine if we should show incoming/outgoing badge (only for pending status)
  const showIncomingOutgoing = isPending;

  // Determine the StatusBadge variant
  let badgeVariant: StatusBadgeConfig['variant'];
  if (variant === 'supervisor' && !isPending) {
    badgeVariant = 'supervisorPartnership';
  } else if (variant === 'student') {
    // Student partnerships don't use StatusBadge for pending, only incoming/outgoing
    badgeVariant = undefined;
  }

  return {
    statusConfig: {
      status,
      variant: badgeVariant,
      showIncomingOutgoing,
      isIncoming,
      isPending,
    },
    isPending,
  };
}

