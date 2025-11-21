// app/components/dashboard/SupervisorCard.tsx
// Updated to work with Firebase data types

import type { SupervisorCardData } from '@/types/database';

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
  const availabilityColors = {
    available: 'bg-green-100 text-green-800',
    limited: 'bg-yellow-100 text-yellow-800',
    unavailable: 'bg-red-100 text-red-800',
  };

  const availabilityLabels = {
    available: 'Available',
    limited: 'Limited Capacity',
    unavailable: 'Unavailable',
  };

  const handleApply = () => {
    if (onApply) {
      onApply(supervisor.id);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header with Name and Availability */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {supervisor.name}
          </h3>
          <p className="text-sm text-gray-600">{supervisor.department}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            availabilityColors[supervisor.availabilityStatus]
          }`}
        >
          {availabilityLabels[supervisor.availabilityStatus]}
        </span>
      </div>

      {/* Bio */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
          {supervisor.bio}
        </p>
      </div>

      {/* Expertise Areas */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Expertise:</p>
        <div className="flex flex-wrap gap-2">
          {supervisor.expertiseAreas.slice(0, 4).map((area, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
            >
              {area}
            </span>
          ))}
          {supervisor.expertiseAreas.length > 4 && (
            <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
              +{supervisor.expertiseAreas.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Research Interests */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Research Interests:</p>
        <div className="flex flex-wrap gap-2">
          {supervisor.researchInterests.slice(0, 3).map((interest, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
            >
              {interest}
            </span>
          ))}
          {supervisor.researchInterests.length > 3 && (
            <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
              +{supervisor.researchInterests.length - 3} more
            </span>
          )}
        </div>
      </div>

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
        <div className="mt-4 pt-4 border-t flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply for Supervision
          </button>
          <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            View Details
          </button>
        </div>
      )}
    </div>
  );
}