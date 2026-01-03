'use client';

// Component for displaying student names (with optional partner) in a consistent format
// Used to eliminate duplication across ApplicationCard and ApplicationStatusModal

interface StudentNamesDisplayProps {
  hasPartner?: boolean;
  studentName?: string;
  partnerName?: string;
  studentEmail?: string;
  showEmail?: boolean;
  variant?: 'inline' | 'detailed';
  className?: string;
  textMuted?: string;
  textSecondary?: string;
}

export default function StudentNamesDisplay({
  hasPartner = false,
  studentName,
  partnerName,
  studentEmail,
  showEmail = false,
  variant = 'inline',
  className = '',
  textMuted = 'text-gray-500 dark:text-gray-400',
  textSecondary = 'text-gray-700 dark:text-gray-300',
}: StudentNamesDisplayProps) {
  const hasBothNames = hasPartner && partnerName && studentName;

  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 text-sm ${className}`}>
        {hasBothNames ? (
          <>
            <p>
              <span className={textMuted}>Students:</span>{' '}
              <span className={`font-medium dark:text-slate-200 ${textSecondary}`}>
                {studentName} & {partnerName}
              </span>
            </p>
            {showEmail && studentEmail && (
              <p>
                <span className={textMuted}>Email:</span>{' '}
                <span className={`dark:text-slate-300 ${textSecondary}`}>{studentEmail}</span>
              </p>
            )}
            <p className="text-blue-600 dark:text-blue-400">
              <span className={textMuted}>Team Project</span>
            </p>
          </>
        ) : (
          <>
            <p>
              <span className={textMuted}>Student:</span>{' '}
              <span className={`font-medium dark:text-slate-200 ${textSecondary}`}>
                {studentName}
              </span>
            </p>
            {showEmail && studentEmail && (
              <p>
                <span className={textMuted}>Email:</span>{' '}
                <span className={`dark:text-slate-300 ${textSecondary}`}>{studentEmail}</span>
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // Inline variant (for ApplicationCard)
  return (
    <p className={`text-sm ${textSecondary} ${className}`}>
      {hasBothNames ? (
        <>
          Students: <span className="font-medium">{studentName} & {partnerName}</span>
        </>
      ) : (
        <>
          Student: <span className="font-medium">{studentName}</span>
        </>
      )}
    </p>
  );
}

