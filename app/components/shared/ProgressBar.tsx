/**
 * ProgressBar Component
 * 
 * A reusable progress indicator with automatic or manual color schemes.
 * 
 * @param current - Current progress value
 * @param max - Maximum progress value
 * @param showLabel - Whether to display the percentage label (default: false)
 * @param size - Height of the progress bar: 'sm' (h-2), 'md' (h-3), 'lg' (h-4) (default: 'md')
 * @param colorScheme - Color scheme: 'auto' (based on percentage), 'green', 'yellow', 'red', 'blue' (default: 'auto')
 * 
 * Auto color logic:
 * - Red: >= 100%
 * - Yellow: > 80%
 * - Green: <= 80%
 * 
 * @example
 * ```tsx
 * <ProgressBar current={8} max={10} colorScheme="auto" size="md" />
 * <ProgressBar current={5} max={10} colorScheme="blue" showLabel />
 * ```
 */

interface ProgressBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'auto' | 'green' | 'yellow' | 'red' | 'blue';
  className?: string;
}

export default function ProgressBar({
  current,
  max,
  showLabel = false,
  size = 'md',
  colorScheme = 'auto',
  className = '',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const getColorClass = () => {
    if (colorScheme !== 'auto') {
      return `progress-bar-${colorScheme}`;
    }

    // Auto color based on percentage
    if (percentage >= 100) {
      return 'progress-bar-red';
    } else if (percentage > 80) {
      return 'progress-bar-yellow';
    } else {
      return 'progress-bar-green';
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex-between mb-1">
          <span className="text-sm text-gray-600">
            {current} / {max}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`progress-container ${sizeClasses[size]}`}>
        <div
          className={`progress-bar ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

