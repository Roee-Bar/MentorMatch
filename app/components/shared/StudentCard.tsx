// app/components/authenticated/StudentCard.tsx
// Component for displaying student information for partnership matching

import type { StudentCardData } from '@/types/database';

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
  const partnershipStatusColors = {
    none: 'badge-gray',
    pending_sent: 'badge-warning',
    pending_received: 'badge-warning',
    paired: 'badge-success',
  };

  const partnershipStatusLabels = {
    none: 'Available',
    pending_sent: 'Request Sent',
    pending_received: 'Has Request',
    paired: 'Paired',
  };

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
    <div className={`card-hover ${isCurrentPartner ? 'ring-2 ring-green-400' : ''}`}>
      {/* Header with Name and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex-gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-800">
              {student.fullName}
            </h3>
            {isCurrentPartner && (
              <span className="badge-success text-xs">
                Your Partner
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{student.department}</p>
        </div>
        {!isCurrentPartner && (
          <span className={partnershipStatusColors[student.partnershipStatus]}>
            {partnershipStatusLabels[student.partnershipStatus]}
          </span>
        )}
      </div>

      {/* Skills */}
      {skillsArray.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Skills:</p>
          <div className="flex flex-wrap gap-2">
            {skillsArray.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="tag-blue"
              >
                {skill}
              </span>
            ))}
            {skillsArray.length > 5 && (
              <span className="tag-gray">
                +{skillsArray.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interests */}
      {interestsArray.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Interests:</p>
          <div className="flex flex-wrap gap-2">
            {interestsArray.slice(0, 4).map((interest, index) => (
              <span
                key={index}
                className="tag-purple"
              >
                {interest}
              </span>
            ))}
            {interestsArray.length > 4 && (
              <span className="tag-gray">
                +{interestsArray.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Preferred Topics */}
      {student.preferredTopics && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Preferred Topics:</p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {student.preferredTopics}
          </p>
        </div>
      )}

      {/* Previous Projects */}
      {student.previousProjects && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Previous Projects:</p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {student.previousProjects}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Contact:</span>
          <a 
            href={`mailto:${student.email}`}
            className="text-blue-600 font-medium hover:underline truncate ml-2"
          >
            {student.email}
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      {showRequestButton && !isCurrentPartner && student.partnershipStatus === 'none' && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={handleRequestPartnership}
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Request Partnership'}
          </button>
        </div>
      )}

      {isCurrentPartner && onUnpair && (
        <div className="mt-4 pt-4 border-t flex-gap-2">
          <button
            onClick={handleUnpair}
            className="btn-danger flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Unpairing...' : 'Unpair'}
          </button>
        </div>
      )}

      {showRequestButton && student.partnershipStatus === 'paired' && !isCurrentPartner && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-center text-sm text-gray-500">
            Already paired with another student
          </div>
        </div>
      )}
    </div>
  );
}

