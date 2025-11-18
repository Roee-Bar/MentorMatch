import { Supervisor } from '@/types/dashboard';

interface SupervisorCardProps {
  supervisor: Supervisor;
}

export default function SupervisorCard({ supervisor }: SupervisorCardProps) {
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

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
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
        <p className="text-sm text-gray-700 leading-relaxed">
          {supervisor.bio}
        </p>
      </div>

      {/* Expertise Areas */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Expertise:</p>
        <div className="flex flex-wrap gap-2">
          {supervisor.expertiseAreas.map((area, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Research Interests */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Research Interests:</p>
        <div className="flex flex-wrap gap-2">
          {supervisor.researchInterests.map((interest, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Current Capacity:</span>
          <span className="text-gray-800 font-medium">
            {supervisor.currentCapacity}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Contact:</span>
          <span className="text-gray-800 font-medium">
            {supervisor.contact}
          </span>
        </div>
      </div>
    </div>
  );
}

