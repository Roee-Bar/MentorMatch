/**
 * StatusBadge Component
 * 
 * A smart badge component with predefined status mappings for different contexts.
 * Automatically applies the correct badge styling based on variant and status value.
 * 
 * @param status - The status value to display
 * @param variant - The context type: 'application', 'availability', 'partnership', or 'custom'
 * @param customLabel - Optional custom display text (overrides default label)
 * @param customClassName - For variant='custom', provide your own badge class
 * 
 * @example
 * ```tsx
 * <StatusBadge status="pending" variant="application" />
 * <StatusBadge status="available" variant="availability" />
 * <StatusBadge status="paired" variant="partnership" customLabel="Connected" />
 * <StatusBadge status="active" variant="custom" customClassName="badge-info" customLabel="Active" />
 * ```
 */

interface StatusBadgeProps {
  status: string;
  variant?: 'application' | 'availability' | 'partnership' | 'custom';
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
    pending: { class: 'badge-warning', label: 'Pending' },
    approved: { class: 'badge-success', label: 'Approved' },
    rejected: { class: 'badge-danger', label: 'Rejected' },
    revision_requested: { class: 'badge-orange', label: 'Revision Requested' },
  };

  // Availability status mappings
  const availabilityMappings = {
    available: { class: 'badge-success', label: 'Available' },
    limited: { class: 'badge-warning', label: 'Limited Capacity' },
    unavailable: { class: 'badge-danger', label: 'Unavailable' },
  };

  // Partnership status mappings
  const partnershipMappings = {
    none: { class: 'badge-gray', label: 'Available' },
    pending_sent: { class: 'badge-warning', label: 'Request Sent' },
    pending_received: { class: 'badge-warning', label: 'Has Request' },
    paired: { class: 'badge-success', label: 'Paired' },
  };

  const getMappings = () => {
    switch (variant) {
      case 'application':
        return applicationMappings;
      case 'availability':
        return availabilityMappings;
      case 'partnership':
        return partnershipMappings;
      case 'custom':
        return {};
      default:
        return applicationMappings;
    }
  };

  const mappings = getMappings() as Record<string, { class: string; label: string }>;
  const mapping = mappings[status];

  // For custom variant, use provided className
  if (variant === 'custom') {
    return (
      <span className={`${customClassName || 'badge-base'} ${className}`}>
        {customLabel || status}
      </span>
    );
  }

  // If mapping not found, fall back to a default
  if (!mapping) {
    return (
      <span className={`badge-base ${className}`}>
        {customLabel || status}
      </span>
    );
  }

  return (
    <span className={`${mapping.class} ${className}`}>
      {customLabel || mapping.label}
    </span>
  );
}

