/**
 * Hook for handling request card status badge logic
 * Provides status badge component and display logic for partnership request cards
 */

import { ReactNode } from 'react';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { badgeWarning } from '@/lib/styles/shared-styles';

interface UseRequestCardStatusProps {
  status: string;
  type: 'incoming' | 'outgoing';
  variant?: 'student' | 'supervisor';
}

interface UseRequestCardStatusReturn {
  statusBadge: ReactNode;
  isPending: boolean;
}

/**
 * Hook that provides status badge component and status checks for request cards
 * @param props - Status string, request type (incoming/outgoing), and variant (student/supervisor)
 * @returns Object with status badge component and status flags
 */
export function useRequestCardStatus({
  status,
  type,
  variant = 'student',
}: UseRequestCardStatusProps): UseRequestCardStatusReturn {
  const isIncoming = type === 'incoming';
  const isPending = status === 'pending';

  const getStatusBadge = (): ReactNode => {
    // For supervisor partnerships, use StatusBadge component
    if (variant === 'supervisor') {
      // For pending status, show incoming/outgoing badge
      if (status === 'pending') {
        return <span className={badgeWarning}>{isIncoming ? 'Incoming' : 'Outgoing'}</span>;
      }
      // For other statuses, use StatusBadge component
      return <StatusBadge status={status} variant="supervisorPartnership" />;
    }
    
    // For student partnerships, show simple incoming/outgoing badge
    return <span className={badgeWarning}>{isIncoming ? 'Incoming' : 'Outgoing'}</span>;
  };

  return {
    statusBadge: getStatusBadge(),
    isPending,
  };
}

