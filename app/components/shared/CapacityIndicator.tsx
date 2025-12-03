// app/components/shared/CapacityIndicator.tsx
// Visual capacity gauge component for supervisor authenticated page

import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';

interface CapacityIndicatorProps {
  current: number;
  max: number;
  status: 'available' | 'limited' | 'unavailable';
}

export default function CapacityIndicator({ current, max, status }: CapacityIndicatorProps) {
  // Calculate percentage
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  
  return (
    <div className="card-base">
      <div className="flex-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Capacity Status</h3>
        <StatusBadge status={status} variant="availability" />
      </div>
      
      <div className="space-y-3">
        {/* Capacity numbers */}
        <div className="flex-between">
          <span className="text-2xl font-bold text-gray-800">
            {current} / {max}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {percentage}%
          </span>
        </div>
        
        {/* Progress bar */}
        <ProgressBar
          current={current}
          max={max}
          colorScheme="auto"
          size="md"
        />
        
        <p className="text-sm text-gray-600">
          Current supervisions
        </p>
      </div>
    </div>
  );
}
