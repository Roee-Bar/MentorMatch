// app/components/shared/SupervisorCard.tsx
// Updated to work with Firebase data types

import type { SupervisorCardData } from '@/types/database';
import StatusBadge from './StatusBadge';
import { cardHover, btnPrimary, btnSecondary, tagBlue, tagPurple, tagGray } from '@/lib/styles/shared-styles';

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
    <div className={cardHover}>
      {/* Header with Name and Availability */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1 dark:text-slate-100">
            {supervisor.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">{supervisor.department}</p>
        </div>
        <StatusBadge status={supervisor.availabilityStatus} variant="availability" />
      </div>

      {/* Bio */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 dark:text-slate-300">
          {supervisor.bio}
        </p>
      </div>

      {/* Expertise Areas */}
      {supervisor.expertiseAreas && supervisor.expertiseAreas.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 dark:text-slate-400">Expertise:</p>
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
          <p className="text-xs text-gray-500 mb-2 dark:text-slate-400">Research Interests:</p>
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
      <div className="space-y-2 border-t pt-4 dark:border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Capacity:</span>
          <span className="text-gray-800 font-medium dark:text-slate-200">
            {supervisor.currentCapacity}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Contact:</span>
          <a 
            href={`mailto:${supervisor.contact}`}
            className="text-blue-600 font-medium hover:underline truncate ml-2 dark:text-blue-400"
          >
            {supervisor.contact}
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      {showApplyButton && supervisor.availabilityStatus !== 'unavailable' && (
        <div className="mt-4 pt-4 border-t flex gap-2 dark:border-slate-700">
          <button
            onClick={handleApply}
            className={`${btnPrimary} flex-1`}
          >
            Apply for Supervision
          </button>
          <button className={btnSecondary}>
            View Details
          </button>
        </div>
      )}
    </div>
  );
}
