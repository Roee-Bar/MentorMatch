// app/components/shared/StudentCard.tsx
// Component for displaying student information for partnership matching

import type { StudentCardData } from '@/types/database';
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

interface StudentCardProps {
  student: StudentCardData;
  onRequestPartnership?: (studentId: string) => void;
  showRequestButton?: boolean;
  isCurrentPartner?: boolean;
  onUnpair?: () => void;
  isLoading?: boolean;
}

export default function StudentCard({ 
  student, 
  onRequestPartnership, 
  showRequestButton = true,
  isCurrentPartner = false,
  onUnpair,
  isLoading = false
}: StudentCardProps) {
  const handleRequestPartnership = () => {
    if (onRequestPartnership) {
      onRequestPartnership(student.id);
    }
  };

  const handleUnpair = () => {
    if (onUnpair) {
      onUnpair();
    }
  };

  // Parse skills and interests
  const skillsArray = student.skills ? student.skills.split(',').map(s => s.trim()).filter(s => s) : [];
  const interestsArray = student.interests ? student.interests.split(',').map(i => i.trim()).filter(i => i) : [];

  return (
    <div className={`${cardHover} ${isCurrentPartner && ringPartnerHighlight}`}>
      {/* Header with Name and Status */}
      <div className={cardHeader}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cardTitle}>
              {student.fullName}
            </h3>
            {isCurrentPartner && (
              <span className={badgeSuccess}>
                Your Partner
              </span>
            )}
          </div>
          <p className={`text-sm ${textSecondary}`}>{student.department}</p>
        </div>
        {!isCurrentPartner && (
          <StatusBadge status={student.partnershipStatus} variant="partnership" />
        )}
      </div>

      {/* Skills */}
      {skillsArray.length > 0 && (
        <div className="mb-4">
          <p className={`${textLabel} mb-2`}>Skills:</p>
          <div className="flex flex-wrap gap-2">
            {skillsArray.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className={tagBlue}
              >
                {skill}
              </span>
            ))}
            {skillsArray.length > 5 && (
              <span className={tagGray}>
                +{skillsArray.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interests */}
      {interestsArray.length > 0 && (
        <div className="mb-4">
          <p className={`${textLabel} mb-2`}>Interests:</p>
          <div className="flex flex-wrap gap-2">
            {interestsArray.slice(0, 4).map((interest, index) => (
              <span
                key={index}
                className={tagPurple}
              >
                {interest}
              </span>
            ))}
            {interestsArray.length > 4 && (
              <span className={tagGray}>
                +{interestsArray.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Preferred Topics */}
      {student.preferredTopics && (
        <div className="mb-4">
          <p className={`${textLabel} mb-1`}>Preferred Topics:</p>
          <p className={`${textBody} line-clamp-2`}>
            {student.preferredTopics}
          </p>
        </div>
      )}

      {/* Previous Projects */}
      {student.previousProjects && (
        <div className="mb-4">
          <p className={`${textLabel} mb-1`}>Previous Projects:</p>
          <p className={`${textBody} line-clamp-2`}>
            {student.previousProjects}
          </p>
        </div>
      )}

      {/* Details */}
      <div className={cardDetailsSection}>
        <div className={cardDetailRow}>
          <span className={textMuted}>Contact:</span>
          <a 
            href={`mailto:${student.email}`}
            className={linkEmailWithTruncate}
          >
            {student.email}
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      {showRequestButton && !isCurrentPartner && student.partnershipStatus === 'none' && (
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
            {isLoading ? 'Unpairing...' : 'Unpair'}
          </button>
        </div>
      )}

      {showRequestButton && student.partnershipStatus === 'paired' && !isCurrentPartner && (
        <div className={cardActionsSection}>
          <div className={`text-center text-sm ${textMuted}`}>
            Already paired with another student
          </div>
        </div>
      )}
    </div>
  );
}
