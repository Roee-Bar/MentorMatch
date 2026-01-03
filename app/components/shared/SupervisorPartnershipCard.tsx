// app/components/shared/SupervisorPartnershipCard.tsx
// Component for displaying supervisor information for partnership selection

import type { Supervisor } from '@/types/database';
import StatusBadge from './StatusBadge';
import { 
  cardHover, 
  btnPrimary, 
  btnSecondary, 
  tagBlue, 
  tagPurple, 
  tagGray,
  cardHeader,
  cardTitle,
  cardDetailsSection,
  cardDetailRow,
  cardActionsSection,
  textSecondary,
  textMuted,
  textValue,
  textLabel,
  textDescription,
  linkEmailWithTruncate,
  capacityAvailable,
  capacityUnavailable,
  infoBoxGray
} from '@/lib/styles/shared-styles';

interface SupervisorPartnershipCardProps {
  supervisor: Supervisor;
  onRequestPartnership?: (supervisorId: string) => void;
  showRequestButton?: boolean;
  isLoading?: boolean;
}

export default function SupervisorPartnershipCard({ 
  supervisor, 
  onRequestPartnership,
  showRequestButton = true,
  isLoading = false
}: SupervisorPartnershipCardProps) {
  const handleRequestPartnership = () => {
    if (onRequestPartnership) {
      onRequestPartnership(supervisor.id);
    }
  };

  const availableCapacity = supervisor.maxCapacity - supervisor.currentCapacity;
  const hasCapacity = availableCapacity > 0;

  return (
    <div className={cardHover}>
      {/* Header with Name and Availability */}
      <div className={cardHeader}>
        <div className="flex-1">
          <h3 className={cardTitle}>
            {supervisor.fullName}
          </h3>
          <p className={`text-sm ${textSecondary}`}>{supervisor.department}</p>
        </div>
        <StatusBadge status={supervisor.availabilityStatus} variant="availability" />
      </div>

      {/* Bio */}
      {supervisor.bio && (
        <div className="mb-4">
          <p className={`${textDescription} line-clamp-3`}>
            {supervisor.bio}
          </p>
        </div>
      )}

      {/* Expertise Areas */}
      {supervisor.expertiseAreas && supervisor.expertiseAreas.length > 0 && (
        <div className="mb-4">
          <p className={`${textLabel} mb-2`}>Expertise:</p>
          <div className="flex flex-wrap gap-2">
            {supervisor.expertiseAreas.slice(0, 4).map((area, index) => (
              <span
                key={index}
                className={tagBlue}
              >
                {area}
              </span>
            ))}
            {supervisor.expertiseAreas.length > 4 && (
              <span className={tagGray}>
                +{supervisor.expertiseAreas.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Research Interests */}
      {supervisor.researchInterests && supervisor.researchInterests.length > 0 && (
        <div className="mb-4">
          <p className={`${textLabel} mb-2`}>Research Interests:</p>
          <div className="flex flex-wrap gap-2">
            {supervisor.researchInterests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className={tagPurple}
              >
                {interest}
              </span>
            ))}
            {supervisor.researchInterests.length > 3 && (
              <span className={tagGray}>
                +{supervisor.researchInterests.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <div className={cardDetailsSection}>
        <div className={cardDetailRow}>
          <span className={textMuted}>Capacity:</span>
          <span className={textValue}>
            {supervisor.currentCapacity} / {supervisor.maxCapacity}
          </span>
        </div>
        <div className={cardDetailRow}>
          <span className={textMuted}>Available Slots:</span>
          <span className={hasCapacity ? capacityAvailable : capacityUnavailable}>
            {availableCapacity}
          </span>
        </div>
        {supervisor.email && (
          <div className={cardDetailRow}>
            <span className={textMuted}>Contact:</span>
            <a 
              href={`mailto:${supervisor.email}`}
              className={linkEmailWithTruncate}
            >
              {supervisor.email}
            </a>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showRequestButton && hasCapacity && supervisor.availabilityStatus !== 'unavailable' && (
        <div className={cardActionsSection}>
          <button
            onClick={handleRequestPartnership}
            className={`${btnPrimary} w-full`}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Request Partnership'}
          </button>
        </div>
      )}

      {!hasCapacity && (
        <div className={`mt-4 ${infoBoxGray}`}>
          <p className={`text-sm ${textMuted}`}>
            No available capacity
          </p>
        </div>
      )}
    </div>
  );
}

