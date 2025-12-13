// app/components/shared/CapacityIndicator.tsx
// Visual capacity gauge component for supervisor authenticated page

import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { cardBase, textSecondary, headingLgSemibold, heading2xl } from '@/lib/styles/shared-styles';

interface CapacityIndicatorProps {
  current: number;
  max: number;
  status: 'available' | 'limited' | 'unavailable';
}

export default function CapacityIndicator({ current, max, status }: CapacityIndicatorProps) {
  // Calculate percentage
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  
  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={headingLgSemibold}>Capacity Status</h3>
        <StatusBadge status={status} variant="availability" />
      </div>
      
      <div className="space-y-3">
        {/* Capacity numbers */}
        <div className="flex items-center justify-between">
          <span className={heading2xl}>
            {current} / {max}
          </span>
          <span className={`text-sm font-medium ${textSecondary}`}>
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
        
        <p className={`text-sm ${textSecondary}`}>
          Current supervisions
        </p>
      </div>
    </div>
  );
}
