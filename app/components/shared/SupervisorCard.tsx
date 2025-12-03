// app/components/shared/SupervisorCard.tsx
// Updated to work with Firebase data types

import type { SupervisorCardData } from '@/types/database';
import StatusBadge from './StatusBadge';

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
    <div className="card-hover">
      {/* Header with Name and Availability */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {supervisor.name}
          </h3>
          <p className="text-sm text-gray-600">{supervisor.department}</p>
        </div>
        <StatusBadge status={supervisor.availabilityStatus} variant="availability" />
      </div>

      {/* Bio */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
          {supervisor.bio}
        </p>
      </div>

      {/* Expertise Areas */}
      {supervisor.expertiseAreas && supervisor.expertiseAreas.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Expertise:</p>
          <div className="flex flex-wrap gap-2">
            {supervisor.expertiseAreas.slice(0, 4).map((area, index) => (
              <span
                key={index}
                className="tag-blue"
              >
                {area}
              </span>
            ))}
            {supervisor.expertiseAreas.length > 4 && (
              <span className="tag-gray">
                +{supervisor.expertiseAreas.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Research Interests */}
      {supervisor.researchInterests && supervisor.researchInterests.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Research Interests:</p>
          <div className="flex flex-wrap gap-2">
            {supervisor.researchInterests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="tag-purple"
              >
                {interest}
              </span>
            ))}
            {supervisor.researchInterests.length > 3 && (
              <span className="tag-gray">
                +{supervisor.researchInterests.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Capacity:</span>
          <span className="text-gray-800 font-medium">
            {supervisor.currentCapacity}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Contact:</span>
          <a 
            href={`mailto:${supervisor.contact}`}
            className="text-blue-600 font-medium hover:underline truncate ml-2"
          >
            {supervisor.contact}
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      {showApplyButton && supervisor.availabilityStatus !== 'unavailable' && (
        <div className="mt-4 pt-4 border-t flex-gap-2">
          <button
            onClick={handleApply}
            className="btn-primary flex-1"
          >
            Apply for Supervision
          </button>
          <button className="btn-secondary">
            View Details
          </button>
        </div>
      )}
    </div>
  );
}
