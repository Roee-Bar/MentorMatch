/**
 * StatusBadge Component
 * 
 * A smart badge component with predefined status mappings for different contexts.
 * Automatically applies the correct badge styling based on variant and status value.
 * 
 * @param status - The status value to display
 * @param variant - The context type: 'application', 'availability', 'partnership', 'matchStatus', or 'custom'
 * @param customLabel - Optional custom display text (overrides default label)
 * @param customClassName - For variant='custom', provide your own badge class
 * 
 * @example
 * ```tsx
 * <StatusBadge status="pending" variant="application" />
 * <StatusBadge status="available" variant="availability" />
 * <StatusBadge status="paired" variant="partnership" customLabel="Connected" />
 * <StatusBadge status="matched" variant="matchStatus" />
 * <StatusBadge status="active" variant="custom" customClassName="bg-blue-100 text-blue-800" customLabel="Active" />
 * ```
 */

import { badgeBase } from '@/lib/styles/shared-styles';

// Badge color variants with dark mode support
const badgeStyles = {
  success: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`,
  warning: `${badgeBase} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`,
  danger: `${badgeBase} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`,
  info: `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`,
  orange: `${badgeBase} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`,
  gray: `${badgeBase} bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200`,
};

interface StatusBadgeProps {
  status: string;
  variant?: 'application' | 'availability' | 'partnership' | 'matchStatus' | 'supervisorPartnership' | 'custom';
  customLabel?: string;
  customClassName?: string;
  className?: string;
}

export default function StatusBadge({
  status,
  variant = 'application',
  customLabel,
  customClassName,
  className = '',
}: StatusBadgeProps) {
  // Application status mappings
  const applicationMappings = {
    pending: { style: badgeStyles.warning, label: 'Pending' },
    approved: { style: badgeStyles.success, label: 'Approved' },
    rejected: { style: badgeStyles.danger, label: 'Rejected' },
    revision_requested: { style: badgeStyles.orange, label: 'Revision Requested' },
  };

  // Availability status mappings
  const availabilityMappings = {
    available: { style: badgeStyles.success, label: 'Available' },
    limited: { style: badgeStyles.warning, label: 'Limited Capacity' },
    unavailable: { style: badgeStyles.danger, label: 'Unavailable' },
  };

  // Partnership status mappings
  const partnershipMappings = {
    none: { style: badgeStyles.gray, label: 'Available' },
    pending_sent: { style: badgeStyles.warning, label: 'Request Sent' },
    pending_received: { style: badgeStyles.warning, label: 'Has Request' },
    paired: { style: badgeStyles.success, label: 'Paired' },
  };

  // Match status mappings (for student-supervisor matching)
  const matchStatusMappings = {
    matched: { style: badgeStyles.success, label: 'Matched' },
    pending: { style: badgeStyles.warning, label: 'Pending' },
    unmatched: { style: badgeStyles.gray, label: 'Unmatched' },
  };

  // Supervisor partnership status mappings
  const supervisorPartnershipMappings = {
    pending: { style: badgeStyles.warning, label: 'Pending' },
    accepted: { style: badgeStyles.success, label: 'Accepted' },
    rejected: { style: badgeStyles.info, label: 'Rejected' },
    cancelled: { style: badgeStyles.info, label: 'Cancelled' },
  };

  const getMappings = () => {
    switch (variant) {
      case 'application':
        return applicationMappings;
      case 'availability':
        return availabilityMappings;
      case 'partnership':
        return partnershipMappings;
      case 'matchStatus':
        return matchStatusMappings;
      case 'supervisorPartnership':
        return supervisorPartnershipMappings;
      case 'custom':
        return {};
      default:
        return applicationMappings;
    }
  };

  const mappings = getMappings() as Record<string, { style: string; label: string }>;
  const mapping = mappings[status];

  // For custom variant, use provided className
  if (variant === 'custom') {
    return (
      <span className={`${badgeBase} ${customClassName || ''} ${className}`}>
        {customLabel || status}
      </span>
    );
  }

  // If mapping not found, fall back to a default
  if (!mapping) {
    return (
      <span className={`${badgeBase} ${className}`}>
        {customLabel || status}
      </span>
    );
  }

  return (
    <span className={`${mapping.style} ${className}`}>
      {customLabel || mapping.label}
    </span>
  );
}
