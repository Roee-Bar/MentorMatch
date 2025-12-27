// app/components/shared/SupervisorPartnershipCard.tsx
// Component for displaying supervisor information for partnership matching

import type { Supervisor } from '@/types/database';
import StatusBadge from './StatusBadge';
import { 
  cardHover, 
  btnPrimary, 
  btnDanger, 
  badgeSuccess, 
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
  textLabel,
  textBody,
  linkEmailWithTruncate,
  ringPartnerHighlight
} from '@/lib/styles/shared-styles';

interface SupervisorPartnershipCardProps {
  supervisor: Supervisor;
  projectId?: string; // Project ID for which partnership is being requested
  onRequestPartnership?: (supervisorId: string, projectId: string) => void;
  showRequestButton?: boolean;
  isCurrentPartner?: boolean;
  onUnpair?: () => void;
  isLoading?: boolean;
}

export default function SupervisorPartnershipCard({ 
  supervisor, 
  projectId,
  onRequestPartnership, 
  showRequestButton = true,
  isCurrentPartner = false,
  onUnpair,
  isLoading = false
}: SupervisorPartnershipCardProps) {
  const handleRequestPartnership = () => {
    if (onRequestPartnership && projectId) {
      onRequestPartnership(supervisor.id, projectId);
    }
  };

  const handleUnpair = () => {
    if (onUnpair) {
      onUnpair();
    }
  };

  return (
    <div className={`${cardHover} ${isCurrentPartner ? ringPartnerHighlight : ''}`}>
      {/* Header with Name and Status */}
      <div className={cardHeader}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cardTitle}>
              {supervisor.fullName}
            </h3>
            {isCurrentPartner && (
              <span className={badgeSuccess}>
                Your Partner
              </span>
            )}
          </div>
          <p className={`text-sm ${textSecondary}`}>{supervisor.department}</p>
          {supervisor.title && (
            <p className={`text-xs ${textSecondary}`}>{supervisor.title}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {supervisor.bio && (
        <div className="mb-4">
          <p className={`${textBody} line-clamp-2`}>
            {supervisor.bio}
          </p>
        </div>
      )}

      {/* Expertise Areas */}
      {supervisor.expertiseAreas && supervisor.expertiseAreas.length > 0 && (
        <div className="mb-4">
          <p className={`${textLabel} mb-2`}>Expertise:</p>
          <div className="flex flex-wrap gap-2">
            {supervisor.expertiseAreas.slice(0, 5).map((area, index) => (
              <span
                key={index}
                className={tagBlue}
              >
                {area}
              </span>
            ))}
            {supervisor.expertiseAreas.length > 5 && (
              <span className={tagGray}>
                +{supervisor.expertiseAreas.length - 5} more
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
            {supervisor.researchInterests.slice(0, 4).map((interest, index) => (
              <span
                key={index}
                className={tagPurple}
              >
                {interest}
              </span>
            ))}
            {supervisor.researchInterests.length > 4 && (
              <span className={tagGray}>
                +{supervisor.researchInterests.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Capacity */}
      <div className="mb-4">
        <p className={`${textLabel} mb-1`}>Capacity:</p>
        <p className={textBody}>
          {supervisor.currentCapacity} / {supervisor.maxCapacity} projects
        </p>
      </div>

      {/* Details */}
      <div className={cardDetailsSection}>
        <div className={cardDetailRow}>
          <span className={textMuted}>Contact:</span>
          <a 
            href={`mailto:${supervisor.email}`}
            className={linkEmailWithTruncate}
          >
            {supervisor.email}
          </a>
        </div>
        {supervisor.officeLocation && (
          <div className={cardDetailRow}>
            <span className={textMuted}>Office:</span>
            <span className={textBody}>{supervisor.officeLocation}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {/* Note: This component is for project-based partnerships.
          onRequestPartnership should be called with projectId in the future.
          For now, show button if not current partner. */}
      {showRequestButton && !isCurrentPartner && (
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

      {isCurrentPartner && onUnpair && (
        <div className={cardActionsSection}>
          <button
            onClick={handleUnpair}
            className={`${btnDanger} flex-1`}
            disabled={isLoading}
          >
            {isLoading ? 'Removing...' : 'Remove Co-Supervisor'}
          </button>
        </div>
      )}
    </div>
  );
}

