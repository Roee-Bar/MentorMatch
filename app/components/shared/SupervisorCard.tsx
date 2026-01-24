// app/components/shared/SupervisorCard.tsx
// Updated to work with Firebase data types

import type { SupervisorCardData } from '@/types/database';
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
  linkEmailWithTruncate
} from '@/lib/styles/shared-styles';

interface SupervisorCardProps {
  supervisor: SupervisorCardData;
  onApply?: (supervisorId: string) => void;
  showApplyButton?: boolean;
}

export default function SupervisorCard({ 
  supervisor, 
  onApply,
  showApplyButton = true 
}: SupervisorCardProps) {
  const handleApply = () => {
    if (onApply) {
      onApply(supervisor.id);
    }
  };

  return (
    <div className={`${cardHover} h-full flex flex-col`}>
      {/* Header with Name and Availability */}
      <div className={cardHeader}>
        <div className="flex-1">
          <h3 className={cardTitle}>
            {supervisor.name}
          </h3>
          <p className={`text-sm ${textSecondary}`}>{supervisor.department}</p>
        </div>
        <StatusBadge status={supervisor.availabilityStatus} variant="availability" />
      </div>

      {/* Bio */}
      <div className="mb-4 flex-1">
        <p className={`${textDescription} line-clamp-3`}>
          {supervisor.bio}
        </p>
      </div>

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
            {supervisor.currentCapacity}
          </span>
        </div>
        <div className={cardDetailRow}>
          <span className={textMuted}>Contact:</span>
          <a 
            href={`mailto:${supervisor.contact}`}
            className={linkEmailWithTruncate}
          >
            {supervisor.contact}
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      {showApplyButton && supervisor.availabilityStatus !== 'unavailable' && (
        <div className={cardActionsSection}>
          <button
            onClick={handleApply}
            className={`${btnPrimary} w-full`}
          >
            Apply for Supervision
          </button>
        </div>
      )}
    </div>
  );
}
